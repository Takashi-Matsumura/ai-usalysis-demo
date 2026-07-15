import { prisma } from "@/server/db";
import { CLASSIFICATION_DIMENSION_COLUMNS, type ClassificationDimension } from "@/server/analytics";

export type DimensionOptions = Record<ClassificationDimension, string[]>;

export async function getEnabledCategoryOptions(): Promise<DimensionOptions> {
  const rows = await prisma.categoryOption.findMany({
    where: { enabled: true, dimension: { in: [...CLASSIFICATION_DIMENSION_COLUMNS] } },
    orderBy: { sortOrder: "asc" },
  });

  const result = Object.fromEntries(
    CLASSIFICATION_DIMENSION_COLUMNS.map((dimension) => [dimension, [] as string[]]),
  ) as DimensionOptions;

  for (const row of rows) {
    result[row.dimension as ClassificationDimension].push(row.value);
  }

  for (const dimension of CLASSIFICATION_DIMENSION_COLUMNS) {
    if (result[dimension].length === 0) {
      throw new Error(`分類カテゴリ "${dimension}" が1件も有効化されていません`);
    }
  }

  return result;
}
