import { getSummary } from "@/server/analytics";
import { resolveDateRange, toURLSearchParams } from "@/server/analytics-query";
import { StatTile } from "@/components/dashboard/StatTile";
import { BarChart } from "@/components/dashboard/BarChart";
import { TrendChart } from "@/components/dashboard/TrendChart";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const range = resolveDateRange(toURLSearchParams(await searchParams));
  const summary = await getSummary(range);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">利用状況ダッシュボード</h2>
        <p className="text-xs text-foreground/50">
          期間: {formatDate(range.from)} 〜 {formatDate(range.to)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="利用件数" value={summary.requestCount.toLocaleString("ja-JP")} />
        <StatTile label="アクティブユーザー数" value={summary.activeUserCount.toLocaleString("ja-JP")} />
        <StatTile label="入力トークン" value={summary.inputTokens.toLocaleString("ja-JP")} />
        <StatTile label="出力トークン" value={summary.outputTokens.toLocaleString("ja-JP")} />
        <StatTile label="推定コスト" value={`$${summary.estimatedCost.toFixed(2)}`} />
        <StatTile
          label="平均レスポンス時間"
          value={summary.averageLatencyMs != null ? `${(summary.averageLatencyMs / 1000).toFixed(1)}秒` : "-"}
        />
        <StatTile label="エラー率" value={`${(summary.errorRate * 100).toFixed(1)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold">日別利用件数</h3>
          <TrendChart data={summary.dailyCounts.map((d) => ({ label: d.date, value: d.count }))} />
        </section>
        <section className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold">月別利用件数</h3>
          <BarChart items={summary.monthlyCounts.map((m) => ({ label: m.month, value: m.count }))} />
        </section>
      </div>
    </div>
  );
}
