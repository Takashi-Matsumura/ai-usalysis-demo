import { NextResponse } from "next/server";

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function unauthorized() {
  return apiError(401, "unauthorized", "ログインが必要です");
}

export function forbidden() {
  return apiError(403, "forbidden", "権限がありません");
}
