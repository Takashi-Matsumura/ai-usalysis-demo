import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/server/session";
import type { UserRole } from "@/generated/prisma/enums";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
};

// リクエスト内で複数回呼ばれても実際のDB照会は1回だけになるようcache()でメモ化する。
// （認可チェックをDAL層の各所に置く方針のため、重複呼び出しが増える前提）
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = await verifySessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { department: true },
  });
  if (!user || user.status !== "active") return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: user.department.name,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

const ROLE_RANK: Record<UserRole, number> = { user: 0, analyst: 1, admin: 2 };

export function hasAtLeastRole(user: SessionUser, role: UserRole): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[role];
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasAtLeastRole(user, role)) redirect("/chat");
  return user;
}
