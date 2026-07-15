import type { DimensionOptions } from "@/server/category-options";

export function buildClassificationSystemPrompt(options: DimensionOptions): string {
  const exampleJson = JSON.stringify(
    {
      business_category: options.business_category[0],
      usage_purpose: options.usage_purpose[0],
      task_type: options.task_type[0],
      improvement_type: options.improvement_type[0],
      automation_potential: options.automation_potential[0],
      rag_candidate: false,
      sensitivity_level: options.sensitivity_level[0],
      confidence: 0.8,
    },
    null,
    2,
  );

  return `あなたは社内向け生成AI利用ログの分類アシスタントです。
与えられた「質問」（と存在すれば「回答」）を読み、指定された各項目に最も当てはまる値を選んでください。

## 出力形式（最重要）
- 出力は下記キーを持つ**JSONオブジェクト1つのみ**とすること。
- 説明文・前置き・Markdownのコードフェンス(\`\`\`)は一切付けないこと。1文字目は "{"、最後の文字は "}" にすること。
- 例:
${exampleJson}

## 分類ルール
- 各項目は必ず選択肢の中から1つだけ選ぶこと。選択肢にない値を作らないこと。
- automation_potential は、この種の質問への対応を定型化・自動化できる度合いを表す。
- rag_candidate は、社内ドキュメント（RAG）を整備すれば同種の質問に高品質に回答できそうな場合に true (真偽値)。
- sensitivity_level は、質問・回答に含まれる可能性のある情報の機密度を保守的に（疑わしきは高めに）判定する。
- confidence は 0〜1 の数値で、分類結果に対する自分の確信度。

## 選択肢
業務カテゴリ(business_category): ${options.business_category.join(", ")}
利用目的(usage_purpose): ${options.usage_purpose.join(", ")}
タスク種別(task_type): ${options.task_type.join(", ")}
改善視点(improvement_type): ${options.improvement_type.join(", ")}
機密度(sensitivity_level): ${options.sensitivity_level.join(", ")}
自動化可能性(automation_potential): ${options.automation_potential.join(", ")}`;
}

export function buildClassificationUserPrompt(promptMasked: string, responseMasked?: string): string {
  const parts = [`質問:\n${promptMasked}`];
  if (responseMasked) {
    parts.push(`回答:\n${responseMasked}`);
  }
  return parts.join("\n\n");
}
