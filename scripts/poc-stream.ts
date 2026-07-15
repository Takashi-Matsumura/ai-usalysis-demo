import { streamText } from "ai";
import { resolveChatModel, defaultChatModelConfig } from "@/providers/llm";

async function main() {
  const model = resolveChatModel(defaultChatModelConfig());
  const result = streamText({
    model,
    prompt: "日本語で一言、こんにちはと挨拶してください。",
  });

  process.stdout.write("[stream] ");
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  process.stdout.write("\n");

  const usage = await result.usage;
  const finishReason = await result.finishReason;
  console.log("[usage]", usage);
  console.log("[finishReason]", finishReason);
}

main().catch((err) => {
  console.error("[poc-stream] failed:", err);
  process.exit(1);
});
