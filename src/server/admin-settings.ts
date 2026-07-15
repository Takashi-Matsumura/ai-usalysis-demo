import { z } from "zod";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/auth";
import { CLASSIFICATION_DIMENSION_COLUMNS } from "@/server/analytics";
import type { ModelRole } from "@/generated/prisma/enums";

export const ModelSettingInputSchema = z.object({
  provider: z.string().min(1),
  modelName: z.string().min(1),
  displayName: z.string().min(1),
  baseUrl: z.string().url(),
  apiKeyRef: z.string().optional(),
  enabled: z.boolean(),
  isLocal: z.boolean(),
  role: z.enum(["chat", "classifier", "both"]),
});

export type ModelSettingInput = z.infer<typeof ModelSettingInputSchema>;

export async function listModelSettings() {
  await requireRole("admin");
  return prisma.modelSetting.findMany({ orderBy: { createdAt: "asc" } });
}

export async function upsertModelSetting(input: ModelSettingInput) {
  await requireRole("admin");
  return prisma.modelSetting.create({
    data: {
      provider: input.provider,
      modelName: input.modelName,
      displayName: input.displayName,
      baseUrl: input.baseUrl,
      apiKeyRef: input.apiKeyRef || null,
      enabled: input.enabled,
      isLocal: input.isLocal,
      role: input.role as ModelRole,
    },
  });
}

export async function setModelSettingEnabled(id: string, enabled: boolean) {
  await requireRole("admin");
  return prisma.modelSetting.update({ where: { id }, data: { enabled } });
}

export const CategoryOptionInputSchema = z.object({
  dimension: z.enum(CLASSIFICATION_DIMENSION_COLUMNS),
  value: z.string().min(1),
  label: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export type CategoryOptionInput = z.infer<typeof CategoryOptionInputSchema>;

export async function listCategoryOptions(dimension?: string) {
  await requireRole("admin");
  return prisma.categoryOption.findMany({
    where: dimension ? { dimension } : undefined,
    orderBy: [{ dimension: "asc" }, { sortOrder: "asc" }],
  });
}

export async function addCategoryOption(input: CategoryOptionInput) {
  await requireRole("admin");
  return prisma.categoryOption.upsert({
    where: { dimension_value: { dimension: input.dimension, value: input.value } },
    create: {
      dimension: input.dimension,
      value: input.value,
      label: input.label,
      sortOrder: input.sortOrder,
      enabled: true,
      version: 1,
    },
    update: { label: input.label, sortOrder: input.sortOrder, enabled: true },
  });
}

export async function setCategoryOptionEnabled(id: string, enabled: boolean) {
  await requireRole("admin");
  const existing = await prisma.categoryOption.findUniqueOrThrow({ where: { id } });
  return prisma.categoryOption.update({
    where: { id },
    data: { enabled, version: existing.version + 1 },
  });
}
