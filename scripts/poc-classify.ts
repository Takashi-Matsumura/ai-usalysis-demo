import { defaultClassifierModelConfig } from "@/providers/llm";
import { classify } from "@/services/classify";

const samples = [
  "見積書のテンプレートを使って、A社向けの御見積書を作成してください。単価は10万円、数量3個です。",
  "このReactコンポーネントでuseEffectの依存配列が正しいかレビューしてください。",
  "先月の有給休暇取得率を部署別に集計する方法を教えてください。",
];

async function main() {
  const config = defaultClassifierModelConfig();

  for (const sample of samples) {
    const object = await classify(config, sample);
    console.log("---");
    console.log("[input]", sample);
    console.log("[classification]", object);
  }
}

main().catch((err) => {
  console.error("[poc-classify] failed:", err);
  process.exit(1);
});
