'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import type { GlobalStylesInput } from '@/app/lib/unified-types';
import type { ThemeSettingsInput } from '@/app/lib/core/types/ui-types';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  id: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, id }) => {
  return (
    <div className="flex items-center space-x-3">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0 flex-1">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

const FontSelector: React.FC<{
  label: string;
  value: string;
  onChange: (font: string) => void;
  id: string;
}> = ({ label, value, onChange, id }) => {
  const commonFonts = [
    'inherit',
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Georgia, "Times New Roman", serif',
    '"Courier New", Courier, monospace',
    '"Helvetica Neue", Helvetica, Arial, sans-serif',
    '"Comic Sans MS", cursive',
  ];

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
      >
        {commonFonts.map((font) => (
          <option key={font} value={font}>
            {font === 'inherit' ? 'デフォルト' : font.split(',')[0].replace(/['"]/g, '')}
          </option>
        ))}
      </select>
    </div>
  );
};

const SizeInput: React.FC<{
  label: string;
  value: string;
  onChange: (size: string) => void;
  id: string;
  unit?: string;
}> = ({ label, value, onChange, id, unit = 'px' }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex items-center">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md dark:bg-gray-700 dark:text-white"
          placeholder="16"
        />
        <span className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md text-sm text-gray-600 dark:text-gray-400">
          {unit}
        </span>
      </div>
    </div>
  );
};

export default function StylesManager() {
  const { user } = useAuth();
  const [globalStyles, setGlobalStyles] = useState<GlobalStylesInput>({
    name: 'メインテーマ',
    customCss: '',
    variables: {},
    isActive: true,
  });
  const [themeSettings, setThemeSettings] = useState<ThemeSettingsInput>({
    colorScheme: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#111827',
    },
    typography: {
      fontFamily: 'inherit',
      fontSize: {
        base: '16px',
        heading: '24px',
        small: '14px',
      },
    },
    layout: {
      maxWidth: '1200px',
      spacing: '1rem',
      borderRadius: '0.5rem',
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'theme' | 'css' | 'variables'>('theme');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [stylesResponse, themeResponse] = await Promise.all([
        fetch('/api/admin/styles'),
        fetch('/api/admin/styles/theme')
      ]);

      if (stylesResponse.ok) {
        const stylesData = await stylesResponse.json();
        setGlobalStyles(stylesData || { customCss: '', cssVariables: {} });
      }

      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        setThemeSettings(prev => ({ ...prev, ...themeData }));
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTheme = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/admin/styles/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(themeSettings),
      });

      if (response.ok) {
        alert('テーマ設定を保存しました');
      }
    } catch (error) {
      console.error('テーマ保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStyles = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/admin/styles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(globalStyles),
      });

      if (response.ok) {
        alert('スタイル設定を保存しました');
      }
    } catch (error) {
      console.error('スタイル保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const generateCssPreview = () => {
    const cssVars = Object.entries(themeSettings)
      .map(([key, value]) => `  --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
      .join('\n');
    
    return `:root {\n${cssVars}\n}`;
  };

  if (isLoading) {
    return (
      <AdminLayout title="スタイル管理">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="スタイル管理">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">スタイル管理</h1>
            <p className="text-gray-600 dark:text-gray-400">サイトのテーマとカスタムCSSを管理</p>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'theme', label: 'テーマ設定' },
              { id: 'css', label: 'カスタムCSS' },
              { id: 'variables', label: 'CSS変数' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* テーマ設定タブ */}
        {activeTab === 'theme' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">テーマ設定</h2>
              <button
                onClick={handleSaveTheme}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isSaving ? '保存中...' : 'テーマを保存'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">カラー設定</h3>
                
                <ColorPicker
                  id="primary-color"
                  label="プライマリカラー"
                  value={themeSettings.colorScheme?.primary || '#3B82F6'}
                  onChange={(color) => setThemeSettings(prev => ({ 
                    ...prev, 
                    colorScheme: { ...prev.colorScheme, primary: color }
                  }))}
                />
                
                <ColorPicker
                  id="secondary-color"
                  label="セカンダリカラー"
                  value={themeSettings.colorScheme?.secondary || '#10B981'}
                  onChange={(color) => setThemeSettings(prev => ({ 
                    ...prev, 
                    colorScheme: { ...prev.colorScheme, secondary: color }
                  }))}
                />
                
                <ColorPicker
                  id="bg-color"
                  label="背景色"
                  value={themeSettings.colorScheme?.background || '#FFFFFF'}
                  onChange={(color) => setThemeSettings(prev => ({ 
                    ...prev, 
                    colorScheme: { ...prev.colorScheme, background: color }
                  }))}
                />
                
                <ColorPicker
                  id="text-color"
                  label="テキストカラー"
                  value={themeSettings.colorScheme?.text || '#111827'}
                  onChange={(color) => setThemeSettings(prev => ({ 
                    ...prev, 
                    colorScheme: { ...prev.colorScheme, text: color }
                  }))}
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">タイポグラフィ</h3>
                
                <FontSelector
                  id="font-family"
                  label="フォントファミリー"
                  value={themeSettings.typography?.fontFamily || 'inherit'}
                  onChange={(font) => setThemeSettings(prev => ({ 
                    ...prev, 
                    typography: { ...prev.typography, fontFamily: font }
                  }))}
                />
                
                <SizeInput
                  id="font-size"
                  label="フォントサイズ"
                  value={themeSettings.typography?.fontSize?.base || '16px'}
                  onChange={(size) => setThemeSettings(prev => ({ 
                    ...prev, 
                    typography: { 
                      ...prev.typography, 
                      fontSize: { ...prev.typography?.fontSize, base: size }
                    }
                  }))}
                />
                
                <div>
                  <label htmlFor="line-height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    行の高さ
                  </label>
                  <input
                    id="line-height"
                    type="text"
                    value={themeSettings.layout?.spacing || '1.5'}
                    onChange={(e) => setThemeSettings(prev => ({ 
                      ...prev, 
                      layout: { ...prev.layout, spacing: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="1.5"
                  />
                </div>
              </div>
            </div>

            {/* プレビュー */}
            <div className="mt-8">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">プレビュー</h3>
              <div 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                style={{
                  backgroundColor: themeSettings.colorScheme?.background || '#FFFFFF',
                  color: themeSettings.colorScheme?.text || '#111827',
                  fontFamily: themeSettings.typography?.fontFamily || 'inherit',
                  fontSize: themeSettings.typography?.fontSize?.base || '16px',
                  lineHeight: '1.5',
                }}
              >
                <h4 style={{ color: themeSettings.colorScheme?.primary || '#3B82F6' }} className="text-xl font-bold mb-2">
                  サンプルタイトル
                </h4>
                <p className="mb-4">
                  これはテーマ設定のプレビューです。フォントファミリー、サイズ、行の高さ、カラーが適用されています。
                </p>
                <button 
                  style={{ backgroundColor: themeSettings.colorScheme?.primary || '#3B82F6', color: '#ffffff' }}
                  className="px-4 py-2 rounded mr-2"
                >
                  プライマリボタン
                </button>
                <button 
                  style={{ backgroundColor: themeSettings.colorScheme?.secondary || '#10B981', color: '#ffffff' }}
                  className="px-4 py-2 rounded"
                >
                  セカンダリボタン
                </button>
              </div>
            </div>
          </div>
        )}

        {/* カスタムCSSタブ */}
        {activeTab === 'css' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">カスタムCSS</h2>
              <button
                onClick={handleSaveStyles}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isSaving ? '保存中...' : 'CSSを保存'}
              </button>
            </div>

            <div>
              <label htmlFor="custom-css" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                カスタムCSS
              </label>
              <textarea
                id="custom-css"
                value={globalStyles.customCss}
                onChange={(e) => setGlobalStyles(prev => ({ ...prev, customCss: e.target.value }))}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white font-mono text-sm"
                placeholder="/* カスタムCSSを入力... */&#10;&#10;.custom-class {&#10;  color: #333;&#10;  background: #f5f5f5;&#10;}"
              />
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">注意事項</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• CSSは全ページに適用されます</li>
                <li>• 既存のスタイルを上書きする可能性があります</li>
                <li>• セレクター名は慎重に選んでください</li>
                <li>• 保存前にプレビューで確認することをお勧めします</li>
              </ul>
            </div>
          </div>
        )}

        {/* CSS変数タブ */}
        {activeTab === 'variables' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">CSS変数</h2>
              <button
                onClick={handleSaveStyles}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isSaving ? '保存中...' : '変数を保存'}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">生成されたCSS変数</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  <code>{generateCssPreview()}</code>
                </pre>
              </div>

              <div>
                <label htmlFor="custom-variables" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  追加のCSS変数 (JSON形式)
                </label>
                <textarea
                  id="custom-variables"
                  value={JSON.stringify(globalStyles.variables || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const variables = JSON.parse(e.target.value);
                      setGlobalStyles(prev => ({ ...prev, variables }));
                    } catch {
                      // JSONパースエラーは無視
                    }
                  }}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white font-mono text-sm"
                  placeholder='{"customColor": "#ff0000", "customSpacing": "2rem"}'
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
