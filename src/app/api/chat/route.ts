import { NextResponse, after } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { maskText } from "@/lib/masking";
import { resolveChatModel } from "@/providers/llm";
import { getActiveModelSetting, toLlmModelConfig } from "@/server/model-settings";
import { classifyAiRequest } from "@/jobs/classify-request";

const ChatRequestSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(8000),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "ログインが必要です" } },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "入力が不正です" } },
      { status: 400 },
    );
  }
  const { message, sessionId } = parsed.data;

  const existingSession = sessionId
    ? await prisma.chatSession.findFirst({ where: { id: sessionId, userId: user.id } })
    : null;
  if (sessionId && !existingSession) {
    return NextResponse.json(
      { error: { code: "not_found", message: "会話が見つかりません" } },
      { status: 404 },
    );
  }
  const session =
    existingSession ??
    (await prisma.chatSession.create({
      data: { userId: user.id, title: message.slice(0, 40) },
    }));

  const modelSetting = await getActiveModelSetting("chat");
  if (!modelSetting) {
    return NextResponse.json(
      { error: { code: "no_model", message: "利用可能なモデルが設定されていません" } },
      { status: 503 },
    );
  }

  const priorMessages = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { sequenceNumber: "asc" },
  });

  const { masked: promptMasked } = maskText(message);
  const nextSeq = (priorMessages.at(-1)?.sequenceNumber ?? 0) + 1;

  const userMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "user",
      contentMasked: promptMasked,
      sequenceNumber: nextSeq,
    },
  });

  const history = priorMessages.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.contentMasked,
  }));

  const model = resolveChatModel(toLlmModelConfig(modelSetting));
  const startedAt = Date.now();

  const result = streamText({
    model,
    messages: [...history, { role: "user" as const, content: promptMasked }],
    onEnd: async (event) => {
      const latencyMs = Date.now() - startedAt;
      const { masked: responseMasked } = maskText(event.text);

      const assistantMessage = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "assistant",
          contentMasked: responseMasked,
          sequenceNumber: nextSeq + 1,
        },
      });
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      });

      const aiRequest = await prisma.aiRequest.create({
        data: {
          userId: user.id,
          departmentId: user.departmentId,
          sessionId: session.id,
          requestMessageId: userMessage.id,
          responseMessageId: assistantMessage.id,
          provider: modelSetting.provider,
          model: modelSetting.modelName,
          isLocal: modelSetting.isLocal,
          promptMasked,
          responseMasked,
          inputTokens: event.usage.inputTokens ?? null,
          outputTokens: event.usage.outputTokens ?? null,
          latencyMs,
          status: "success",
          classificationStatus: "pending",
        },
      });

      // 分類は応答のレイテンシに影響させない。ここで失敗してもワーカーがpendingを拾って再処理する。
      after(() => classifyAiRequest(aiRequest.id));
    },
    onError: async ({ error }) => {
      const latencyMs = Date.now() - startedAt;
      console.error("[api/chat] streamText error:", error);
      await prisma.aiRequest.create({
        data: {
          userId: user.id,
          departmentId: user.departmentId,
          sessionId: session.id,
          requestMessageId: userMessage.id,
          provider: modelSetting.provider,
          model: modelSetting.modelName,
          isLocal: modelSetting.isLocal,
          promptMasked,
          latencyMs,
          status: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
          classificationStatus: "skipped",
        },
      });
    },
  });

  return result.toTextStreamResponse({
    headers: { "X-Session-Id": session.id },
  });
}
