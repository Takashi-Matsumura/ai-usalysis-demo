import { NextResponse } from "next/server";
import { getCurrentUser, hasAtLeastRole } from "@/server/auth";
import { unauthorized, forbidden, apiError } from "@/server/api-responses";
import { listCategoryOptions, addCategoryOption, CategoryOptionInputSchema } from "@/server/admin-settings";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasAtLeastRole(user, "admin")) return forbidden();

  const { searchParams } = new URL(request.url);
  const dimension = searchParams.get("dimension") ?? undefined;
  const options = await listCategoryOptions(dimension);
  return NextResponse.json({ options });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasAtLeastRole(user, "admin")) return forbidden();

  const body = await request.json().catch(() => null);
  const parsed = CategoryOptionInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "invalid_request", parsed.error.issues.map((i) => i.message).join("; "));
  }

  const option = await addCategoryOption(parsed.data);
  return NextResponse.json({ option }, { status: 201 });
}
