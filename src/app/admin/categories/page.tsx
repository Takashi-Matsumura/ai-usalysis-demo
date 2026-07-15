import { getCategoryBreakdown, CLASSIFICATION_DIMENSION_COLUMNS } from "@/server/analytics";
import { resolveDateRange, toURLSearchParams } from "@/server/analytics-query";
import { BarChart } from "@/components/dashboard/BarChart";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DIMENSION_LABELS: Record<string, string> = {
  business_category: "業務カテゴリ",
  usage_purpose: "利用目的",
  task_type: "タスク種別",
  improvement_type: "改善視点",
  automation_potential: "自動化可能性",
  sensitivity_level: "機密度",
};

export default async function AdminCategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const range = resolveDateRange(toURLSearchParams(await searchParams));
  const categories = await getCategoryBreakdown(range);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">カテゴリ別分析</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {CLASSIFICATION_DIMENSION_COLUMNS.map((dimension) => (
          <section key={dimension} className="rounded-xl border border-black/10 p-4 dark:border-white/15">
            <h3 className="mb-3 text-sm font-semibold">{DIMENSION_LABELS[dimension]}</h3>
            <BarChart items={(categories[dimension] ?? []).map((c) => ({ label: c.value, value: c.count }))} />
          </section>
        ))}
      </div>
    </div>
  );
}
