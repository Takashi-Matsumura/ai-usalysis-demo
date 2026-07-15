"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { addCategoryOption, setCategoryOptionEnabled, CategoryOptionInputSchema } from "@/server/admin-settings";

export async function addCategoryOptionAction(formData: FormData) {
  await requireRole("admin");

  const parsed = CategoryOptionInputSchema.safeParse({
    dimension: formData.get("dimension"),
    value: formData.get("value"),
    label: formData.get("label"),
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await addCategoryOption(parsed.data);
  redirect("/admin/settings/categories");
}

export async function toggleCategoryOptionAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("id");
  const nextEnabled = formData.get("nextEnabled") === "true";
  if (typeof id !== "string" || !id) throw new Error("idが不正です");

  await setCategoryOptionEnabled(id, nextEnabled);
  redirect("/admin/settings/categories");
}
