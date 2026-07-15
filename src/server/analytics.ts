import { prisma } from "@/server/db";
import { requireRole } from "@/server/auth";
import type { DateRange } from "@/server/analytics-query";

export const CLASSIFICATION_DIMENSION_COLUMNS = [
  "business_category",
  "usage_purpose",
  "task_type",
  "improvement_type",
  "automation_potential",
  "sensitivity_level",
] as const;

export type ClassificationDimension = (typeof CLASSIFICATION_DIMENSION_COLUMNS)[number];

type TotalsRow = {
  request_count: number;
  active_user_count: number;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: string | number | null;
  average_latency_ms: string | number | null;
  error_count: number;
};

export type Summary = {
  requestCount: number;
  activeUserCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  averageLatencyMs: number | null;
  errorRate: number;
  dailyCounts: { date: string; count: number }[];
  monthlyCounts: { month: string; count: number }[];
};

export async function getSummary({ from, to }: DateRange): Promise<Summary> {
  await requireRole("analyst");

  const [totals] = await prisma.$queryRaw<TotalsRow[]>`
    SELECT
      COUNT(*)::int AS request_count,
      COUNT(DISTINCT user_id)::int AS active_user_count,
      COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
      COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
      COALESCE(SUM(estimated_cost), 0) AS estimated_cost,
      AVG(latency_ms)::int AS average_latency_ms,
      COUNT(*) FILTER (WHERE status != 'success')::int AS error_count
    FROM ai_requests
    WHERE created_at >= ${from} AND created_at < ${to}
  `;

  const dailyCounts = await prisma.$queryRaw<{ date: string; count: number }[]>`
    SELECT to_char(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
    FROM ai_requests
    WHERE created_at >= ${from} AND created_at < ${to}
    GROUP BY 1
    ORDER BY 1
  `;

  const monthlyCounts = await prisma.$queryRaw<{ month: string; count: number }[]>`
    SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
    FROM ai_requests
    WHERE created_at >= ${from} AND created_at < ${to}
    GROUP BY 1
    ORDER BY 1
  `;

  const requestCount = totals?.request_count ?? 0;
  const errorCount = totals?.error_count ?? 0;

  return {
    requestCount,
    activeUserCount: totals?.active_user_count ?? 0,
    inputTokens: totals?.input_tokens ?? 0,
    outputTokens: totals?.output_tokens ?? 0,
    estimatedCost: Number(totals?.estimated_cost ?? 0),
    averageLatencyMs: totals?.average_latency_ms != null ? Number(totals.average_latency_ms) : null,
    errorRate: requestCount > 0 ? errorCount / requestCount : 0,
    dailyCounts,
    monthlyCounts,
  };
}

export async function getCategoryBreakdown(
  { from, to }: DateRange,
  dimensions: ClassificationDimension[] = [...CLASSIFICATION_DIMENSION_COLUMNS],
): Promise<Record<string, { value: string; count: number }[]>> {
  await requireRole("analyst");

  const result: Record<string, { value: string; count: number }[]> = {};
  for (const dimension of dimensions) {
    if (!CLASSIFICATION_DIMENSION_COLUMNS.includes(dimension)) {
      throw new Error(`不正な dimension です: ${dimension}`);
    }
    result[dimension] = await prisma.$queryRawUnsafe<{ value: string; count: number }[]>(
      `SELECT c.${dimension} AS value, COUNT(*)::int AS count
       FROM ai_requests r
       JOIN request_classifications c ON c.request_id = r.id
       WHERE r.created_at >= $1 AND r.created_at < $2
       GROUP BY c.${dimension}
       ORDER BY count DESC`,
      from,
      to,
    );
  }
  return result;
}

type DepartmentRow = {
  department_id: string;
  department_name: string;
  request_count: number;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: string | number | null;
  error_count: number;
};

export type DepartmentStat = {
  departmentId: string;
  departmentName: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  errorCount: number;
};

export async function getDepartmentStats({ from, to }: DateRange): Promise<DepartmentStat[]> {
  await requireRole("analyst");

  const rows = await prisma.$queryRaw<DepartmentRow[]>`
    SELECT
      d.id AS department_id,
      d.name AS department_name,
      COUNT(r.id)::int AS request_count,
      COALESCE(SUM(r.input_tokens), 0)::int AS input_tokens,
      COALESCE(SUM(r.output_tokens), 0)::int AS output_tokens,
      COALESCE(SUM(r.estimated_cost), 0) AS estimated_cost,
      COUNT(*) FILTER (WHERE r.status != 'success')::int AS error_count
    FROM departments d
    LEFT JOIN ai_requests r ON r.department_id = d.id AND r.created_at >= ${from} AND r.created_at < ${to}
    GROUP BY d.id, d.name
    ORDER BY request_count DESC
  `;

  return rows.map((row) => ({
    departmentId: row.department_id,
    departmentName: row.department_name,
    requestCount: row.request_count,
    inputTokens: row.input_tokens ?? 0,
    outputTokens: row.output_tokens ?? 0,
    estimatedCost: Number(row.estimated_cost ?? 0),
    errorCount: row.error_count,
  }));
}

type ModelRow = {
  provider: string;
  model: string;
  request_count: number;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: string | number | null;
  average_latency_ms: string | number | null;
  error_count: number;
};

export type ModelStat = {
  provider: string;
  model: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  averageLatencyMs: number | null;
  errorCount: number;
};

export async function getModelStats({ from, to }: DateRange): Promise<ModelStat[]> {
  await requireRole("analyst");

  const rows = await prisma.$queryRaw<ModelRow[]>`
    SELECT
      provider,
      model,
      COUNT(*)::int AS request_count,
      COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
      COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
      COALESCE(SUM(estimated_cost), 0) AS estimated_cost,
      AVG(latency_ms)::int AS average_latency_ms,
      COUNT(*) FILTER (WHERE status != 'success')::int AS error_count
    FROM ai_requests
    WHERE created_at >= ${from} AND created_at < ${to}
    GROUP BY provider, model
    ORDER BY request_count DESC
  `;

  return rows.map((row) => ({
    provider: row.provider,
    model: row.model,
    requestCount: row.request_count,
    inputTokens: row.input_tokens ?? 0,
    outputTokens: row.output_tokens ?? 0,
    estimatedCost: Number(row.estimated_cost ?? 0),
    averageLatencyMs: row.average_latency_ms != null ? Number(row.average_latency_ms) : null,
    errorCount: row.error_count,
  }));
}

export type CandidateItem = {
  requestId: string;
  createdAt: string;
  departmentName: string;
  businessCategory: string;
  usagePurpose: string;
  taskType: string;
  confidence: number;
  promptExcerpt: string;
};

export async function getRagCandidates(
  { from, to }: DateRange,
  page: number,
  pageSize: number,
): Promise<{ items: CandidateItem[]; total: number }> {
  await requireRole("analyst");

  const where = { ragCandidate: true, request: { createdAt: { gte: from, lt: to } } } as const;
  const [rows, total] = await Promise.all([
    prisma.requestClassification.findMany({
      where,
      include: { request: { include: { department: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.requestClassification.count({ where }),
  ]);
  return { items: rows.map(toCandidateItem), total };
}

export async function getAutomationCandidates(
  { from, to }: DateRange,
  page: number,
  pageSize: number,
): Promise<{ items: CandidateItem[]; total: number }> {
  await requireRole("analyst");

  // 「候補」は自動化可能性が「高」と判定されたものに限定する。
  const where = { automationPotential: "高", request: { createdAt: { gte: from, lt: to } } } as const;
  const [rows, total] = await Promise.all([
    prisma.requestClassification.findMany({
      where,
      include: { request: { include: { department: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.requestClassification.count({ where }),
  ]);
  return { items: rows.map(toCandidateItem), total };
}

function toCandidateItem(c: {
  requestId: string;
  createdAt: Date;
  businessCategory: string;
  usagePurpose: string;
  taskType: string;
  confidence: unknown;
  request: { promptMasked: string; department: { name: string } };
}): CandidateItem {
  return {
    requestId: c.requestId,
    createdAt: c.createdAt.toISOString(),
    departmentName: c.request.department.name,
    businessCategory: c.businessCategory,
    usagePurpose: c.usagePurpose,
    taskType: c.taskType,
    confidence: Number(c.confidence),
    promptExcerpt: c.request.promptMasked.slice(0, 200),
  };
}
