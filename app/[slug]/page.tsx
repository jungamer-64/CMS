"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';
import { useAdvancedI18n } from '@/app/lib/contexts/advanced-i18n-context';
import { getPostBySlug } from '../lib/api/posts-client';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  slug: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export default function BlogPost() {
  const params = useParams();
  const { t } = useAdvancedI18n();
  const [page, setPage] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      if (!params.slug || Array.isArray(params.slug)) return;

      try {
        setIsLoading(true);
        const { success, data } = await getPostBySlug(params.slug);

        if (success && data) {
          setPage(data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('固定ページ取得エラー:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('messages.loadingPage')}</p>
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {t('messages.pageNotFound')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('messages.pageNotFoundDescription')}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('messages.backToHome')}
          </Link>
        </div>
      </div>
    );
  }  // コンテンツの表示
  const content = marked(page.content);

  return (
    <>
      {/* SEO Meta Tags */}
      <head>
        <title>{page.title}</title>
      </head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* ヘッダー */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {page.title}
            </h1>
            <div className="text-gray-600 dark:text-gray-400">
              <span>{t('articles.author')}: {page.author}</span>
              <span className="mx-2">•</span>
              <span>{new Date(page.createdAt).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </article>
          </div>
        </div>

        {/* フッター情報 */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t('messages.lastUpdated')}: {new Date(page.updatedAt || page.createdAt).toLocaleDateString('ja-JP')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
