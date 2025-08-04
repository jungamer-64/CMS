'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
// 一時的なレイアウト型定義
type LayoutComponentType = 'header' | 'navigation' | 'hero' | 'content' | 'sidebar' | 'footer';

interface LayoutComponent {
  id: string;
  type: LayoutComponentType;
  name: string;
  content: string;
  isActive: boolean;
  order: number;
  cssClasses?: string;
  styles?: Record<string, unknown>;
}

interface LayoutComponentInput {
  type: LayoutComponentType;
  name: string;
  content: string;
  isActive?: boolean;
  order?: number;
  cssClasses?: string;
  styles?: Record<string, unknown>;
}

const COMPONENT_TYPES: { value: LayoutComponentType; label: string }[] = [
  { value: 'header', label: 'ヘッダー' },
  { value: 'navigation', label: 'ナビゲーション' },
  { value: 'hero', label: 'ヒーローセクション' },
  { value: 'content', label: 'コンテンツ' },
  { value: 'sidebar', label: 'サイドバー' },
  { value: 'footer', label: 'フッター' },
];

const ComponentEditor: React.FC<{
  component: LayoutComponent;
  onUpdate: (id: string, updates: Partial<LayoutComponentInput>) => void;
  onDelete: (id: string) => void;
}> = ({ component, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {component.name} ({COMPONENT_TYPES.find(t => t.value === component.type)?.label})
          </h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={component.isActive}
              onChange={(e) => onUpdate(component.id, { isActive: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">アクティブ</span>
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={component.order}
            onChange={(e) => onUpdate(component.id, { order: parseInt(e.target.value) })}
            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            placeholder="順序"
          />
          <button
            onClick={() => onDelete(component.id)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            削除
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              コンポーネント名
            </label>
            <input
              type="text"
              value={component.name}
              onChange={(e) => onUpdate(component.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSSクラス
            </label>
            <input
              type="text"
              value={component.cssClasses || ''}
              onChange={(e) => onUpdate(component.id, { cssClasses: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
              placeholder="例: bg-blue-500 text-white p-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              HTMLコンテンツ
            </label>
            <textarea
              value={component.content}
              onChange={(e) => onUpdate(component.id, { content: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white font-mono text-sm"
              placeholder="HTMLコンテンツを入力..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

const NewComponentForm: React.FC<{
  onAdd: (component: LayoutComponentInput) => void;
}> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<LayoutComponentInput>({
    type: 'content',
    name: '',
    content: '',
    cssClasses: '',
    isActive: true,
    order: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.content) {
      onAdd(formData);
      setFormData({
        type: 'content',
        name: '',
        content: '',
        cssClasses: '',
        isActive: true,
        order: 0,
      });
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        + 新しいコンポーネントを追加
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <h3 className="font-medium text-gray-900 dark:text-white mb-4">新しいコンポーネント</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            タイプ
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as LayoutComponentType })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          >
            {COMPONENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            コンポーネント名
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          CSSクラス
        </label>
        <input
          type="text"
          value={formData.cssClasses}
          onChange={(e) => setFormData({ ...formData, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          placeholder="例: bg-blue-500 text-white p-4"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          HTMLコンテンツ
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white font-mono text-sm"
          required
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          追加
        </button>
      </div>
    </form>
  );
};

export default function HomePageEditor() {
  const { user } = useAuth();
  const [components, setComponents] = useState<LayoutComponent[]>([]);
  const [homePageTitle, setHomePageTitle] = useState('');
  const [homePageDescription, setHomePageDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // ホームページデータを取得
      const [homeResponse, componentsResponse] = await Promise.all([
        fetch('/api/homepage'),
        fetch('/api/homepage/components')
      ]);

      if (homeResponse.ok) {
        const homeData = await homeResponse.json();
        // API統合レスポンス形式に対応
        const homeSettings = homeData.success ? homeData.data : homeData;
        setHomePageTitle(homeSettings?.title || 'ホームページ');
        setHomePageDescription(homeSettings?.description || '');
      }

      if (componentsResponse.ok) {
        const componentsData = await componentsResponse.json();
        // API統合レスポンス形式に対応
        const components = componentsData.success ? componentsData.data : componentsData;
        setComponents(Array.isArray(components) ? components : []);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComponentUpdate = async (id: string, updates: Partial<LayoutComponentInput>) => {
    try {
      const response = await fetch(`/api/homepage/components/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setComponents(prev => {
          const currentComponents = Array.isArray(prev) ? prev : [];
          return currentComponents.map(comp => 
            comp.id === id ? { ...comp, ...updates } : comp
          );
        });
      }
    } catch (error) {
      console.error('コンポーネント更新エラー:', error);
    }
  };

  const handleComponentDelete = async (id: string) => {
    if (!confirm('このコンポーネントを削除しますか？')) return;

    try {
      const response = await fetch(`/api/homepage/components/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComponents(prev => {
          const currentComponents = Array.isArray(prev) ? prev : [];
          return currentComponents.filter(comp => comp.id !== id);
        });
      }
    } catch (error) {
      console.error('コンポーネント削除エラー:', error);
    }
  };

  const handleComponentAdd = async (componentData: LayoutComponentInput) => {
    try {
      const response = await fetch('/api/homepage/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(componentData),
      });

      if (response.ok) {
        const newComponent = await response.json();
        const componentData = newComponent.success ? newComponent.data : newComponent;
        setComponents(prev => {
          const currentComponents = Array.isArray(prev) ? prev : [];
          return [...currentComponents, componentData].sort((a, b) => a.order - b.order);
        });
      }
    } catch (error) {
      console.error('コンポーネント追加エラー:', error);
    }
  };

  const handleSaveHomePage = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: homePageTitle,
          description: homePageDescription,
        }),
      });

      if (response.ok) {
        alert('ホームページ設定を保存しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="ホームページ編集">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ホームページ編集">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ホームページ編集</h1>
            <p className="text-gray-600 dark:text-gray-400">ホームページのレイアウトとコンテンツを管理</p>
          </div>
          <button
            onClick={handleSaveHomePage}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>

        {/* ホームページ基本設定 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">基本設定</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="homepage-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ページタイトル
              </label>
              <input
                id="homepage-title"
                type="text"
                value={homePageTitle}
                onChange={(e) => setHomePageTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="homepage-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ページ説明
              </label>
              <textarea
                id="homepage-description"
                value={homePageDescription}
                onChange={(e) => setHomePageDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* レイアウトコンポーネント */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">レイアウトコンポーネント</h2>
          
          <div className="space-y-4">
            {Array.isArray(components) && components.length > 0 ? (
              [...components]
                .sort((a, b) => a.order - b.order)
                .map(component => (
                  <ComponentEditor
                    key={component.id}
                    component={component}
                    onUpdate={handleComponentUpdate}
                    onDelete={handleComponentDelete}
                  />
                ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">コンポーネントが見つかりません</p>
            )}
            
            <NewComponentForm onAdd={handleComponentAdd} />
          </div>
        </div>

        {/* プレビューリンク */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">プレビュー</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">変更内容を確認できます</p>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              ホームページを表示
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
