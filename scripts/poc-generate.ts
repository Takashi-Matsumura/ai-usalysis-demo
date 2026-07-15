import { generateText } from "ai";
import { resolveChatModel, defaultChatModelConfig } from "@/providers/llm";

async function main() {
  const model = resolveChatModel(defaultChatModelConfig());
  const result = await generateText({
    model,
    prompt: "日本語で一言、こんにちはと挨拶してください。",
  });
  console.log("[text]", result.text);
  console.log("[usage]", result.usage);
}

main().catch((err) => {
  console.error("[poc-generate] failed:", err);
  process.exit(1);
});
