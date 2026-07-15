import "dotenv/config";
import pino from "pino";
import { prisma } from "@/server/db";
import { classifyAiRequest } from "@/jobs/classify-request";

const logger = pino({
  name: "classification-worker",
  transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
});

const POLL_INTERVAL_MS = 3000;
const BATCH_SIZE = 5;

let shuttingDown = false;

async function claimBatch(batchSize: number): Promise<string[]> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM ai_requests
      WHERE classification_status = 'pending'
         OR (classification_status = 'failed' AND next_attempt_at IS NOT NULL AND next_attempt_at <= now())
      ORDER BY created_at ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    `;
    const ids = rows.map((r) => r.id);
    if (ids.length > 0) {
      await tx.aiRequest.updateMany({
        where: { id: { in: ids } },
        data: { classificationStatus: "processing" },
      });
    }
    return ids;
  });
}

async function runOnce(): Promise<number> {
  const ids = await claimBatch(BATCH_SIZE);
  if (ids.length === 0) return 0;

  logger.info({ count: ids.length }, "分類ジョブを取得しました");
  for (const id of ids) {
    try {
      await classifyAiRequest(id);
      logger.info({ id }, "分類が完了しました");
    } catch (err) {
      logger.error({ id, err }, "分類処理で予期しないエラーが発生しました");
    }
  }
  return ids.length;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  logger.info("分類ワーカーを起動しました");

  process.on("SIGINT", () => {
    shuttingDown = true;
  });
  process.on("SIGTERM", () => {
    shuttingDown = true;
  });

  while (!shuttingDown) {
    const processed = await runOnce();
    if (processed === 0) {
      await sleep(POLL_INTERVAL_MS);
    }
  }

  logger.info("分類ワーカーを停止しました");
  await prisma.$disconnect();
}

main().catch((err) => {
  logger.error({ err }, "分類ワーカーが異常終了しました");
  process.exit(1);
});
