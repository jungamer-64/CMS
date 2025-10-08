/**
 * Batch Operations Tab Component
 * バッチ翻訳操作タブコンポーネント
 */

'use client';

import React from 'react';

interface BatchTabProps {
  readonly bulkResults: Record<string, string>;
  readonly onTranslationKeysChange: (keys: string[]) => void;
  readonly onBulkTranslate: () => Promise<void>;
}

export function BatchTab({
  bulkResults,
  onTranslationKeysChange,
  onBulkTranslate
}: BatchTabProps) {
  const [localKeys, setLocalKeys] = React.useState<string[]>([]);
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Batch Operations</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Translation Keys (one per line)
            </label>
            <textarea
              rows={6}
              placeholder="common.welcome&#10;common.goodbye&#10;auth.login"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => {
                const keys = e.target.value.split('\n').filter(k => k.trim());
                setLocalKeys(keys);
                onTranslationKeysChange(keys);
              }}
            />
          </div>
          <button
            onClick={onBulkTranslate}
            disabled={localKeys.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            Translate All ({localKeys.length} keys)
          </button>

          {Object.keys(bulkResults).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Results:</h4>
              <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                {Object.entries(bulkResults).map(([key, translation]) => (
                  <div key={key} className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="font-mono text-sm text-blue-600 dark:text-blue-400">{key}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{translation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
