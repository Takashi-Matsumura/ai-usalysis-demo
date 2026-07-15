import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import type { UserRole } from "@/generated/prisma/enums";
import { loginAsAction } from "./actions";

function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "システム管理者";
    case "analyst":
      return "管理者";
    default:
      return "一般利用者";
  }
}

export default async function LoginPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) redirect("/chat");

  const users = await prisma.user.findMany({
    where: { status: "active" },
    include: { department: true },
    orderBy: { displayName: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">AI利用分析デモ</h1>
        <p className="mt-1 text-sm text-foreground/70">
          デモ用の疑似ログインです。パスワードは不要です。利用するユーザーを選択してください。
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <li key={user.id}>
            <form action={loginAsAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-left transition hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
              >
                <span>
                  <span className="block font-medium">{user.displayName}</span>
                  <span className="block text-xs text-foreground/60">
                    {user.department.name} ・ {roleLabel(user.role)}
                  </span>
                </span>
                <span className="text-xs text-foreground/50">{user.email}</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
