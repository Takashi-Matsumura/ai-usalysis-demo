import { notFound } from "next/navigation";
import { requireUser, hasAtLeastRole } from "@/server/auth";
import { prisma } from "@/server/db";
import { ChatShell } from "@/components/chat/ChatShell";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser();
  const { sessionId } = await params;

  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) notFound();

  const [sessions, messages] = await Promise.all([
    prisma.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { sequenceNumber: "asc" },
    }),
  ]);

  return (
    <ChatShell
      sessions={sessions.map((s) => ({ ...s, updatedAt: s.updatedAt.toISOString() }))}
      activeSessionId={session.id}
      initialMessages={messages.map((m) => ({ id: m.id, role: m.role, content: m.contentMasked }))}
      displayName={user.displayName}
      departmentName={user.departmentName}
      canViewDashboard={hasAtLeastRole(user, "analyst")}
    />
  );
}
