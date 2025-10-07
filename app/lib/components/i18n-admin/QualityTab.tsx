/**
 * Quality Tab Component
 * 翻訳品質管理タブコンポーネント
 */

'use client';

import React from 'react';
import type { I18nTabProps } from './types';
import type { Locale } from '../../contexts/advanced-i18n-context';

interface QualityTabProps {
  readonly onValidate: (key: string) => void;
  readonly onSuggest: (key: string) => void;
}

export function QualityTab({
  onValidate,
  onSuggest
}: QualityTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Translation Quality</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Translation Key</label>
            <input
              type="text"
              placeholder="Enter translation key (e.g., common.welcome)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const key = (e.target as HTMLInputElement).value;
                  onValidate(key);
                  onSuggest(key);
                }
              }}
            />
            <p className="mt-2 text-sm text-gray-500">
              Press Enter to validate and get suggestions for the translation key
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
