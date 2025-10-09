'use client';

import { marked } from 'marked';
import DOMPurify from 'dompurify';

// マークダウンのレンダラー設定
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // 改行を<br>に変換
});

// HTMLを通すためのレンダラー設定
const renderer = new marked.Renderer();

// HTMLブロックをそのまま通す
renderer.html = function(token: { text?: string; raw?: string }) {
  return token.text || token.raw || '';
};

marked.setOptions({ renderer });

/**
 * DOMPurifyの設定
 * XSS攻撃を防ぐための許可されたタグと属性を定義
 */
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id',
    'target', 'rel', 'width', 'height',
  ],
  ALLOW_DATA_ATTR: false, // data-*属性を許可しない
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * マークダウンテキストをサニタイズされたHTMLに変換
 * XSS対策としてDOMPurifyを使用
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  try {
    // デバッグ用ログ
    console.log('markdownToHtml - 入力:', markdown);
    
    // マークダウンをHTMLに変換
    const rawHtml = marked.parse(markdown) as string;
    console.log('markdownToHtml - markedの出力:', rawHtml);
    
    // DOMPurifyでサニタイズ
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, DOMPURIFY_CONFIG);
    console.log('markdownToHtml - サニタイズ後:', sanitizedHtml);
    
    return sanitizedHtml;
  } catch (err: unknown) {
    console.error('マークダウン変換エラー:', err instanceof Error ? err : String(err));
    return markdown;
  }
}

/**
 * HTMLをサニタイズ（XSS対策）
 * ユーザー入力のHTMLを安全に処理するための関数
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
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
  
  // マークダウンをHTMLに変換（既にサニタイズ済み）
  const sanitizedHtml = markdownToHtml(content);
  
  // DOMParserを使用してHTMLをパース（setInnerHTMLよりも安全）
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, 'text/html');
  const plainText = doc.body.textContent || doc.body.innerText || '';
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength) + '...';
}
