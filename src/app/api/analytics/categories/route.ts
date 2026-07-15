import { NextResponse } from "next/server";
import { getCurrentUser, hasAtLeastRole } from "@/server/auth";
import { unauthorized, forbidden, apiError } from "@/server/api-responses";
import { resolveDateRange } from "@/server/analytics-query";
import {
  getCategoryBreakdown,
  CLASSIFICATION_DIMENSION_COLUMNS,
  type ClassificationDimension,
} from "@/server/analytics";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasAtLeastRole(user, "analyst")) return forbidden();

  const { searchParams } = new URL(request.url);
  let range;
  try {
    range = resolveDateRange(searchParams);
  } catch (err) {
    return apiError(400, "invalid_request", err instanceof Error ? err.message : "不正なリクエストです");
  }

  const dimensionParam = searchParams.get("dimension");
  if (dimensionParam && !CLASSIFICATION_DIMENSION_COLUMNS.includes(dimensionParam as ClassificationDimension)) {
    return apiError(
      400,
      "invalid_request",
      `dimensionは次のいずれかにしてください: ${CLASSIFICATION_DIMENSION_COLUMNS.join(", ")}`,
    );
  }
  const dimensions = dimensionParam
    ? [dimensionParam as ClassificationDimension]
    : [...CLASSIFICATION_DIMENSION_COLUMNS];

  const categories = await getCategoryBreakdown(range, dimensions);
  return NextResponse.json({
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    categories,
  });
}
