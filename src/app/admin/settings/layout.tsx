import { requireRole } from "@/server/auth";

export default async function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return <>{children}</>;
}
