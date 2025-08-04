# 拡張i18n機能ガイド / Extended i18n Features Guide

このプロジェクトでは、Next.jsとReactで利用可能な最も包括的な国際化（i18n）機能を実装しました。以下に各機能の概要と使用方法を説明します。

## 🌍 実装済み機能 / Implemented Features

### 1. 多言語サポート / Multilingual Support
- **サポート言語**: 日本語、英語、韓国語、中国語（簡体字・繁体字）、フランス語、ドイツ語、アラビア語、スペイン語、ポルトガル語、イタリア語、ロシア語、ヒンディー語、タイ語、ベトナム語
- **自動言語検出**: ユーザーのブラウザ設定に基づく自動言語選択
- **フォールバック機能**: 翻訳が見つからない場合の代替言語設定

### 2. RTL（右から左）言語サポート / RTL Language Support
- **対応言語**: アラビア語
- **自動テキスト方向設定**: 言語に応じたテキスト方向の自動調整
- **方向性対応CSS**: マージン、パディング、フロートの自動調整

### 3. 高度なフォーマット機能 / Advanced Formatting
- **日付・時刻**: ロケール対応の日付・時刻フォーマット
- **数値**: 千の位区切り、小数点の表記
- **通貨**: 各国通貨での金額表示
- **相対時間**: 「3時間前」「明日」などの相対時間表示
- **ファイルサイズ**: KB、MB、GBでのファイルサイズ表示
- **リスト**: 「A、B、C」や「A and B」などのリスト表示

### 4. 音素変換（日本語） / Phonetic Conversion (Japanese)
- **ひらがな・カタカナ変換**: 相互変換機能
- **ローマ字対応**: ローマ字入力からひらがな・カタカナへの変換
- **検索最適化**: 異なる文字体系での検索対応

### 5. バリデーション機能 / Validation Features
- **多言語エラーメッセージ**: 各言語でのバリデーションメッセージ
- **地域別電話番号**: 国・地域別の電話番号フォーマット
- **リアルタイムバリデーション**: 入力中のリアルタイム検証

## 🚀 使用方法 / Usage

### 基本的な翻訳 / Basic Translation

\`\`\`typescript
import { useExtendedTranslation } from '../lib/hooks/useExtendedTranslation';

function MyComponent() {
  const { t } = useExtendedTranslation();
  
  return <h1>{t('site.title')}</h1>;
}
\`\`\`

### 拡張フォーマット / Extended Formatting

\`\`\`typescript
function FormattingExample() {
  const { 
    formatDate, 
    formatCurrency, 
    formatRelativeTime, 
    formatFileSize 
  } = useExtendedTranslation();
  
  return (
    <div>
      <p>日付: {formatDate(new Date(), 'full')}</p>
      <p>価格: {formatCurrency(1299.99)}</p>
      <p>更新: {formatRelativeTime(new Date(Date.now() - 3600000))}</p>
      <p>サイズ: {formatFileSize(2048576)}</p>
    </div>
  );
}
\`\`\`

### 言語切り替え / Language Switching

\`\`\`typescript
import LanguageSwitcher from '../components/LanguageSwitcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher 
        variant="dropdown"
        showFlag={true}
        showNativeName={true}
      />
    </header>
  );
}
\`\`\`

### RTL対応テキスト / RTL-Compatible Text

\`\`\`typescript
import DirectionalText, { useDirectionalSpacing } from '../components/DirectionalText';

function RTLExample() {
  const { marginStart, textStart } = useDirectionalSpacing();
  
  return (
    <DirectionalText className={textStart}>
      <div className={marginStart('4')}>
        このテキストは言語方向に対応しています
      </div>
    </DirectionalText>
  );
}
\`\`\`

### 多言語検索 / Multilingual Search

\`\`\`typescript
import MultilingualSearch from '../components/MultilingualSearch';

function SearchPage() {
  const handleSearch = (query: string, results: any[]) => {
    console.log('検索結果:', results);
  };
  
  return (
    <MultilingualSearch
      onSearch={handleSearch}
      languages={['ja', 'en', 'ko']}
      searchInAllLanguages={true}
    />
  );
}
\`\`\`

### 多言語フォーム / Multilingual Form

\`\`\`typescript
import MultilingualForm, { FieldConfig } from '../components/MultilingualForm';

function ContactForm() {
  const fields: FieldConfig[] = [
    {
      name: 'name',
      label: '名前',
      type: 'text',
      rules: { required: true, minLength: 2 },
    },
    {
      name: 'email',
      label: 'メールアドレス',
      type: 'email',
      rules: { required: true, email: true },
    },
  ];
  
  const handleSubmit = (data: Record<string, string>) => {
    console.log('送信データ:', data);
  };
  
  return (
    <MultilingualForm
      fields={fields}
      onSubmit={handleSubmit}
    />
  );
}
\`\`\`

## 📁 ファイル構成 / File Structure

\`\`\`
app/
├── lib/
│   └── hooks/
│       └── useExtendedTranslation.ts     # 拡張i18nフック
├── components/
│   ├── LanguageSwitcher.tsx              # 言語切り替えコンポーネント
│   ├── DirectionalText.tsx               # 方向性対応テキスト
│   ├── MultilingualSearch.tsx            # 多言語検索
│   ├── MultilingualForm.tsx              # 多言語フォーム
│   └── I18nDemo.tsx                      # デモコンポーネント
public/
└── locales/                              # 翻訳ファイル
    ├── ja/
    │   ├── common.json
    │   ├── validation.json
    │   ├── dates.json
    │   ├── numbers.json
    │   ├── forms.json
    │   └── messages.json
    ├── en/
    └── ...（他の言語）
next-i18next.config.js                    # i18n設定ファイル
\`\`\`

## 🎨 翻訳名前空間 / Translation Namespaces

### common
- サイト全体で使用される共通の翻訳
- ナビゲーション、UI要素、アクション

### validation
- フォームバリデーションメッセージ
- エラーメッセージ、パターン定義

### dates
- 日付関連の翻訳
- 月名、曜日、相対時間表現

### numbers
- 数値関連の翻訳
- 通貨、単位、序数

### forms
- フォーム関連の翻訳
- ラベル、プレースホルダー、ボタン

### messages
- システムメッセージ
- 成功・エラー・警告メッセージ

## 🔧 カスタマイズ / Customization

### 新しい言語の追加

1. \`next-i18next.config.js\`の\`locales\`配列に言語コードを追加
2. \`public/locales/{言語コード}/\`ディレクトリを作成
3. 必要な翻訳ファイルをコピー・翻訳

### 新しい翻訳キーの追加

1. 該当する名前空間のJSONファイルにキーを追加
2. 全ての言語で翻訳を提供
3. TypeScriptの型定義を更新（必要に応じて）

### カスタムバリデーションの追加

\`\`\`typescript
const customRule = (value: string) => {
  // カスタムロジック
  if (/* 条件 */) {
    return 'カスタムエラーメッセージ';
  }
  return true;
};

const field: FieldConfig = {
  name: 'custom',
  label: 'カスタムフィールド',
  type: 'text',
  rules: { custom: customRule },
};
\`\`\`

## 📊 パフォーマンス最適化 / Performance Optimization

- **遅延読み込み**: 必要な言語のみを読み込み
- **キャッシュ機能**: 翻訳のブラウザキャッシュ
- **コード分割**: 言語別のチャンク分割
- **プリロード**: 主要言語の事前読み込み

## 🧪 テスト方法 / Testing

### デモページの確認
1. 開発サーバーを起動: \`pnpm dev\`
2. \`/demo\`ページにアクセス（I18nDemoコンポーネントを配置）
3. 各機能をテスト

### 言語切り替えテスト
1. 言語切り替えボタンをクリック
2. URLの言語パラメータが変更されることを確認
3. ページ内容が対応言語で表示されることを確認

## 🔍 トラブルシューティング / Troubleshooting

### よくある問題

1. **翻訳が表示されない**
   - 翻訳ファイルの存在確認
   - キーの大文字小文字確認
   - 名前空間の指定確認

2. **RTLが正しく動作しない**
   - CSSの方向性プロパティ確認
   - HTMLのdir属性確認

3. **フォーマットが期待通りでない**
   - ブラウザのIntl API対応確認
   - ロケール設定の確認

このガイドを参考に、プロジェクトに適した国際化機能を実装・カスタマイズしてください。
