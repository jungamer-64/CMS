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

import React, { useState, useEffect } from 'react';
import { useAdvancedI18n, type Locale } from '../contexts/advanced-i18n-context';

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
    saveToMemory,
    exportTranslations,
    importTranslations,
    getBookmarks,
    bookmarkTranslation,
    removeBookmark,
    startTranslationSession,
    endTranslationSession,
    getActiveSessions
  } = useAdvancedI18n();

  const [activeTab, setActiveTab] = useState<string>('stats');
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [translationKeys, setTranslationKeys] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<Record<string, string>>({});
  const [memoryResults, setMemoryResults] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);

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

  const renderStatsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Translation Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalKeys}</div>
            <div className="text-sm text-gray-500">Total Keys</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.translatedKeys}</div>
            <div className="text-sm text-gray-500">Translated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.missingKeys.length}</div>
            <div className="text-sm text-gray-500">Missing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.completionPercentage}%</div>
            <div className="text-sm text-gray-500">Completion</div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">{stats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* セッション管理 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Translation Session</h3>
          <button
            onClick={handleSessionToggle}
            className={`px-4 py-2 rounded-md font-medium ${
              activeSession 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {activeSession ? 'End Session' : 'Start Session'}
          </button>
        </div>
        
        {sessionStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Duration</div>
              <div className="text-gray-500">
                {activeSession ? 'Active' : `${Math.round(sessionStats.timeSpent / 1000)}s`}
              </div>
            </div>
            <div>
              <div className="font-medium">Keys Translated</div>
              <div className="text-gray-500">{sessionStats.translatedKeys?.length || 0}</div>
            </div>
            <div>
              <div className="font-medium">Quality Score</div>
              <div className="text-gray-500">{sessionStats.quality?.toFixed(1) || 0}</div>
            </div>
            <div>
              <div className="font-medium">Locale</div>
              <div className="text-gray-500">{sessionStats.locale}</div>
            </div>
          </div>
        )}
      </div>

      {stats.missingKeys.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Missing Translations</h3>
          <div className="max-h-64 overflow-y-auto">
            <ul className="space-y-1">
              {stats.missingKeys.slice(0, 20).map((key) => (
                <li key={key} className="flex justify-between items-center text-sm">
                  <span className="font-mono text-red-600">{key}</span>
                  <button
                    onClick={() => bookmarkTranslation(key, selectedLocale, 'Missing translation')}
                    className="text-yellow-500 hover:text-yellow-600"
                    title="Bookmark"
                  >
                    ⭐
                  </button>
                </li>
              ))}
            </ul>
            {stats.missingKeys.length > 20 && (
              <div className="text-sm text-gray-500 mt-2">
                ... and {stats.missingKeys.length - 20} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderQualityTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Translation Quality</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Translation Key</label>
            <input
              type="text"
              placeholder="Enter translation key (e.g., common.welcome)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const key = (e.target as HTMLInputElement).value;
                  const validation = validateTranslation(key, selectedLocale);
                  const suggestion = suggestTranslation(key, selectedLocale);
                  console.log({ validation, suggestion });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderBatchTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Batch Operations</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Translation Keys (one per line)</label>
            <textarea
              rows={6}
              placeholder="common.welcome&#10;common.goodbye&#10;auth.login"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              onChange={(e) => {
                const keys = e.target.value.split('\n').filter(k => k.trim());
                setTranslationKeys(keys);
              }}
            />
          </div>
          <button
            onClick={handleBulkTranslate}
            disabled={translationKeys.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md"
          >
            Translate All
          </button>
          
          {Object.keys(bulkResults).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Results:</h4>
              <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                {Object.entries(bulkResults).map(([key, translation]) => (
                  <div key={key} className="mb-2">
                    <div className="font-mono text-sm text-blue-600">{key}</div>
                    <div className="text-sm">{translation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMemoryTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Translation Memory</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search Memory</label>
            <input
              type="text"
              placeholder="Enter text to search"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              onChange={(e) => handleMemorySearch(e.target.value)}
            />
          </div>
          
          {memoryResults.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Memory Results:</h4>
              <div className="space-y-2">
                {memoryResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <div className="text-sm font-medium">{result.source}</div>
                    <div className="text-sm text-gray-600">{result.target}</div>
                    <div className="text-xs text-gray-500">
                      Quality: {result.quality} | Last used: {result.lastUsed.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderExportTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Export/Import</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Export Translations</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Export CSV
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Import Translations</h4>
            <input
              type="file"
              accept=".json,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      </div>
    </div>
  );

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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quality'
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'batch'
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'memory'
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
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
      {activeTab === 'stats' && renderStatsTab()}
      {activeTab === 'quality' && renderQualityTab()}
      {activeTab === 'batch' && renderBatchTab()}
      {activeTab === 'memory' && renderMemoryTab()}
      {activeTab === 'export' && renderExportTab()}
    </div>
  );
}
