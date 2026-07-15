import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { wrapLanguageModel, extractJsonMiddleware } from "ai";
import { env } from "@/config/env";

export type LlmModelConfig = {
  baseURL: string;
  model: string;
  providerName?: string;
  apiKey?: string;
};

export function resolveChatModel(config: LlmModelConfig) {
  return createOpenAICompatible({
    baseURL: config.baseURL,
    name: config.providerName ?? "local-llama-cpp",
    apiKey: config.apiKey,
    includeUsage: true,
  }).chatModel(config.model);
}

// ローカルモデルは response_format:json_object を送ってもコードフェンス付きで
// JSONを返すことがあるため、構造化出力にはJSON抽出ミドルウェアを常に噛ませる。
export function resolveClassifierModel(config: LlmModelConfig) {
  return wrapLanguageModel({
    model: resolveChatModel(config),
    middleware: extractJsonMiddleware(),
  });
}

export function defaultChatModelConfig(): LlmModelConfig {
  return { baseURL: env.llmChatBaseUrl, model: env.llmChatModel };
}

export function defaultClassifierModelConfig(): LlmModelConfig {
  return { baseURL: env.llmClassifierBaseUrl, model: env.llmClassifierModel };
}
