/**
 * Translation Helper Components
 * 翻訳ヘルパーコンポーネント集
 * 
 * 機能:
 * - インライン翻訳エディタ
 * - 翻訳コメント
 * - 翻訳提案
 * - 翻訳履歴
 * - 翻訳品質スコア
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAdvancedI18n, type Locale } from '../contexts/advanced-i18n-context';

// インライン翻訳エディタ
interface InlineTranslationEditorProps {
  readonly translationKey: string;
  readonly fallback?: string;
  readonly onSave?: (key: string, value: string) => void;
  readonly showMetadata?: boolean;
}

export function InlineTranslationEditor({
  translationKey,
  fallback = '',
  onSave,
  showMetadata = false
}: InlineTranslationEditorProps) {
  const { t, locale, addTranslations, validateTranslation, suggestTranslation } = useAdvancedI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTranslation = t(translationKey, {});
  const isTranslated = currentTranslation !== translationKey;

  useEffect(() => {
    if (isEditing) {
      setValue(isTranslated ? currentTranslation : fallback);
      setSuggestion(suggestTranslation(translationKey, locale));
      inputRef.current?.focus();
    }
  }, [isEditing, currentTranslation, isTranslated, fallback, translationKey, locale, suggestTranslation]);

  const handleSave = () => {
    if (value.trim()) {
      const namespace = translationKey.split('.')[0];
      const keyPath = translationKey.split('.').slice(1).join('.');

      addTranslations(locale, namespace, {
        [keyPath]: value.trim()
      });

      onSave?.(translationKey, value.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const validation = validateTranslation(translationKey, locale);

  if (isEditing) {
    return (
      <div className="inline-block min-w-48">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={suggestion || 'Enter translation...'}
          />
          {suggestion && suggestion !== value && (
            <button
              onClick={() => setValue(suggestion)}
              className="absolute right-1 top-1 text-xs text-blue-500 hover:text-blue-700"
              title="Use suggestion"
            >
              💡
            </button>
          )}
        </div>
        {showMetadata && (
          <div className="text-xs text-gray-500 mt-1">
            Key: {translationKey} | Locale: {locale}
            {!validation.isValid && (
              <div className="text-red-500">Issues: {validation.issues.join(', ')}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`inline-block cursor-pointer px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${!isTranslated ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' : ''
        }`}
      title={`Click to edit: ${translationKey}`}
    >
      {currentTranslation || fallback}
      {!isTranslated && <span className="ml-1 text-yellow-500">⚠</span>}
      {!validation.isValid && <span className="ml-1 text-red-500">❌</span>}
    </span>
  );
}

// 翻訳品質スコア表示
interface TranslationQualityBadgeProps {
  readonly translationKey: string;
  readonly locale?: Locale;
  readonly showDetails?: boolean;
}

export function TranslationQualityBadge({
  translationKey,
  locale: targetLocale,
  showDetails = false
}: TranslationQualityBadgeProps) {
  const { locale, validateTranslation } = useAdvancedI18n();
  const currentLocale = targetLocale || locale;

  const validation = validateTranslation(translationKey, currentLocale);
  const qualityScore = validation.isValid ? 100 : Math.max(0, 100 - (validation.issues.length * 25));

  const getColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="inline-flex items-center">
      <div
        className={`w-3 h-3 rounded-full ${getColor(qualityScore)}`}
        title={`Quality: ${qualityScore}%`}
      />
      {showDetails && (
        <div className="ml-2 text-xs">
          <span className="font-medium">{qualityScore}%</span>
          {validation.issues.length > 0 && (
            <ul className="text-red-500 mt-1">
              {validation.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// 翻訳進捗インジケータ
interface TranslationProgressProps {
  readonly locale?: Locale;
  readonly showPercentage?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
}

export function TranslationProgress({
  locale: targetLocale,
  showPercentage = true,
  size = 'md'
}: TranslationProgressProps) {
  const { locale, getTranslationStats } = useAdvancedI18n();
  const currentLocale = targetLocale || locale;
  const stats = getTranslationStats(currentLocale);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
          style={{ width: `${stats.completionPercentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{stats.translatedKeys} translated</span>
          <span>{stats.completionPercentage}%</span>
        </div>
      )}
    </div>
  );
}

// 言語検出ウィジェット
interface DetectionResult {
  detected: string;
  confidence: number;
  alternatives: Array<{ locale: string; confidence: number }>;
}

interface LanguageDetectorProps {
  readonly onDetected?: (detected: DetectionResult) => void;
  readonly autoDetect?: boolean;
}

export function LanguageDetector({ onDetected, autoDetect = false }: LanguageDetectorProps) {
  const { detectLanguage } = useAdvancedI18n();
  const [text, setText] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);

  useEffect(() => {
    if (autoDetect && text.length > 10) {
      const detected = detectLanguage(text);
      setResult(detected);
      onDetected?.(detected);
    }
  }, [text, autoDetect, detectLanguage, onDetected]);

  const handleDetect = () => {
    if (text.trim()) {
      const detected = detectLanguage(text);
      setResult(detected);
      onDetected?.(detected);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Enter text to detect language:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          placeholder="Type or paste text here..."
        />
      </div>

      {!autoDetect && (
        <button
          onClick={handleDetect}
          disabled={!text.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md"
        >
          Detect Language
        </button>
      )}

      {result && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          <div className="font-medium">Detected: {result.detected}</div>
          <div className="text-sm text-gray-500">Confidence: {(result.confidence * 100).toFixed(1)}%</div>
          {result.alternatives.length > 0 && (
            <div className="mt-2">
              <div className="text-sm font-medium">Alternatives:</div>
              <ul className="text-sm text-gray-500">
                {result.alternatives.map((alt, index: number) => (
                  <li key={index}>
                    {alt.locale} ({(alt.confidence * 100).toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 翻訳メモリ検索ウィジェット
interface TranslationMemoryResult {
  source: string;
  target: string;
  locale: string;
  quality: number;
  lastUsed: Date;
}

interface TranslationMemorySearchProps {
  readonly onSelect?: (memory: TranslationMemoryResult) => void;
}

export function TranslationMemorySearch({ onSelect }: TranslationMemorySearchProps) {
  const { searchMemory, locale } = useAdvancedI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TranslationMemoryResult[]>([]);

  useEffect(() => {
    if (query.length > 2) {
      const memoryResults = searchMemory(query, locale);
      setResults(memoryResults);
    } else {
      setResults([]);
    }
  }, [query, locale, searchMemory]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Search Translation Memory:</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          placeholder="Enter search term..."
        />
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Found {results.length} matches:</div>
          {results.map((result, index) => (
            <div
              key={index}
              onClick={() => onSelect?.(result)}
              className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="text-sm font-medium">{result.source}</div>
              <div className="text-sm text-gray-600">{result.target}</div>
              <div className="text-xs text-gray-500 mt-1">
                Quality: {result.quality} | Last used: {result.lastUsed.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 翻訳統計ウィジェット
interface TranslationStatsWidgetProps {
  readonly locale?: Locale;
  readonly compact?: boolean;
}

export function TranslationStatsWidget({ locale: targetLocale, compact = false }: TranslationStatsWidgetProps) {
  const { locale, getTranslationStats, getLocaleInfo } = useAdvancedI18n();
  const currentLocale = targetLocale || locale;
  const stats = getTranslationStats(currentLocale);
  const localeInfo = getLocaleInfo(currentLocale);

  if (compact) {
    return (
      <div className="inline-flex items-center space-x-2 text-sm">
        <span className="font-medium">{localeInfo.nativeName}</span>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>
        <span className="text-gray-500">{stats.completionPercentage}%</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">{localeInfo.nativeName}</h3>
        <span className="text-sm text-gray-500">{currentLocale}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{stats.totalKeys}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{stats.translatedKeys}</div>
          <div className="text-xs text-gray-500">Translated</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{stats.missingKeys.length}</div>
          <div className="text-xs text-gray-500">Missing</div>
        </div>
      </div>

      <TranslationProgress locale={currentLocale} />
    </div>
  );
}
