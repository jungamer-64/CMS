/**
 * I18n Admin Panel Component
 * 国際化管理パネルコンポーネント
 * 
 * 機能:
 * - 翻訳統計の表示
 * - 翻訳品質管理
 * - バッチ翻訳操作
 * - 翻訳メモリ管理
 * - エクスポート/インポート
 * - プラグイン管理
 */

'use client';

import { useEffect, useState } from 'react';
import { useAdvancedI18n, type Locale } from '../contexts/advanced-i18n-context';
import { StatsTab } from './i18n-admin/StatsTab';
import { QualityTab } from './i18n-admin/QualityTab';
import { BatchTab } from './i18n-admin/BatchTab';
import { MemoryTab } from './i18n-admin/MemoryTab';
import { ExportTab } from './i18n-admin/ExportTab';
import type { TranslationMemory, TranslationSession } from './i18n-admin/types';

interface I18nAdminPanelProps {
  readonly className?: string;
  readonly allowedOperations?: Array<'stats' | 'quality' | 'batch' | 'memory' | 'export' | 'import' | 'plugins'>;
}

export function I18nAdminPanel({
  className = '',
  allowedOperations = ['stats', 'quality', 'batch', 'memory', 'export', 'import']
}: I18nAdminPanelProps) {
  const {
    locale,
    availableLocales,
    getLocaleInfo,
    getTranslationStats,
    validateTranslation,
    suggestTranslation,
    bulkTranslate,
    searchMemory,
    exportTranslations,
    importTranslations,
    bookmarkTranslation,
    startTranslationSession,
    endTranslationSession,
    getActiveSessions
  } = useAdvancedI18n();

  const [activeTab, setActiveTab] = useState<string>('stats');
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [translationKeys, setTranslationKeys] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<Record<string, string>>({});
  const [memoryResults, setMemoryResults] = useState<TranslationMemory[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<TranslationSession | null>(null);

  // 翻訳統計の取得
  const stats = getTranslationStats(selectedLocale);

  // アクティブセッションの監視
  useEffect(() => {
    const interval = setInterval(() => {
      const sessions = getActiveSessions();
      if (sessions.length > 0) {
        setSessionStats(sessions[0]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getActiveSessions]);

  // セッション開始/終了
  const handleSessionToggle = () => {
    if (activeSession) {
      const session = endTranslationSession(activeSession);
      setActiveSession(null);
      setSessionStats(session);
    } else {
      const sessionId = startTranslationSession(selectedLocale);
      setActiveSession(sessionId);
    }
  };

  // バッチ翻訳の実行
  const handleBulkTranslate = async () => {
    if (translationKeys.length === 0) return;

    try {
      const results = await bulkTranslate(translationKeys, selectedLocale);
      setBulkResults(results);
    } catch (error) {
      console.error('Bulk translation failed:', error);
    }
  };

  // 翻訳メモリ検索
  const handleMemorySearch = (query: string) => {
    const results = searchMemory(query, selectedLocale);
    setMemoryResults(results);
  };

  // エクスポート処理
  const handleExport = async (format: 'json' | 'csv' | 'xlsx') => {
    try {
      const blob = await exportTranslations(selectedLocale, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations_${selectedLocale}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // インポート処理
  const handleImport = async (file: File) => {
    try {
      await importTranslations(selectedLocale, file);
      alert('Import successful!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: ' + (error as Error).message);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">I18n Administration Panel</h2>

        <div className="flex items-center space-x-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Locale</label>
            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value as Locale)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              {availableLocales.map((loc) => (
                <option key={loc} value={loc}>
                  {getLocaleInfo(loc).nativeName} ({loc})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {allowedOperations.includes('stats') && (
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Statistics
            </button>
          )}
          {allowedOperations.includes('quality') && (
            <button
              onClick={() => setActiveTab('quality')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'quality'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Quality
            </button>
          )}
          {allowedOperations.includes('batch') && (
            <button
              onClick={() => setActiveTab('batch')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'batch'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Batch
            </button>
          )}
          {allowedOperations.includes('memory') && (
            <button
              onClick={() => setActiveTab('memory')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'memory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Memory
            </button>
          )}
          {(allowedOperations.includes('export') || allowedOperations.includes('import')) && (
            <button
              onClick={() => setActiveTab('export')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Export/Import
            </button>
          )}
        </nav>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'stats' && (
        <StatsTab
          selectedLocale={selectedLocale}
          stats={stats}
          sessionStats={sessionStats}
          activeSession={activeSession}
          onSessionToggle={handleSessionToggle}
          onBookmark={(key: string) => bookmarkTranslation(key, selectedLocale, 'Missing translation')}
        />
      )}
      {activeTab === 'quality' && (
        <QualityTab
          onValidate={(key) => validateTranslation(key, selectedLocale)}
          onSuggest={(key) => suggestTranslation(key, selectedLocale)}
        />
      )}
      {activeTab === 'batch' && (
        <BatchTab
          bulkResults={bulkResults}
          onTranslationKeysChange={setTranslationKeys}
          onBulkTranslate={handleBulkTranslate}
        />
      )}
      {activeTab === 'memory' && (
        <MemoryTab
          memoryResults={memoryResults}
          onMemorySearch={handleMemorySearch}
        />
      )}
      {activeTab === 'export' && (
        <ExportTab
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
