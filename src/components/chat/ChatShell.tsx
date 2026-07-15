"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { logoutAction } from "@/app/login/actions";
import { Markdown } from "@/components/chat/Markdown";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type SessionSummary = {
  id: string;
  title: string | null;
  updatedAt: string;
};

type Props = {
  sessions: SessionSummary[];
  activeSessionId?: string;
  initialMessages: ChatMessage[];
  displayName: string;
  departmentName: string;
  canViewDashboard: boolean;
};

function ThinkingIndicator() {
  return (
    <span className="flex items-center gap-2 text-foreground/50">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="text-xs">考え中...</span>
    </span>
  );
}

export function ChatShell({
  sessions,
  activeSessionId,
  initialMessages,
  displayName,
  departmentName,
  canViewDashboard,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef(activeSessionId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { id: `local-${Date.now()}-user`, role: "user", content: text }]);
    setIsStreaming(true);

    // 送信直後(サーバー側の前処理〜LLMの初回トークン到着まで)からThinkingIndicatorを
    // 表示し続けるため、プレースホルダーはfetch呼び出し前に追加する。
    const assistantId = `local-${Date.now()}-assistant`;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message: text }),
      });

      if (!res.ok || !res.body) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? `エラーが発生しました (${res.status})`);
      }

      const newSessionId = res.headers.get("X-Session-Id");
      const isNewSession = !sessionIdRef.current && !!newSessionId;
      if (newSessionId) sessionIdRef.current = newSessionId;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)),
        );
      }

      if (isNewSession && newSessionId) {
        router.push(`/chat/${newSessionId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
      // 中身が届く前に失敗した場合は空のプレースホルダーを残さない(部分的に届いていれば残す)。
      setMessages((prev) => prev.filter((m) => !(m.id === assistantId && !m.content)));
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/10 p-4 dark:border-white/15 sm:flex">
        <Link
          href="/chat"
          className="mb-4 block rounded-lg border border-black/10 px-3 py-2 text-center text-sm hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
        >
          + 新しい会話
        </Link>
        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/chat/${s.id}`}
                className={`block truncate rounded-lg px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 ${
                  s.id === activeSessionId ? "bg-black/5 dark:bg-white/10" : ""
                }`}
              >
                {s.title || "無題の会話"}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/15">
          <div>
            <h1 className="text-sm font-semibold">AI利用分析デモ</h1>
            <p className="text-xs text-foreground/60">
              {displayName}（{departmentName}）
            </p>
          </div>
          <div className="flex items-center gap-4">
            {canViewDashboard && (
              <Link href="/admin" className="text-xs text-foreground/60 underline">
                ダッシュボードへ
              </Link>
            )}
            <form action={logoutAction}>
              <button type="submit" className="text-xs text-foreground/60 underline">
                ログアウト
              </button>
            </form>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {messages.length === 0 && (
            <p className="text-sm text-foreground/50">質問を入力してAIに送信してください。</p>
          )}
          {messages.map((m, i) => {
            const isLastAssistantMessage = m.role === "assistant" && i === messages.length - 1;
            const isThinking = isStreaming && isLastAssistantMessage && !m.content;
            const isGenerating = isStreaming && isLastAssistantMessage && !!m.content;

            return (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-lg whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user" ? "bg-foreground text-background" : "bg-black/5 dark:bg-white/10"
                  }`}
                >
                  {isThinking ? (
                    <ThinkingIndicator />
                  ) : m.role === "assistant" ? (
                    <>
                      <Markdown content={m.content} />
                      {isGenerating && (
                        <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle" />
                      )}
                    </>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            );
          })}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/10 p-4 dark:border-white/15">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="質問を入力..."
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-40"
          >
            {isStreaming && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
            )}
            {isStreaming ? "送信中..." : "送信"}
          </button>
        </form>
      </div>
    </div>
  );
}
