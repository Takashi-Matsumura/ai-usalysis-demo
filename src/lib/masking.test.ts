import { describe, expect, it } from "vitest";
import { maskText } from "./masking";

describe("maskText", () => {
  it("masks email addresses", () => {
    const { masked, matches } = maskText("連絡先は taro.yamada@example.co.jp です。");
    expect(masked).toBe("連絡先は [MASKED:EMAIL] です。");
    expect(matches).toEqual([{ rule: "EMAIL", count: 1 }]);
  });

  it("masks Japanese phone numbers with hyphens", () => {
    const { masked } = maskText("電話番号は 03-1234-5678 です。");
    expect(masked).toBe("電話番号は [MASKED:PHONE] です。");
  });

  it("masks Japanese phone numbers without hyphens", () => {
    const { masked } = maskText("携帯は 09012345678 です。");
    expect(masked).toBe("携帯は [MASKED:PHONE] です。");
  });

  it("masks credit card-like numbers", () => {
    const { masked } = maskText("カード番号 4111-1111-1111-1111 を使ってください。");
    expect(masked).toBe("カード番号 [MASKED:CREDIT_CARD] を使ってください。");
  });

  it("masks api key assignments", () => {
    const { masked } = maskText("api_key=sk-abcdefghijklmnopqrstuvwx123456 を設定してください。");
    expect(masked).toBe("[MASKED:API_KEY] を設定してください。");
  });

  it("masks password assignments", () => {
    const { masked } = maskText("password: Sup3rSecretValue を使ってログインしてください。");
    expect(masked).toBe("[MASKED:PASSWORD] を使ってログインしてください。");
  });

  it("masks internal URLs", () => {
    const { masked } = maskText("社内システムは http://wiki.internal/pages/123 を参照してください。");
    expect(masked).toBe("社内システムは [MASKED:INTERNAL_URL] を参照してください。");
  });

  it("masks private IP URLs", () => {
    const { masked } = maskText("http://192.168.1.10:8080/admin にアクセスしてください。");
    expect(masked).toBe("[MASKED:INTERNAL_URL] にアクセスしてください。");
  });

  it("leaves ordinary business text untouched", () => {
    const text = "来週の会議で新製品の売上目標について議論します。";
    const { masked, matches } = maskText(text);
    expect(masked).toBe(text);
    expect(matches).toEqual([]);
  });

  it("does not falsely mask plain numbers or normal URLs", () => {
    const text = "在庫数は1234個で、詳細はhttps://example.com/docsを参照してください。";
    const { masked, matches } = maskText(text);
    expect(masked).toBe(text);
    expect(matches).toEqual([]);
  });

  it("reports counts across multiple matches of the same rule", () => {
    const { matches } = maskText("a@example.com と b@example.com に連絡してください。");
    expect(matches).toEqual([{ rule: "EMAIL", count: 2 }]);
  });
});
