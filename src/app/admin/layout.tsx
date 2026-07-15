import Link from "next/link";
import { requireRole } from "@/server/auth";
import { logoutAction } from "@/app/login/actions";
import type { UserRole } from "@/generated/prisma/enums";

const NAV = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/departments", label: "部署別分析" },
  { href: "/admin/categories", label: "カテゴリ別分析" },
  { href: "/admin/models-usage", label: "モデル別利用状況" },
  { href: "/admin/rag-candidates", label: "RAG候補一覧" },
  { href: "/admin/automation-candidates", label: "自動化候補一覧" },
];

const ADMIN_ONLY_NAV = [
  { href: "/admin/settings/models", label: "モデル設定" },
  { href: "/admin/settings/categories", label: "分類カテゴリ設定" },
];

function roleLabel(role: UserRole): string {
  return role === "admin" ? "システム管理者" : "管理者";
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("analyst");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-black/10 p-4 dark:border-white/15 sm:flex">
        <p className="mb-4 text-xs font-semibold text-foreground/50">管理者メニュー</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <>
              <p className="mt-4 mb-1 text-xs font-semibold text-foreground/50">システム管理者メニュー</p>
              {ADMIN_ONLY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="mt-auto pt-4">
          <Link
            href="/chat"
            className="block rounded-lg px-3 py-2 text-sm text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
          >
            ← チャットへ戻る
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/15">
          <h1 className="text-sm font-semibold">AI利用分析管理画面</h1>
          <div className="flex items-center gap-3">
            <p className="text-xs text-foreground/60">
              {user.displayName}（{roleLabel(user.role)}）
            </p>
            <form action={logoutAction}>
              <button type="submit" className="text-xs text-foreground/60 underline">
                ログアウト
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
