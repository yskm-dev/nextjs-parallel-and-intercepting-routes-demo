# Cloudflare Workers デプロイガイド

Next.js（App Router）アプリを `@opennextjs/cloudflare` を使って Cloudflare Workers にデプロイするための手順とノウハウをまとめたドキュメントです。

---

## 前提条件

- Node.js がインストールされていること
- Cloudflare アカウントがあること
- `wrangler` で Cloudflare にログイン済みであること（`npx wrangler login`）

---

## 使用パッケージ

| パッケージ | 用途 |
|---|---|
| `@opennextjs/cloudflare` | Next.js を Cloudflare Workers 向けにビルド・デプロイする |
| `wrangler` | Cloudflare Workers の設定・デプロイ CLI |

> **注意**: `@cloudflare/next-on-pages` は非推奨のため使用しない。

---

## セットアップ

### 1. パッケージのインストール

```bash
npm install -D @opennextjs/cloudflare wrangler
```

### 2. `next.config.ts` の設定

Cloudflare Workers 環境では以下の設定が必要です。

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Cloudflare では Next.js の Image Optimization が使えないため必須
  },
  eslint: {
    ignoreDuringBuilds: true, // ビルド時の ESLint エラーでビルドが止まらないようにする
  },
};

export default nextConfig;
```

### 3. `open-next.config.ts` の作成

SSG ページを Cloudflare Workers の静的アセットとして配信するために、incremental cache の設定が必要です。

```ts
// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: async () => staticAssetsCache,
  // ※ オブジェクトを直接渡すのではなく、必ず関数として渡すこと
});
```

> **重要**: `incrementalCache: staticAssetsCache`（オブジェクト渡し）ではなく、`incrementalCache: async () => staticAssetsCache`（関数渡し）にしないと populate ステップが正しく動作しない。

### 4. `wrangler.toml` の作成

```toml
# wrangler.toml
name = "your-worker-name"           # Cloudflare Workers の名前
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"       # Worker エントリーポイント（必須）

[assets]
directory = ".open-next/assets"     # 静的アセットのディレクトリ
binding = "ASSETS"                  # Worker から静的アセットにアクセスするバインディング名
```

> **注意**: `main` を省略すると "Missing entry-point to Worker script" エラーになる。
> `[assets]` の `binding` を設定した場合、`main` も必ずセットで設定すること（"Cannot use assets with a binding in an assets-only Worker" エラー回避）。

### 5. `package.json` のスクリプト設定

```json
{
  "scripts": {
    "build:cf": "opennextjs-cloudflare build && node -e \"const fs=require('fs');const src='.open-next/cache';const dst='.open-next/assets/cdn-cgi/_next_cache';fs.cpSync(src,dst,{recursive:true});console.log('Cache copied to static assets')\"",
    "deploy:cf": "opennextjs-cloudflare deploy",
    "preview": "opennextjs-cloudflare build && wrangler dev"
  }
}
```

> **注意**: Cloudflare Workers では build と deploy のコマンドは必ず分けて設定すること。

---

## ビルドとデプロイの手順

### ビルド

```bash
npm run build:cf
```

このコマンドは以下を実行します：
1. `opennextjs-cloudflare build` — Next.js アプリを Cloudflare Workers 向けにビルド
2. `.open-next/cache/` を `.open-next/assets/cdn-cgi/_next_cache/` へコピー（SSG ページのキャッシュを静的アセットとして配置）

### デプロイ

```bash
npm run deploy:cf
```

### ローカルプレビュー

```bash
npm run preview
```

---

## SSG（Static Site Generation）の設定

Cloudflare Workers 上で SSG ページを正しく配信するには以下の設定が必要です。

### ページコンポーネントの設定

```tsx
// 例: src/app/photo/[id]/page.tsx
import { photos } from "@/lib/photos";

// ビルド時に静的生成するパスを定義
export function generateStaticParams() {
  return photos.map((photo) => ({ id: photo.id }));
}

// 定義したパス以外の動的ルートを無効化
export const dynamicParams = false;

// Next.js 15 では params は Promise 型で受け取る必要がある
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params; // await が必要
  // ...
}
```

### Parallel Routes の layout での注意点（Next.js 15）

Next.js 15 では、Parallel Routes のスロット props はオプショナルにできません。

```tsx
// src/app/gallery/layout.tsx
export default function Layout({
  children,
  modal, // ← Next.js 15 では modal?: ではなく modal: （必須）にすること
}: {
  children: React.ReactNode;
  modal: React.ReactNode; // optional にすると型エラーになる
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

---

## よくあるエラーと対処法

### `Output directory 'out' not found`

**原因**: `next.config.ts` に `output: 'export'` を設定している。
**対処**: Parallel Routes / Intercepting Routes を使う場合、`output: 'export'` は非対応。`@opennextjs/cloudflare` を使う。

---

### `Cannot use assets with a binding in an assets-only Worker`

**原因**: `wrangler.toml` に `[assets]` の `binding` を設定しているが、`main` が未設定。
**対処**: `main = ".open-next/worker.js"` を `wrangler.toml` に追加する。

---

### `Missing entry-point to Worker script`

**原因**: `wrangler.toml` から `main` が削除されている。
**対処**: `main = ".open-next/worker.js"` を必ず設定する。

---

### SSG ページが 404 になる

**原因**: OpenNext のビルドで SSG ページのキャッシュが `.open-next/cache/` に生成されるが、`wrangler deploy` では `.open-next/assets/` 以下しか静的アセットとして配信されない。
**対処**: `build:cf` スクリプトでビルド後にキャッシュを静的アセットディレクトリへ手動コピーする。

```bash
node -e "const fs=require('fs');fs.cpSync('.open-next/cache','.open-next/assets/cdn-cgi/_next_cache',{recursive:true})"
```

---

### `ESLint: nextVitals is not iterable`

**原因**: `eslint.config.mjs` で `eslint-config-next/core-web-vitals` をインポートしている（拡張子なし）。
**対処**: `.js` 拡張子を明示的に付ける。

```js
// eslint.config.mjs
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";
```

---

### TypeScript: `params` の `await` 警告

**原因**: Next.js 15 では `params` は `Promise` 型。
**対処**: 型を `Promise<{ id: string }>` にして `await` を使う。

```tsx
// NG（Next.js 14 以前のスタイル）
type Props = { params: { id: string } };
const { id } = params;

// OK（Next.js 15）
type Props = { params: Promise<{ id: string }> };
const { id } = await params;
```

---

## .gitignore への追加

OpenNext のビルド成果物はリポジトリに含めないよう `.gitignore` に追加します。

```
/.open-next/
```

---

## バージョン互換性

| パッケージ | 動作確認済みバージョン |
|---|---|
| `next` | `^15.5.x` |
| `@opennextjs/cloudflare` | `^1.17.x` |
| `wrangler` | `^4.70.x` |

> `next@16.x` 以降は `@opennextjs/cloudflare` の対応状況を確認すること。
