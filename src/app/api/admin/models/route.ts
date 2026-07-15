import { NextResponse } from "next/server";
import { getCurrentUser, hasAtLeastRole } from "@/server/auth";
import { unauthorized, forbidden, apiError } from "@/server/api-responses";
import { listModelSettings, upsertModelSetting, ModelSettingInputSchema } from "@/server/admin-settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasAtLeastRole(user, "admin")) return forbidden();

  const models = await listModelSettings();
  return NextResponse.json({ models });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasAtLeastRole(user, "admin")) return forbidden();

  const body = await request.json().catch(() => null);
  const parsed = ModelSettingInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "invalid_request", parsed.error.issues.map((i) => i.message).join("; "));
  }

  const model = await upsertModelSetting(parsed.data);
  return NextResponse.json({ model }, { status: 201 });
}
