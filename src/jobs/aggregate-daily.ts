import { prisma } from "@/server/db";

type DailyStatRow = {
  department_id: string;
  request_count: bigint | number;
  active_user_count: bigint | number;
  input_tokens: bigint | number | null;
  output_tokens: bigint | number | null;
  estimated_cost: string | number | null;
  average_latency_ms: string | number | null;
  error_count: bigint | number;
};

type CategoryStatRow = {
  department_id: string;
  value: string;
  count: bigint | number;
};

const DIMENSION_COLUMNS = [
  "business_category",
  "usage_purpose",
  "task_type",
  "improvement_type",
  "automation_potential",
  "sensitivity_level",
] as const;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function aggregateDaily(targetDate: Date): Promise<void> {
  const dayStart = startOfUtcDay(targetDate);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const statRows = await prisma.$queryRaw<DailyStatRow[]>`
    SELECT
      department_id,
      COUNT(*)::int AS request_count,
      COUNT(DISTINCT user_id)::int AS active_user_count,
      COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
      COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
      COALESCE(SUM(estimated_cost), 0) AS estimated_cost,
      AVG(latency_ms)::int AS average_latency_ms,
      COUNT(*) FILTER (WHERE status != 'success')::int AS error_count
    FROM ai_requests
    WHERE created_at >= ${dayStart} AND created_at < ${dayEnd}
    GROUP BY department_id
  `;

  for (const row of statRows) {
    await prisma.dailyStatistic.upsert({
      where: { aggregationDate_departmentId: { aggregationDate: dayStart, departmentId: row.department_id } },
      create: {
        aggregationDate: dayStart,
        departmentId: row.department_id,
        requestCount: Number(row.request_count),
        activeUserCount: Number(row.active_user_count),
        inputTokens: Number(row.input_tokens ?? 0),
        outputTokens: Number(row.output_tokens ?? 0),
        estimatedCost: Number(row.estimated_cost ?? 0),
        averageLatencyMs: row.average_latency_ms != null ? Number(row.average_latency_ms) : null,
        errorCount: Number(row.error_count),
      },
      update: {
        requestCount: Number(row.request_count),
        activeUserCount: Number(row.active_user_count),
        inputTokens: Number(row.input_tokens ?? 0),
        outputTokens: Number(row.output_tokens ?? 0),
        estimatedCost: Number(row.estimated_cost ?? 0),
        averageLatencyMs: row.average_latency_ms != null ? Number(row.average_latency_ms) : null,
        errorCount: Number(row.error_count),
      },
    });
  }

  for (const dimension of DIMENSION_COLUMNS) {
    const rows = await prisma.$queryRawUnsafe<CategoryStatRow[]>(
      `SELECT r.department_id AS department_id, c.${dimension} AS value, COUNT(*)::int AS count
       FROM ai_requests r
       JOIN request_classifications c ON c.request_id = r.id
       WHERE r.created_at >= $1 AND r.created_at < $2
       GROUP BY r.department_id, c.${dimension}`,
      dayStart,
      dayEnd,
    );

    for (const row of rows) {
      await prisma.dailyCategoryStatistic.upsert({
        where: {
          aggregationDate_departmentId_dimension_value: {
            aggregationDate: dayStart,
            departmentId: row.department_id,
            dimension,
            value: row.value,
          },
        },
        create: {
          aggregationDate: dayStart,
          departmentId: row.department_id,
          dimension,
          value: row.value,
          count: Number(row.count),
        },
        update: { count: Number(row.count) },
      });
    }
  }
}
