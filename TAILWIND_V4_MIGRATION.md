# Tailwind CSS v4 移行ガイド

このプロジェクトはTailwind CSS v3からv4に移行されました。

## 主な変更点

### 1. インポート方法の変更

**v3 (旧):**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**v4 (新):**

```css
@import "tailwindcss";
```

### 2. テーマ設定の変更

v4では、`tailwind.config.ts`の代わりに、CSSの`@theme`ディレクティブでテーマを定義します。

**v3 (旧):** `tailwind.config.ts`

```typescript
theme: {
  extend: {
    colors: {
      background: "var(--background)",
    },
  },
}
```

**v4 (新):** `app/globals.css`

```css
@theme {
  --color-background: #ffffff;
  --color-foreground: #171717;
  /* その他のカラー定義 */
}
```

### 3. PostCSS設定の変更

**v3 (旧):** `postcss.config.mjs`

```javascript
{
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

**v4 (新):**

```javascript
{
  plugins: {
    '@tailwindcss/postcss': {},
  }
}
```

## ファイル別の変更内容

### `app/globals.css`

- `@tailwind`ディレクティブを`@import "tailwindcss"`に変更
- `@theme`ディレクティブを使用してカスタムカラーとフォントを定義
- CSS変数名を`--color-*`形式に統一（例: `--color-background`）
- 互換性のために、旧形式の変数名もエイリアスとして提供（例: `--background`）

### `tailwind.config.ts`

- テーマ設定を削除（CSSに移行）
- `content`配列のみを保持
- `darkMode`設定を削除（CSSのメディアクエリとクラスで管理）

### `postcss.config.mjs`

- `tailwindcss`プラグインを`@tailwindcss/postcss`に変更
- `autoprefixer`を削除（v4に組み込み済み）

## 新しいパッケージ

```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.14",
    "tailwindcss": "^4.1.14"
  }
}
```

## CSS変数の命名規則

### v4の標準形式

```css
--color-primary: #3b82f6;
--font-family-japanese: "Hiragino Kaku Gothic ProN", sans-serif;
--radius: 0.5rem;
```

### 互換性のためのエイリアス

既存のコードとの互換性を保つため、以下のエイリアスを定義：

```css
:root {
  --background: var(--color-background);
  --foreground: var(--color-foreground);
  --primary: var(--color-primary);
  /* その他のエイリアス */
}
```

## ダークモードの実装

v4では、2つの方法でダークモードを実装できます：

### 1. メディアクエリベース（推奨）

```css
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: #020617;
    --color-foreground: #f8fafc;
    /* その他のダークモードカラー */
  }
}
```

### 2. クラスベース

```css
.dark {
  --color-background: #020617;
  --color-foreground: #f8fafc;
  /* その他のダークモードカラー */
}
```

現在のプロジェクトでは、両方の方法をサポートしています。

## 日本語フォントのサポート

v4では、フォントファミリーも`@theme`で定義：

```css
@theme {
  --font-family-japanese: "Hiragino Kaku Gothic ProN", 
    "ヒラギノ角ゴ ProN W3", 
    "Hiragino Sans", 
    "メイリオ", 
    "MS PGothic", 
    sans-serif;
}
```

使用方法：

```css
body {
  font-family: var(--font-family-japanese);
}
```

または、Tailwindクラスで：

```html
<div class="font-[var(--font-family-japanese)]">
  日本語テキスト
</div>
```

## 破壊的変更への対応

### 1. カスタムCSS変数

既存のコードで`var(--background)`などを使用している場合、エイリアス変数により互換性が保たれます。

### 2. Tailwindクラス

ほとんどのTailwindクラスはv3と同じように機能します。カラー関連のクラスは引き続き使用可能：

```html
<div class="bg-primary text-primary-foreground">
  <!-- v3と同じように動作 -->
</div>
```

## トラブルシューティング

### CSSリンターの警告

`@theme`ディレクティブは新しいため、一部のCSSリンターが警告を表示する場合がありますが、これは無視できます。

### ビルドエラー

もしビルドエラーが発生する場合：

1. `node_modules`を削除して再インストール：

   ```bash
   rm -rf node_modules .next
   pnpm install
   ```

2. PostCSS設定を確認：

   ```bash
   cat postcss.config.mjs
   ```

### スタイルが適用されない

1. `@import "tailwindcss"`が`app/globals.css`の先頭にあることを確認
2. 開発サーバーを再起動

## 参考リソース

- [Tailwind CSS v4.0 公式ドキュメント](https://tailwindcss.com/docs)
- [Tailwind CSS v4.0 移行ガイド](https://tailwindcss.com/docs/upgrade-guide)
- [@theme ディレクティブ](https://tailwindcss.com/docs/theme)

## まとめ

この移行により、以下の利点が得られました：

✅ **より少ない設定ファイル**: `tailwind.config.ts`がシンプルに  
✅ **CSS中心の設定**: テーマ設定がCSSに統合  
✅ **型安全性**: CSS変数による柔軟な設定  
✅ **パフォーマンス向上**: v4の最適化による高速化  
✅ **メンテナンス性**: 設定とスタイルが同じ場所に  

既存のコンポーネントはそのまま動作し、後方互換性が保たれています。
