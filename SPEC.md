# SPEC.md — Parallel Routes & Intercepting Routes DEMO

## 1. 目的

Next.js App Router の **Parallel Routes** と **Intercepting Routes** を学習するためのデモアプリケーション。
フォトギャラリーを題材に、同一 URL に対してモーダル表示とフルページ表示を切り替える UX を実装する。

---

## 2. アプリ概要

| 項目 | 内容 |
|------|------|
| アプリ名 | Photo Gallery |
| フレームワーク | Next.js (App Router) |
| 主な画面 | ギャラリー一覧 (`/gallery`)、フォト詳細モーダル、フォト詳細フルページ (`/photo/[id]`) |

---

## 3. ルーティング設計（修正後）

```
src/app/
├── page.tsx                         # / → /gallery へ redirect
├── layout.tsx                       # ルートレイアウト
├── gallery/                         # /gallery
│   ├── layout.tsx                   # Parallel Routes: @modal スロットを受け取る
│   ├── page.tsx                     # フォトグリッド一覧
│   ├── page.module.css
│   └── @modal/                      # Parallel Routes スロット
│       ├── default.tsx              # スロットのデフォルト (null)
│       └── (..)photo/               # Intercepting Routes: /photo/[id] をインターセプト
│           ├── default.tsx
│           └── [id]/
│               ├── page.tsx         # モーダル内フォト詳細
│               └── page.module.css
└── photo/
    └── [id]/
        ├── page.tsx                 # フルページフォト詳細
        └── page.module.css
```

---

## 4. Parallel Routes

`gallery/layout.tsx` が `children` と `@modal` スロットを受け取る。

```tsx
// gallery/layout.tsx
export default function BaseLayout({ children, modal }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

- `children` → `gallery/page.tsx`（フォトグリッド）
- `modal` → `gallery/@modal/` 配下のページ（モーダル）
- `@modal/default.tsx` は `null` を返し、モーダルが不要な場面では何も表示しない

---

## 5. Intercepting Routes

### パターン: `(..)photo/[id]`

| 記号 | 意味 |
|------|------|
| `(.)` | 同一階層のセグメントをインターセプト |
| `(..)` | 1 つ上の階層のセグメントをインターセプト |
| `(...)` | ルート (`app/`) からのセグメントをインターセプト |

`gallery/@modal/(..)photo/[id]` は、**`gallery` の 1 つ上の階層**にある `/photo/[id]` をインターセプトする。

### 動作フロー

```
/gallery からリンククリック → /photo/[id] へ遷移しようとする
          ↓ Intercepting Routes が発動
gallery/@modal/(..)photo/[id]/page.tsx がレンダリングされる（モーダル表示）
URL は /photo/[id] に変わるが、背景は /gallery のまま
```

### フルページ表示になる条件

- ブラウザで直接 `/photo/[id]` を開く
- `/photo/[id]` ページ内の Prev/Next リンクをクリック（同じ `/photo/[id]` 間の遷移）

---

## 6. インターセプトスコープの設計原則

### なぜ `(top)` ルートグループではなく `gallery` セグメントが必要か

Next.js のインターセプトパターン `(..)` は **URL セグメント** を基準に相対位置を計算する。

```
(top) はルートグループ（URL セグメントなし）
  → インターセプトのスコープがグローバルになる
  → /photo/[id] から /photo/[id] へ遷移してもモーダルが出てしまう（バグ）

gallery は実 URL セグメント (/gallery)
  → (..)photo/[id] は /gallery の 1 つ上の /photo/[id] のみを対象にする
  → /photo/[id] 内での Prev/Next 遷移はインターセプトされない（正常動作）
```

---

## 7. データ構造

`src/lib/photos.ts` で定義。

```ts
type Photo = {
  id: string;
  title: string;
  description: string;
  imagePath: string;
};
```

| 関数 | 概要 |
|------|------|
| `getPhotoById(id)` | ID で Photo を取得 |
| `getPhotoIndex(id)` | ID のインデックスを返す |
| `getAdjacentPhotoIds(id)` | `{ prevId?, nextId? }` を返す |

写真データは 9 件（`/images/image_01.jpg` 〜 `image_09.jpg`）。

---

## 8. Modal 仕様

**`src/components/Modal/Modal.tsx`** — Client Component

| 項目 | 仕様 |
|------|------|
| 要素 | `<dialog>` ネイティブ要素を使用 |
| アニメーション | GSAP でフェードイン + スライドアップ（`opacity` / `y`） |
| 閉じる方法 | ① Close ボタン ② 背景クリック（`dialog` 直接クリック） |
| 閉じる動作 | `gsap.to(dialog, { opacity: 0 })` 後に `router.back()` |

---

## 9. フルページ詳細仕様

**`src/app/photo/[id]/page.tsx`** — Server Component

| 要素 | 内容 |
|------|------|
| 画像 | `next/image` で表示（`width: 990px, height: 540px`） |
| タイトル・説明 | `Photo` データから表示 |
| Prev/Next | 前後の Photo へのリンク（存在する場合のみ表示） |
| Back | `/gallery` へ戻るリンク |

---

## 10. 技術スタック

| 技術 | 用途 |
|------|------|
| Next.js (App Router) | ルーティング・レンダリング |
| React | UI コンポーネント |
| TypeScript | 型安全 |
| GSAP | モーダルアニメーション |
| CSS Modules | スタイリング |

---

## 11. 検証方法

1. `npm run dev` で起動
2. `/` アクセス → `/gallery` にリダイレクトされること
3. `/gallery` でフォトグリッドが表示されること
4. `/gallery` からフォトをクリック → モーダル表示（URL: `/photo/[id]`）
5. 直接 `/photo/1` にアクセス → フルページ表示
6. フルページの Prev/Next クリック → フルページのまま遷移（モーダルにならない）
