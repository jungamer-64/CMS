'use client';

import { marked } from 'marked';

// マークダウンのレンダラー設定
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // 改行を<br>に変換
});

// HTMLを通すためのレンダラー設定
const renderer = new marked.Renderer();

// HTMLブロックをそのまま通す
renderer.html = function(token: any) {
  return token.text || token.raw || '';
};

marked.setOptions({ renderer });

/**
 * マークダウンテキストをHTMLに変換（DOMPurifyによるサニタイズは呼び出し元で実行）
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  try {
    // デバッグ用ログ
    console.log('markdownToHtml - 入力:', markdown);
    
    // マークダウンをHTMLに変換
    const rawHtml = marked.parse(markdown) as string;
    console.log('markdownToHtml - markedの出力:', rawHtml);
    
    return rawHtml;
  } catch (error) {
    console.error('マークダウン変換エラー:', error);
    return markdown;
  }
}

/**
 * プレーンテキストをHTMLエスケープ
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 投稿内容のプレビュー表示（最初の150文字程度）
 */
export function getContentPreview(content: string, maxLength: number = 150): string {
  if (!content) return '';
  
  // HTMLタグを除去してプレーンテキストに
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = markdownToHtml(content);
  const plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength) + '...';
}
