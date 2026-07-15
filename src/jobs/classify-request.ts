import { prisma } from "@/server/db";
import { classify } from "@/services/classify";
import { CLASSIFICATION_VERSION } from "@/schemas/classification";
import { getActiveModelSetting, toLlmModelConfig } from "@/server/model-settings";

const MAX_RETRY_COUNT = 5;

function backoffMs(attempt: number): number {
  return Math.min(60_000 * 2 ** (attempt - 1), 30 * 60_000);
}

export async function classifyAiRequest(requestId: string): Promise<void> {
  const aiRequest = await prisma.aiRequest.findUnique({ where: { id: requestId } });
  if (!aiRequest || aiRequest.classificationStatus === "done") return;

  await prisma.aiRequest.update({
    where: { id: requestId },
    data: { classificationStatus: "processing" },
  });

  const modelSetting = await getActiveModelSetting("classifier");
  if (!modelSetting) {
    await prisma.aiRequest.update({
      where: { id: requestId },
      data: { classificationStatus: "skipped" },
    });
    return;
  }

  try {
    const result = await classify(
      toLlmModelConfig(modelSetting),
      aiRequest.promptMasked,
      aiRequest.responseMasked ?? undefined,
    );

    await prisma.requestClassification.upsert({
      where: { requestId },
      create: {
        requestId,
        businessCategory: result.business_category,
        usagePurpose: result.usage_purpose,
        taskType: result.task_type,
        improvementType: result.improvement_type,
        automationPotential: result.automation_potential,
        ragCandidate: result.rag_candidate,
        sensitivityLevel: result.sensitivity_level,
        confidence: result.confidence,
        classifierProvider: modelSetting.provider,
        classifierModel: modelSetting.modelName,
        classificationVersion: CLASSIFICATION_VERSION,
        rawResult: result,
      },
      update: {
        businessCategory: result.business_category,
        usagePurpose: result.usage_purpose,
        taskType: result.task_type,
        improvementType: result.improvement_type,
        automationPotential: result.automation_potential,
        ragCandidate: result.rag_candidate,
        sensitivityLevel: result.sensitivity_level,
        confidence: result.confidence,
        classifierProvider: modelSetting.provider,
        classifierModel: modelSetting.modelName,
        classificationVersion: CLASSIFICATION_VERSION,
        rawResult: result,
      },
    });

    await prisma.aiRequest.update({
      where: { id: requestId },
      data: { classificationStatus: "done" },
    });
  } catch (err) {
    const nextRetryCount = aiRequest.retryCount + 1;
    const giveUp = nextRetryCount >= MAX_RETRY_COUNT;
    await prisma.aiRequest.update({
      where: { id: requestId },
      data: {
        classificationStatus: "failed",
        retryCount: nextRetryCount,
        nextAttemptAt: giveUp ? null : new Date(Date.now() + backoffMs(nextRetryCount)),
      },
    });
    console.error(`[classifyAiRequest] ${requestId} failed:`, err);
  }
}
