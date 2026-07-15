function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get llmChatBaseUrl() {
    return process.env.LLM_CHAT_BASE_URL ?? "http://localhost:8080/v1";
  },
  get llmChatModel() {
    return process.env.LLM_CHAT_MODEL ?? "gemma-4-12b-it-Q4_K_M.gguf";
  },
  get llmClassifierBaseUrl() {
    return process.env.LLM_CLASSIFIER_BASE_URL ?? "http://localhost:8081/v1";
  },
  get llmClassifierModel() {
    return process.env.LLM_CLASSIFIER_MODEL ?? "gemma-3-4b-it-q4_0.gguf";
  },
};
