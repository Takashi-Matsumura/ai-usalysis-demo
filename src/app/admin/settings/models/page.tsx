import { listModelSettings } from "@/server/admin-settings";
import { addModelSettingAction, toggleModelSettingAction } from "./actions";

export default async function AdminModelSettingsPage() {
  const models = await listModelSettings();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">モデル設定</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs text-foreground/50 dark:border-white/15">
              <th className="py-2 pr-4">表示名</th>
              <th className="py-2 pr-4">プロバイダー / モデル</th>
              <th className="py-2 pr-4">base URL</th>
              <th className="py-2 pr-4">役割</th>
              <th className="py-2 pr-4">ローカル</th>
              <th className="py-2 pr-4">状態</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2 pr-4">{m.displayName}</td>
                <td className="py-2 pr-4">
                  {m.provider} / {m.modelName}
                </td>
                <td className="py-2 pr-4 text-xs text-foreground/60">{m.baseUrl}</td>
                <td className="py-2 pr-4">{m.role}</td>
                <td className="py-2 pr-4">{m.isLocal ? "○" : "-"}</td>
                <td className="py-2 pr-4">{m.enabled ? "有効" : "無効"}</td>
                <td className="py-2 pr-4">
                  <form action={toggleModelSettingAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="nextEnabled" value={(!m.enabled).toString()} />
                    <button type="submit" className="text-xs underline">
                      {m.enabled ? "無効化" : "有効化"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="max-w-lg rounded-xl border border-black/10 p-4 dark:border-white/15">
        <h3 className="mb-3 text-sm font-semibold">モデルを追加</h3>
        <form action={addModelSettingAction} className="flex flex-col gap-3 text-sm">
          <TextField label="表示名" name="displayName" required />
          <TextField label="プロバイダー" name="provider" required defaultValue="llama.cpp" />
          <TextField label="モデル名" name="modelName" required />
          <TextField label="base URL" name="baseUrl" required placeholder="http://localhost:8080/v1" />
          <TextField label="APIキー参照（env変数名・任意）" name="apiKeyRef" />

          <label className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">役割</span>
            <select
              name="role"
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/15"
            >
              <option value="chat">chat（チャット応答用）</option>
              <option value="classifier">classifier（分類用）</option>
              <option value="both">both（両方）</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" name="isLocal" defaultChecked /> ローカルLLM
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="enabled" defaultChecked /> 有効化する
          </label>

          <button type="submit" className="mt-2 rounded-lg bg-foreground px-4 py-2 text-background">
            保存
          </button>
        </form>
      </section>
    </div>
  );
}

function TextField({
  label,
  name,
  required,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-foreground/60">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-lg border border-black/10 bg-transparent px-3 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
      />
    </label>
  );
}
