/**
 * Statistics Tab Component
 * 翻訳統計タブコンポーネント
 */

'use client';

import React from 'react';
import type { I18nTabProps, TranslationSession } from './types';

interface StatsTabProps extends I18nTabProps {
  readonly activeSession: string | null;
  readonly sessionStats: TranslationSession | null;
  readonly onSessionToggle: () => void;
  readonly onBookmark?: (key: string) => void;
}

export function StatsTab({
  stats,
  activeSession,
  sessionStats,
  onSessionToggle,
  onBookmark
}: StatsTabProps) {
  return (
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
            onClick={onSessionToggle}
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
              <div className="text-gray-500">Locale</div>
              <div className="font-medium">{sessionStats.locale}</div>
            </div>
            <div>
              <div className="text-gray-500">Keys Translated</div>
              <div className="font-medium">{sessionStats.translatedKeys.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Time Spent</div>
              <div className="font-medium">{Math.floor(sessionStats.timeSpent / 60)}m</div>
            </div>
            <div>
              <div className="text-gray-500">Quality Score</div>
              <div className="font-medium">{sessionStats.quality.toFixed(1)}</div>
            </div>
          </div>
        )}
      </div>

      {/* 欠落キーのリスト */}
      {stats.missingKeys.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Missing Translation Keys</h3>
          <div className="max-h-64 overflow-y-auto">
            <ul className="space-y-1">
              {stats.missingKeys.slice(0, 50).map((key) => (
                <li key={key} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-mono">{key}</span>
                  {onBookmark && (
                    <button
                      onClick={() => onBookmark(key)}
                      className="text-yellow-500 hover:text-yellow-600 ml-2"
                      title="Bookmark"
                    >
                      ⭐
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {stats.missingKeys.length > 50 && (
              <p className="text-sm text-gray-500 mt-2">
                ... and {stats.missingKeys.length - 50} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
