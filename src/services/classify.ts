import { generateObject } from "ai";
import { resolveClassifierModel, type LlmModelConfig } from "@/providers/llm";
import { buildClassificationSchema, type ClassificationResult } from "@/schemas/classification";
import { buildClassificationSystemPrompt, buildClassificationUserPrompt } from "@/prompts/classification";
import { getEnabledCategoryOptions } from "@/server/category-options";

const MAX_ATTEMPTS = 3;

export async function classify(
  config: LlmModelConfig,
  promptMasked: string,
  responseMasked?: string,
): Promise<ClassificationResult> {
  const options = await getEnabledCategoryOptions();
  const schema = buildClassificationSchema(options);
  const systemPrompt = buildClassificationSystemPrompt(options);

  const model = resolveClassifierModel(config);
  const userPrompt = buildClassificationUserPrompt(promptMasked, responseMasked);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        schema,
        system: systemPrompt,
        prompt:
          attempt === 1
            ? userPrompt
            : `${userPrompt}\n\n(前回の出力は選択肢にない値を含んでいたため無効でした。必ず選択肢の中からのみ選び直してください。エラー: ${describeError(lastError)})`,
      });
      return object;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`分類に${MAX_ATTEMPTS}回失敗しました: ${describeError(lastError)}`);
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const cause = err.cause instanceof Error ? `: ${err.cause.message}` : "";
    return `${err.message}${cause}`;
  }
  return String(err);
}
