---
name: verify
description: このリポジトリ(ai-usalysis-demo)でHTTPサーフェス(ページ/APIルート)を実地検証する手順
---

# ai-usalysis-demo の検証手順

## 前提

- 開発サーバ: `npm run dev`(Turbopack, http://localhost:3000)。Skill `start-dev` で起動可能。
- DB: docker-compose の `db` サービス(`ai-usalysis-demo-db-1`, ポート5433)。`docker ps` で稼働確認。
- 疑似ログイン方式のため、パスワードは不要。`prisma/seed.ts` に4ロールのシードユーザーがいる:
  - `user` ロール: yamada@example.com, sato@example.com
  - `analyst` ロール: suzuki@example.com
  - `admin` ロール: takahashi@example.com
- 現在のuser idはDBごとに変わるため、都度取得する:
  ```bash
  npx tsx -e "
  import 'dotenv/config';
  import { prisma } from './src/server/db';
  prisma.user.findMany({ select: { id: true, email: true, role: true } }).then((u) => {
    console.log(JSON.stringify(u, null, 2));
    return prisma.\$disconnect();
  });
  "
  ```

## ロール別セッションの取得(curlでの疑似ログイン)

`/login` の Server Action (`loginAsAction`) は `$ACTION_ID_xxx` という隠しフィールドを伴うHTML formとしてレンダリングされる。プログレッシブエンハンスメント対応のため、`multipart/form-data` で直接POSTすればブラウザ無しでログインできる。

```bash
# 1. action IDを取得(初回のみ。ページの再デプロイ等で変わることがあるので都度確認)
curl -s http://localhost:3000/login -o login.html
grep -oE '\$ACTION_ID_[a-f0-9]+' login.html | head -1

# 2. 各ロールでログインしてCookie jarを作る
curl -s -c ROLE.jar -X POST http://localhost:3000/login \
  -F '$ACTION_ID_xxxxx=' \
  -F "userId=<上で取得したuser id>"
# → Set-Cookie: session=... (7日間有効)、Location: /chat への303が返れば成功
```

## 検証で叩くべき代表サーフェス

- `proxy.ts` の認可(Cookie無し/不正Cookieで `/chat`, `/admin` 系に307→`/login`になるか)
- `src/app/admin/**/page.tsx`(`analyst`以上必須) と `src/app/admin/settings/**/page.tsx`(`admin`必須) — layoutガードだけでなくDAL層(`src/server/analytics.ts`, `src/server/admin-settings.ts`)でも `requireRole` が効いているか、ロール別curlで確認
- `src/app/api/analytics/*`, `src/app/api/admin/*` — 未認証/ロール不足でそれぞれ401/403、正当ロールで200になるか
- `src/app/api/chat/route.ts` — 一般ユーザー(`user`ロール)で200になるか(ローカルLLMが立っていないと本文生成は失敗するが、認可自体は通ることを確認すればよい)

## 実例コマンド

```bash
curl -s -b ROLE.jar http://localhost:3000/admin -o /dev/null -w "HTTP %{http_code}\n"
curl -s -b ROLE.jar http://localhost:3000/api/analytics/summary -w "\nHTTP %{http_code}\n"
curl -s http://localhost:3000/admin -D /dev/stdout -o /dev/null | grep -iE "^HTTP|^location"   # 未ログイン
curl -s --cookie "session=invalid.tampered.token" http://localhost:3000/admin -o /dev/null -w "HTTP %{http_code}\n"  # 不正Cookie
```

## 注意点

- `getCurrentUser` は `React.cache()` でメモ化されているが、これはリクエストスコープなので、異なるCookie(別ロール)での連続curlリクエスト間で結果が混線しないことを都度確認すると安心。
- `src/server/model-settings.ts` と `src/server/category-options.ts` はワーカー(`src/jobs/`, `src/services/classify.ts`)からも呼ばれる共有DALのため、ここに `requireRole` 等のリクエストコンテキスト依存処理を入れてはいけない(workerはcookies()にアクセスできず即クラッシュする)。
