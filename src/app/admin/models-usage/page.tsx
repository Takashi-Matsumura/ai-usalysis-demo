import { getModelStats } from "@/server/analytics";
import { resolveDateRange, toURLSearchParams } from "@/server/analytics-query";
import { BarChart } from "@/components/dashboard/BarChart";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminModelsUsagePage({ searchParams }: { searchParams: SearchParams }) {
  const range = resolveDateRange(toURLSearchParams(await searchParams));
  const models = await getModelStats(range);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">モデル別利用状況</h2>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/15">
        <h3 className="mb-3 text-sm font-semibold">利用件数比較</h3>
        <BarChart items={models.map((m) => ({ label: `${m.provider}/${m.model}`, value: m.requestCount }))} />
      </section>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs text-foreground/50 dark:border-white/15">
              <th className="py-2 pr-4">プロバイダー</th>
              <th className="py-2 pr-4">モデル</th>
              <th className="py-2 pr-4 text-right">利用件数</th>
              <th className="py-2 pr-4 text-right">入力トークン</th>
              <th className="py-2 pr-4 text-right">出力トークン</th>
              <th className="py-2 pr-4 text-right">推定コスト</th>
              <th className="py-2 pr-4 text-right">平均レスポンス</th>
              <th className="py-2 pr-4 text-right">エラー件数</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={`${m.provider}:${m.model}`} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2 pr-4">{m.provider}</td>
                <td className="py-2 pr-4">{m.model}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{m.requestCount.toLocaleString("ja-JP")}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{m.inputTokens.toLocaleString("ja-JP")}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{m.outputTokens.toLocaleString("ja-JP")}</td>
                <td className="py-2 pr-4 text-right tabular-nums">${m.estimatedCost.toFixed(2)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {m.averageLatencyMs != null ? `${(m.averageLatencyMs / 1000).toFixed(1)}秒` : "-"}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{m.errorCount.toLocaleString("ja-JP")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
