/**
 * Advanced I18n Examples and Documentation
 * 高度なi18n機能の使用例とドキュメント
 */

'use client';

import React from 'react';
import { AdvancedLanguageSwitcher } from './AdvancedLanguageSwitcher';
import { I18nAdminPanel } from './I18nAdminPanel';
import { 
  InlineTranslationEditor, 
  TranslationQualityBadge, 
  TranslationProgress,
  LanguageDetector,
  TranslationMemorySearch,
  TranslationStatsWidget
} from './TranslationHelpers';

export function I18nShowcase() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">高度なi18n機能デモ</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          このデモでは、拡張されたi18n機能を紹介します。
        </p>
      </div>

      {/* 言語切り替えの各バリエーション */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">言語切り替えコンポーネント</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium mb-3">ドロップダウン（標準）</h4>
            <AdvancedLanguageSwitcher 
              variant="dropdown" 
              showProgress={true}
              showNativeNames={true}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium mb-3">タブ形式</h4>
            <AdvancedLanguageSwitcher 
              variant="tabs" 
              showProgress={true}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium mb-3">フラグのみ</h4>
            <AdvancedLanguageSwitcher 
              variant="flags" 
              showProgress={true}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium mb-3">グリッド表示</h4>
            <AdvancedLanguageSwitcher 
              variant="grid" 
              groupByRegion={true}
              showProgress={true}
              showBookmarks={true}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium mb-3">カルーセル</h4>
            <AdvancedLanguageSwitcher 
              variant="carousel" 
              showProgress={true}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium mb-3">コンパクト</h4>
            <AdvancedLanguageSwitcher 
              variant="compact" 
            />
          </div>
        </div>
      </section>

      {/* インライン翻訳エディタ */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">インライン翻訳エディタ</h3>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="mb-2">
            編集可能なテキスト: <InlineTranslationEditor 
              translationKey="common.welcome" 
              fallback="Welcome" 
              showMetadata={true}
            />
          </p>
          <p>
            品質バッジ付き: <InlineTranslationEditor 
              translationKey="common.goodbye" 
              fallback="Goodbye" 
            /> <TranslationQualityBadge translationKey="common.goodbye" showDetails={true} />
          </p>
        </div>
      </section>

      {/* 翻訳統計 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">翻訳統計と進捗</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TranslationStatsWidget />
          <TranslationStatsWidget locale="en" />
          <TranslationStatsWidget locale="fr" />
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h4 className="font-medium mb-3">進捗バー</h4>
          <TranslationProgress showPercentage={true} size="lg" />
        </div>
      </section>

      {/* 言語検出 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">言語検出</h3>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <LanguageDetector 
            autoDetect={true}
            onDetected={(result) => console.log('Detected:', result)}
          />
        </div>
      </section>

      {/* 翻訳メモリ検索 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">翻訳メモリ検索</h3>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <TranslationMemorySearch 
            onSelect={(memory) => console.log('Selected:', memory)}
          />
        </div>
      </section>

      {/* 管理パネル */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">管理パネル</h3>
        <I18nAdminPanel allowedOperations={['stats', 'quality', 'batch', 'memory', 'export']} />
      </section>

      {/* 使用例のコードサンプル */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">使用例</h3>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-2">基本的な使用方法</h4>
          <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`import { useAdvancedI18n } from './contexts/advanced-i18n-context';

function MyComponent() {
  const { t, tn, formatDate, formatCurrency, detectLanguage } = useAdvancedI18n();
  
  return (
    <div>
      {/* 基本翻訳 */}
      <h1>{t('common.welcome')}</h1>
      
      {/* 変数付き翻訳 */}
      <p>{t('common.greeting', { name: 'John' })}</p>
      
      {/* 複数形対応 */}
      <p>{tn('common.items', itemCount, { count: itemCount })}</p>
      
      {/* 日付フォーマット */}
      <time>{formatDate(new Date())}</time>
      
      {/* 通貨フォーマット */}
      <span>{formatCurrency(1000)}</span>
    </div>
  );
}`}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-2">高度な機能</h4>
          <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`import { 
  useConditionalTranslation,
  useMultipleTranslations,
  useTranslationHistory,
  useTranslationQualityAnalysis
} from './hooks/useAdvancedI18n';

function AdvancedComponent() {
  // 条件付き翻訳
  const message = useConditionalTranslation(
    isLoggedIn, 
    'auth.welcome_back', 
    'auth.please_login'
  );
  
  // 複数翻訳の一括取得
  const translations = useMultipleTranslations([
    'common.save',
    'common.cancel',
    'common.delete'
  ]);
  
  // 翻訳履歴管理
  const { updateTranslation, getHistory, undo } = useTranslationHistory();
  
  // 品質分析
  const { analyzeQuality, generateQualityReport } = useTranslationQualityAnalysis();
  
  return (
    <div>
      <p>{message}</p>
      <button>{translations['common.save']}</button>
    </div>
  );
}`}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-2">プラグインシステム</h4>
          <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`// カスタムプラグインの作成
const googleTranslatePlugin = {
  name: 'GoogleTranslate',
  version: '1.0.0',
  initialize: (context) => {
    console.log('Google Translate plugin initialized');
  },
  destroy: () => {
    console.log('Google Translate plugin destroyed');
  },
  hooks: {
    beforeTranslation: (key, locale) => {
      console.log(\`Translating \${key} to \${locale}\`);
    },
    afterTranslation: (key, locale, result) => {
      console.log(\`Translation completed: \${result}\`);
    }
  }
};

// プラグインの登録
const { registerPlugin } = useAdvancedI18n();
registerPlugin('googleTranslate', googleTranslatePlugin);`}
          </pre>
        </div>
      </section>

      {/* 機能一覧 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">実装された機能一覧</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium text-green-600 mb-2">✅ 基本機能</h4>
            <ul className="text-sm space-y-1">
              <li>• 多言語翻訳サポート（16言語）</li>
              <li>• 複数形対応</li>
              <li>• 変数補間</li>
              <li>• RTL言語サポート</li>
              <li>• フォールバック翻訳</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium text-green-600 mb-2">✅ フォーマット機能</h4>
            <ul className="text-sm space-y-1">
              <li>• 日付・時刻フォーマット</li>
              <li>• 数値フォーマット</li>
              <li>• 通貨フォーマット</li>
              <li>• 相対時間表示</li>
              <li>• リストフォーマット</li>
              <li>• 単位フォーマット</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium text-green-600 mb-2">✅ 管理機能</h4>
            <ul className="text-sm space-y-1">
              <li>• 翻訳統計</li>
              <li>• 品質管理</li>
              <li>• バッチ操作</li>
              <li>• エクスポート/インポート</li>
              <li>• 翻訳セッション管理</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium text-green-600 mb-2">✅ 高度な機能</h4>
            <ul className="text-sm space-y-1">
              <li>• 言語自動検出</li>
              <li>• 翻訳メモリ</li>
              <li>• ブックマーク機能</li>
              <li>• 翻訳履歴</li>
              <li>• 自動保存</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium text-green-600 mb-2">✅ UI/UX機能</h4>
            <ul className="text-sm space-y-1">
              <li>• 6つの言語切り替えバリアント</li>
              <li>• インライン編集</li>
              <li>• 進捗インジケータ</li>
              <li>• 品質バッジ</li>
              <li>• 地域別グループ化</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h4 className="font-medium text-green-600 mb-2">✅ 開発者機能</h4>
            <ul className="text-sm space-y-1">
              <li>• プラグインシステム</li>
              <li>• パフォーマンス監視</li>
              <li>• デバッグツール</li>
              <li>• TypeScript完全サポート</li>
              <li>• カスタムフック</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
