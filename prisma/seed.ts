import { prisma } from "@/server/db";
import { CLASSIFICATION_DIMENSIONS } from "@/config/categories";

async function seedDepartments() {
  const departments = [
    { code: "sales", name: "営業部" },
    { code: "dev", name: "開発部" },
    { code: "hr", name: "人事部" },
    { code: "is", name: "情報システム部" },
    { code: "general", name: "総務部" },
  ];
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: dept,
    });
  }
  return prisma.department.findMany();
}

async function seedUsers(departmentByCode: Record<string, string>) {
  const users = [
    { email: "yamada@example.com", displayName: "山田太郎", departmentCode: "sales", role: "user" as const },
    { email: "sato@example.com", displayName: "佐藤花子", departmentCode: "dev", role: "user" as const },
    { email: "suzuki@example.com", displayName: "鈴木一郎", departmentCode: "hr", role: "analyst" as const },
    { email: "takahashi@example.com", displayName: "高橋次郎", departmentCode: "is", role: "admin" as const },
  ];
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        departmentId: departmentByCode[user.departmentCode],
        role: user.role,
      },
      create: {
        email: user.email,
        displayName: user.displayName,
        departmentId: departmentByCode[user.departmentCode],
        role: user.role,
      },
    });
  }
}

async function seedCategoryOptions() {
  let sortOrder = 0;
  for (const [dimension, values] of Object.entries(CLASSIFICATION_DIMENSIONS)) {
    for (const value of values) {
      await prisma.categoryOption.upsert({
        where: { dimension_value: { dimension, value } },
        update: { label: value, sortOrder },
        create: { dimension, value, label: value, sortOrder, enabled: true, version: 1 },
      });
      sortOrder += 1;
    }
  }
}

async function seedModelSettings() {
  const models = [
    {
      provider: "llama.cpp",
      modelName: "gemma-4-12b-it-Q4_K_M.gguf",
      displayName: "Gemma 4 12B (チャット応答用)",
      baseUrl: "http://localhost:8080/v1",
      isLocal: true,
      role: "chat" as const,
    },
    {
      provider: "llama.cpp",
      modelName: "gemma-3-4b-it-q4_0.gguf",
      displayName: "Gemma 3 4B (分類用)",
      baseUrl: "http://localhost:8081/v1",
      isLocal: true,
      role: "classifier" as const,
    },
  ];
  for (const model of models) {
    const existing = await prisma.modelSetting.findFirst({
      where: { provider: model.provider, modelName: model.modelName },
    });
    if (existing) {
      await prisma.modelSetting.update({ where: { id: existing.id }, data: model });
    } else {
      await prisma.modelSetting.create({ data: model });
    }
  }
}

async function main() {
  const departments = await seedDepartments();
  const departmentByCode = Object.fromEntries(
    departments.map((d) => [d.code, d.id]),
  );
  await seedUsers(departmentByCode);
  await seedCategoryOptions();
  await seedModelSettings();
  console.log("seed完了");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
