'use client';

import { Block, BlockEditor } from '@/app/lib/ui/components/editors/SimpleBlockEditor';
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// 一時的な型定義
type PageStatus = 'draft' | 'published' | 'archived' | 'private';

interface StaticPageInput {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: PageStatus;
  template: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

// 一時的な関数定義
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getPageById(_id: string): Promise<StaticPageInput | null> {
  // 実装は後で追加
  return null;
}

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'text'>('visual');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pageData, setPageData] = useState<StaticPageInput>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    template: 'default',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!params.id || Array.isArray(params.id)) return;

      try {
        const page = await getPageById(params.id);
        if (page) {
          setPageData({
            title: page.title,
            slug: page.slug,
            content: page.content,
            excerpt: page.excerpt || '',
            status: page.status,
            template: page.template,
            metaTitle: page.metaTitle || '',
            metaDescription: page.metaDescription || '',
            metaKeywords: page.metaKeywords || ''
          });

          // コンテンツからブロックデータを復元を試行（JSON形式の場合）
          try {
            const parsedBlocks = JSON.parse(page.content);
            if (Array.isArray(parsedBlocks)) {
              setBlocks(parsedBlocks);
              setEditorMode('visual');
            }
          } catch {
            // JSON形式でない場合はテキストモードとして扱う
            setEditorMode('text');
          }
        } else {
          alert('ページが見つかりません');
          router.push('/admin/pages');
        }
      } catch (error) {
        console.error('ページ取得エラー:', error);
        alert('ページの取得に失敗しました');
        router.push('/admin/pages');
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [params.id, router]);

  const handleInputChange = (field: keyof StaticPageInput, value: string) => {
    setPageData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTitleChange = (title: string) => {
    handleInputChange('title', title);
  };

  const handleStatusChange = (status: PageStatus) => {
    setPageData(prev => ({
      ...prev,
      status
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id || Array.isArray(params.id)) return;

    setIsSaving(true);

    try {
      // エディターモードに応じてコンテンツを準備
      const contentToSave = editorMode === 'visual'
        ? JSON.stringify(blocks)
        : pageData.content;

      const response = await fetch(`/api/admin/pages/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pageData,
          content: contentToSave
        }),
      });

      if (response.ok) {
        router.push('/admin/pages');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'ページの更新に失敗しました');
      }
    } catch (error) {
      console.error('ページ更新エラー:', error);
      alert('ページの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="ページ編集">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`編集: ${pageData.title}`}>
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={pageData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="ページのタイトルを入力してください"
              required
              disabled={isSaving}
            />
          </div>

          {/* スラッグ */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              スラッグ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              value={pageData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="page-slug"
              required
              disabled={isSaving}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              URL: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/{pageData.slug || 'page-slug'}</code>
            </p>
          </div>

          {/* 抜粋 */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              抜粋
            </label>
            <textarea
              id="excerpt"
              value={pageData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="ページの概要を入力してください"
              disabled={isSaving}
            />
          </div>

          {/* ステータス */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              公開状態
            </legend>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={pageData.status === 'draft'}
                  onChange={(e) => handleStatusChange(e.target.value as PageStatus)}
                  className="mr-2"
                  disabled={isSaving}
                />{' '}
                下書き
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={pageData.status === 'published'}
                  onChange={(e) => handleStatusChange(e.target.value as PageStatus)}
                  className="mr-2"
                  disabled={isSaving}
                />{' '}
                公開
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="private"
                  checked={pageData.status === 'private'}
                  onChange={(e) => handleStatusChange(e.target.value as PageStatus)}
                  className="mr-2"
                  disabled={isSaving}
                />{' '}
                非公開
              </label>
            </div>
          </fieldset>

          {/* テンプレート */}
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              テンプレート
            </label>
            <select
              id="template"
              value={pageData.template}
              onChange={(e) => handleInputChange('template', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isSaving}
            >
              <option value="default">デフォルト</option>
              <option value="full-width">フル幅</option>
              <option value="no-sidebar">サイドバーなし</option>
            </select>
          </div>

          {/* エディターモード切り替え */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              エディターモード
            </legend>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
              <button
                type="button"
                onClick={() => setEditorMode('visual')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${editorMode === 'visual'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                disabled={isSaving}
              >
                ビジュアル
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('text')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${editorMode === 'text'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                disabled={isSaving}
              >
                テキスト
              </button>
            </div>
          </fieldset>

          {/* コンテンツエディター */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              内容 <span className="text-red-500">*</span>
            </legend>
            {editorMode === 'visual' ? (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <BlockEditor
                  blocks={blocks}
                  onChange={setBlocks}
                />
              </div>
            ) : (
              <textarea
                value={pageData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                rows={20}
                placeholder="ページの内容をHTMLまたはマークダウンで入力してください..."
                required
                disabled={isSaving}
              />
            )}
          </fieldset>

          {/* SEO設定 */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO設定</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  メタタイトル
                </label>
                <input
                  type="text"
                  id="metaTitle"
                  value={pageData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="SEO用のタイトル（空の場合はページタイトルを使用）"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  メタディスクリプション
                </label>
                <textarea
                  id="metaDescription"
                  value={pageData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="検索結果に表示される説明文"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  メタキーワード
                </label>
                <input
                  type="text"
                  id="metaKeywords"
                  value={pageData.metaKeywords}
                  onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="キーワードをカンマ区切りで入力"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.push('/admin/pages')}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              disabled={isSaving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '保存中...' : 'ページを更新'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
