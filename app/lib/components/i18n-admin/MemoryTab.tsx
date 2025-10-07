'use client';

import React from 'react';
import type { TranslationMemory } from './types';

interface MemoryTabProps {
  readonly memoryResults: readonly TranslationMemory[];
  readonly onMemorySearch: (searchQuery: string) => void;
}

/**
 * Translation memory search and results display
 * Allows users to search through translation history
 */
export const MemoryTab: React.FC<MemoryTabProps> = ({
  memoryResults,
  onMemorySearch,
}) => {
  return (
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
              onChange={(e) => onMemorySearch(e.target.value)}
            />
          </div>

          {memoryResults.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Memory Results:</h4>
              <div className="space-y-2">
                {memoryResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <div className="text-sm font-medium">{result.source}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{result.target}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
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
};
