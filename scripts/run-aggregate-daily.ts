import "dotenv/config";
import { prisma } from "@/server/db";
import { aggregateDaily } from "@/jobs/aggregate-daily";

async function main() {
  const arg = process.argv[2];
  const targetDate = arg ? new Date(arg) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (Number.isNaN(targetDate.getTime())) {
    throw new Error(`不正な日付です: ${arg}`);
  }

  await aggregateDaily(targetDate);
  console.log(`集計完了: ${targetDate.toISOString().slice(0, 10)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
