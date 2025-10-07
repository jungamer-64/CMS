'use client';

import { useState } from 'react';
import { useExtendedTranslation } from '../lib/hooks/useExtendedTranslation';
import DirectionalText, { DirectionalFlex, useDirectionalSpacing } from './DirectionalText';
import LanguageSwitcher from './LanguageSwitcher';
import MultilingualForm, { FieldConfig } from './MultilingualForm';
import MultilingualSearch from './MultilingualSearch';

/**
 * i18n機能のデモンストレーションコンポーネント
 * 実装した全ての多言語機能を実際に使用できる例を提供
 */
export default function I18nDemo() {
  const {
    t,
    formatDate,
    formatCurrency,
    formatRelativeTime,
    formatFileSize,
    formatList,
    tPlural,
    locale,
    isRTL
  } = useExtendedTranslation();

  const { marginStart, textStart } = useDirectionalSpacing();
  const [demoData] = useState({
    currentDate: new Date(),
    price: 1299.99,
    fileSize: 2048576,
    items: ['Apple', 'Banana', 'Cherry'],
    count: 3,
  });

  // フォームのフィールド設定
  const formFields: FieldConfig[] = [
    {
      name: 'name',
      label: t('forms:labels.name'),
      type: 'text',
      rules: { required: true, minLength: 2, maxLength: 50 },
      placeholder: t('forms:placeholders.enterName'),
    },
    {
      name: 'email',
      label: t('forms:labels.email'),
      type: 'email',
      rules: { required: true, email: true },
      placeholder: t('forms:placeholders.enterEmail'),
    },
    {
      name: 'phone',
      label: t('forms:labels.phone'),
      type: 'tel',
      rules: { phone: true },
      placeholder: t('forms:placeholders.enterPhone'),
    },
    {
      name: 'message',
      label: t('forms:labels.message'),
      type: 'textarea',
      rules: { required: true, minLength: 10, maxLength: 500 },
      placeholder: t('forms:placeholders.enterMessage'),
    },
  ];

  const handleFormSubmit = (data: Record<string, string>) => {
    console.log('Form submitted:', data);
    alert(t('messages:success.sent'));
  };

  const handleSearchResults = (query: string, results: unknown[]) => {
    console.log('Search results:', { query, results });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      {/* ヘッダー */}
      <DirectionalText tag="header" className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          {t('site.title')} - i18n Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('site.description')}
        </p>

        {/* 言語切り替え */}
        <div className="flex justify-center">
          <LanguageSwitcher
            variant="dropdown"
            showFlag={true}
            showNativeName={true}
            className="w-64"
          />
        </div>
      </DirectionalText>

      {/* 現在の言語情報 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
          {t('ui.languageInfo', { defaultValue: 'Language Information' })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>現在の言語 / Current Language:</strong> {locale}
          </div>
          <div>
            <strong>テキスト方向 / Text Direction:</strong> {isRTL ? 'RTL (右から左)' : 'LTR (左から右)'}
          </div>
        </div>
      </div>

      {/* フォーマット機能のデモ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {t('demo.formatting', { defaultValue: 'Formatting Demo' })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">日付 / Date</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDate(demoData.currentDate, 'full')}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">通貨 / Currency</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatCurrency(demoData.price)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">相対時間 / Relative Time</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatRelativeTime(new Date(Date.now() - 3600000))}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">ファイルサイズ / File Size</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatFileSize(demoData.fileSize)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">リスト / List</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {formatList(demoData.items)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">複数形 / Plural</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {tPlural('demo.itemCount', demoData.count, {
                defaultValue: 'You have {{count}} item',
                defaultValue_plural: 'You have {{count}} items',
                count: demoData.count
              })}
            </p>
          </div>
        </div>
      </section>

      {/* 多方向テキストのデモ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {t('demo.directional', { defaultValue: 'Directional Text Demo' })}
        </h2>

        <div className="space-y-4">
          <DirectionalFlex className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div className="bg-blue-500 text-white p-2 rounded">Start</div>
            <div className="flex-1 px-4">
              <DirectionalText className={textStart}>
                これは方向性を考慮したテキストです。RTL言語では右から左に表示されます。
                This is directional text. It displays right-to-left for RTL languages.
              </DirectionalText>
            </div>
            <div className="bg-red-500 text-white p-2 rounded">End</div>
          </DirectionalFlex>

          <div className={`bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg ${marginStart('4')}`}>
            <p className="text-yellow-800 dark:text-yellow-200">
              このボックスは言語方向に応じて適切なマージンが設定されています。
              This box has appropriate margins based on the language direction.
            </p>
          </div>
        </div>
      </section>

      {/* 多言語検索のデモ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {t('demo.search', { defaultValue: 'Multilingual Search Demo' })}
        </h2>

        <MultilingualSearch
          onSearch={handleSearchResults}
          languages={['ja', 'en', 'ko', 'zh']}
          searchInAllLanguages={false}
          className="mb-8"
        />
      </section>

      {/* 多言語フォームのデモ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {t('demo.form', { defaultValue: 'Multilingual Form Demo' })}
        </h2>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <MultilingualForm
            fields={formFields}
            onSubmit={handleFormSubmit}
            submitLabel={t('forms:buttons.submit')}
            resetLabel={t('forms:buttons.reset')}
            showHelp={true}
          />
        </div>
      </section>

      {/* コンパクト言語切り替えのデモ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {t('demo.languageSwitchers', { defaultValue: 'Language Switcher Variants' })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Compact Variant</h3>
            <LanguageSwitcher variant="compact" />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Dropdown Variant</h3>
            <LanguageSwitcher variant="dropdown" />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Full Grid Variant</h3>
            <LanguageSwitcher variant="full" className="max-h-48 overflow-y-auto" />
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="text-center text-gray-500 dark:text-gray-400 border-t pt-8">
        <p>
          {t('demo.footer', {
            defaultValue: 'This demo showcases advanced i18n features implemented with Next.js and React.',
          })}
        </p>
      </footer>
    </div>
  );
}
