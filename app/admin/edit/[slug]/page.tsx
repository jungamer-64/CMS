'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

// 記事編集は投稿編集と同じ機能のため、リダイレクト
export default function ArticleEditPage({ params }: { params: Promise<{ slug: string }> }) {
  useEffect(() => {
    params.then(({ slug }) => {
      redirect(`/admin/posts/edit/${slug}`);
    });
  }, [params]);

  return null; // リダイレクト中は何も表示しない
}
