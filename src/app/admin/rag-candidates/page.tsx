import { getRagCandidates } from "@/server/analytics";
import { resolveDateRange, resolvePagination, toURLSearchParams } from "@/server/analytics-query";
import { CandidateList } from "@/components/dashboard/CandidateList";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminRagCandidatesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = toURLSearchParams(await searchParams);
  const range = resolveDateRange(sp);
  const { page, pageSize } = resolvePagination(sp);
  const { items, total } = await getRagCandidates(range, page, pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">RAG候補一覧</h2>
        <p className="text-xs text-foreground/50">
          社内ドキュメント整備によって回答品質が上がりそうな質問（該当 {total} 件）
        </p>
      </div>
      <CandidateList items={items} />
    </div>
  );
}
