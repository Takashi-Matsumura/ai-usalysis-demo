import { prisma } from "@/server/db";
import type { ModelRole } from "@/generated/prisma/enums";
import type { LlmModelConfig } from "@/providers/llm";

export async function getActiveModelSetting(role: "chat" | "classifier") {
  return prisma.modelSetting.findFirst({
    where: { enabled: true, OR: [{ role: role as ModelRole }, { role: "both" }] },
    orderBy: { createdAt: "asc" },
  });
}

export function toLlmModelConfig(modelSetting: {
  baseUrl: string;
  modelName: string;
  provider: string;
  apiKeyRef: string | null;
}): LlmModelConfig {
  return {
    baseURL: modelSetting.baseUrl,
    model: modelSetting.modelName,
    providerName: modelSetting.provider,
    apiKey: modelSetting.apiKeyRef ? process.env[modelSetting.apiKeyRef] : undefined,
  };
}
