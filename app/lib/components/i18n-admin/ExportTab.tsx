'use client';

import React from 'react';

type ExportFormat = 'json' | 'csv' | 'xlsx';

interface ExportTabProps {
  readonly onExport: (format: ExportFormat) => void;
  readonly onImport: (file: File) => void;
}

/**
 * Export and import translations in various formats
 * Supports JSON and CSV formats
 */
export const ExportTab: React.FC<ExportTabProps> = ({
  onExport,
  onImport,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Export/Import</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Export Translations</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => onExport('json')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={() => onExport('csv')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
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
                if (file) onImport(file);
              }}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
