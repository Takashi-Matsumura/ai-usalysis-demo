import { listCategoryOptions } from "@/server/admin-settings";
import { CLASSIFICATION_DIMENSION_COLUMNS } from "@/server/analytics";
import { addCategoryOptionAction, toggleCategoryOptionAction } from "./actions";

const DIMENSION_LABELS: Record<string, string> = {
  business_category: "業務カテゴリ",
  usage_purpose: "利用目的",
  task_type: "タスク種別",
  improvement_type: "改善視点",
  automation_potential: "自動化可能性",
  sensitivity_level: "機密度",
};

export default async function AdminCategorySettingsPage() {
  const options = await listCategoryOptions();
  const byDimension = CLASSIFICATION_DIMENSION_COLUMNS.map((dimension) => ({
    dimension,
    items: options.filter((o) => o.dimension === dimension),
  }));

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-lg font-semibold">分類カテゴリ設定</h2>
      <p className="text-xs text-foreground/50">
        ここで無効化した選択肢は、以後のAI自動分類で選ばれなくなります（既存の分類結果は変わりません）。
      </p>

      {byDimension.map(({ dimension, items }) => (
        <section key={dimension}>
          <h3 className="mb-3 text-sm font-semibold">{DIMENSION_LABELS[dimension] ?? dimension}</h3>
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              >
                <span>
                  {item.label}
                  <span className="ml-2 text-xs text-foreground/40">v{item.version}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className={item.enabled ? "text-xs text-foreground/60" : "text-xs text-foreground/30"}>
                    {item.enabled ? "有効" : "無効"}
                  </span>
                  <form action={toggleCategoryOptionAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="nextEnabled" value={(!item.enabled).toString()} />
                    <button type="submit" className="text-xs underline">
                      {item.enabled ? "無効化" : "有効化"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="max-w-lg rounded-xl border border-black/10 p-4 dark:border-white/15">
        <h3 className="mb-3 text-sm font-semibold">選択肢を追加</h3>
        <form action={addCategoryOptionAction} className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">分類項目</span>
            <select
              name="dimension"
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/15"
            >
              {CLASSIFICATION_DIMENSION_COLUMNS.map((dimension) => (
                <option key={dimension} value={dimension}>
                  {DIMENSION_LABELS[dimension] ?? dimension}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">値（英数字・一意）</span>
            <input
              name="value"
              required
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">表示ラベル</span>
            <input
              name="label"
              required
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">表示順（数値、小さいほど先頭）</span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={0}
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
            />
          </label>
          <button type="submit" className="mt-2 rounded-lg bg-foreground px-4 py-2 text-background">
            追加
          </button>
        </form>
      </section>
    </div>
  );
}
