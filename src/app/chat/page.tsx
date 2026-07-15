import { requireUser, hasAtLeastRole } from "@/server/auth";
import { prisma } from "@/server/db";
import { ChatShell } from "@/components/chat/ChatShell";

export default async function ChatIndexPage() {
  const user = await requireUser();
  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return (
    <ChatShell
      sessions={sessions.map((s) => ({ ...s, updatedAt: s.updatedAt.toISOString() }))}
      initialMessages={[]}
      displayName={user.displayName}
      departmentName={user.departmentName}
      canViewDashboard={hasAtLeastRole(user, "analyst")}
    />
  );
}
