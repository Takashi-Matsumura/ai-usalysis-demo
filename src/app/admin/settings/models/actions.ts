"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { upsertModelSetting, setModelSettingEnabled, ModelSettingInputSchema } from "@/server/admin-settings";

export async function addModelSettingAction(formData: FormData) {
  await requireRole("admin");

  const parsed = ModelSettingInputSchema.safeParse({
    provider: formData.get("provider"),
    modelName: formData.get("modelName"),
    displayName: formData.get("displayName"),
    baseUrl: formData.get("baseUrl"),
    apiKeyRef: formData.get("apiKeyRef") || undefined,
    enabled: formData.get("enabled") === "on",
    isLocal: formData.get("isLocal") === "on",
    role: formData.get("role"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await upsertModelSetting(parsed.data);
  redirect("/admin/settings/models");
}

export async function toggleModelSettingAction(formData: FormData) {
  await requireRole("admin");

  const id = formData.get("id");
  const nextEnabled = formData.get("nextEnabled") === "true";
  if (typeof id !== "string" || !id) throw new Error("idが不正です");

  await setModelSettingEnabled(id, nextEnabled);
  redirect("/admin/settings/models");
}
