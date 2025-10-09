/**
 * Markdown & DOMPurify ユニットテスト
 * 
 * markdown.tsのDOMPurify統合とXSS対策を検証します。
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// JSDOM環境のセットアップ
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document as unknown as Document;
global.DOMParser = dom.window.DOMParser as unknown as typeof DOMParser;

// テスト対象のモジュールをインポート
import { markdownToHtml, sanitizeHtml, escapeHtml, getContentPreview } from '../app/lib/utils/markdown';

describe('Markdown & DOMPurify Integration', () => {
  beforeEach(() => {
    // テストの前処理（必要に応じて）
  });

  describe('markdownToHtml - 基本的なマークダウン変換', () => {
    it('空文字列の場合は空文字列を返す', () => {
      const result = markdownToHtml('');
      expect(result).toBe('');
    });

    it('プレーンテキストをpタグで囲む', () => {
      const result = markdownToHtml('Hello World');
      expect(result).toContain('Hello World');
      expect(result).toContain('<p>');
    });

    it('マークダウンの見出しをHTMLに変換', () => {
      const result = markdownToHtml('# Heading 1');
      expect(result).toContain('<h1');
      expect(result).toContain('Heading 1');
    });

    it('マークダウンのリストをHTMLに変換', () => {
      const markdown = `
- Item 1
- Item 2
- Item 3
`;
      const result = markdownToHtml(markdown);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('Item 1');
    });

    it('マークダウンのコードブロックをHTMLに変換', () => {
      const markdown = '```\nconst x = 1;\n```';
      const result = markdownToHtml(markdown);
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
    });

    it('マークダウンのリンクをHTMLに変換', () => {
      const markdown = '[Google](https://google.com)';
      const result = markdownToHtml(markdown);
      expect(result).toContain('<a');
      expect(result).toContain('href="https://google.com"');
      expect(result).toContain('Google');
    });
  });

  describe('XSS対策 - 危険なスクリプトのサニタイズ', () => {
    it('scriptタグを除去', () => {
      const malicious = '<script>alert("XSS")</script>Hello';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('onerrorイベントハンドラを除去', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')" />';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('onloadイベントハンドラを除去', () => {
      const malicious = '<body onload="alert(\'XSS\')">Content</body>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('alert');
    });

    it('javascriptプロトコルを除去', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('iframeタグを除去', () => {
      const malicious = '<iframe src="https://malicious.com"></iframe>Hello';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('malicious.com');
      expect(result).toContain('Hello');
    });

    it('objectタグを除去', () => {
      const malicious = '<object data="malicious.swf"></object>Content';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('<object');
      expect(result).toContain('Content');
    });

    it('embedタグを除去', () => {
      const malicious = '<embed src="malicious.swf">Content';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('<embed');
      expect(result).toContain('Content');
    });

    it('styleタグを除去', () => {
      const malicious = '<style>body { display: none; }</style>Content';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('<style');
      expect(result).toContain('Content');
    });
  });

  describe('許可された安全なHTMLタグの保持', () => {
    it('段落タグを保持', () => {
      const safe = '<p>Safe paragraph</p>';
      const result = sanitizeHtml(safe);
      expect(result).toBe(safe);
    });

    it('見出しタグを保持', () => {
      const safe = '<h1>Heading</h1><h2>Subheading</h2>';
      const result = sanitizeHtml(safe);
      expect(result).toContain('<h1>');
      expect(result).toContain('<h2>');
    });

    it('リストタグを保持', () => {
      const safe = '<ul><li>Item</li></ul>';
      const result = sanitizeHtml(safe);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });

    it('安全な属性（href, src）を保持', () => {
      const safe = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(safe);
      expect(result).toContain('href="https://example.com"');
    });

    it('画像タグと属性を保持', () => {
      const safe = '<img src="/image.jpg" alt="Description" />';
      const result = sanitizeHtml(safe);
      expect(result).toContain('<img');
      expect(result).toContain('src="/image.jpg"');
      expect(result).toContain('alt="Description"');
    });
  });

  describe('markdownToHtml - マークダウン変換とサニタイズの統合', () => {
    it('マークダウン内のXSS攻撃を防ぐ', () => {
      const malicious = '# Title\n<script>alert("XSS")</script>\nContent';
      const result = markdownToHtml(malicious);
      expect(result).toContain('Title');
      expect(result).toContain('Content');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('マークダウンの安全なHTMLは保持される', () => {
      const markdown = '**Bold** and *italic* text';
      const result = markdownToHtml(markdown);
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('Bold');
      expect(result).toContain('italic');
    });
  });

  describe('escapeHtml - プレーンテキストのエスケープ', () => {
    it('HTMLタグをエスケープ', () => {
      const text = '<div>Content</div>';
      const result = escapeHtml(text);
      expect(result).toContain('&lt;div&gt;');
      expect(result).toContain('&lt;/div&gt;');
    });

    it('特殊文字をエスケープ', () => {
      const text = '< > & " \'';
      const result = escapeHtml(text);
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&amp;');
    });

    it('通常の文字列はそのまま', () => {
      const text = 'Hello World';
      const result = escapeHtml(text);
      expect(result).toBe('Hello World');
    });
  });

  describe('getContentPreview - プレビュー表示', () => {
    it('短いコンテンツはそのまま返す', () => {
      const content = 'Short content';
      const result = getContentPreview(content);
      expect(result).toBe('Short content');
    });

    it('長いコンテンツは切り詰める', () => {
      const content = 'a'.repeat(200);
      const result = getContentPreview(content, 150);
      expect(result.length).toBe(153); // 150文字 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('HTMLタグを除去してプレーンテキストに', () => {
      const content = '**Bold** and *italic*';
      const result = getContentPreview(content);
      expect(result).not.toContain('<strong>');
      expect(result).not.toContain('<em>');
      expect(result).toContain('Bold');
      expect(result).toContain('italic');
    });

    it('マークダウン内のXSS攻撃がプレビューにも影響しない', () => {
      const malicious = '<script>alert("XSS")</script>Safe content';
      const result = getContentPreview(malicious);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Safe content');
    });

    it('空文字列は空文字列を返す', () => {
      const result = getContentPreview('');
      expect(result).toBe('');
    });
  });

  describe('実際のユースケース', () => {
    it('ブログ投稿のマークダウンを安全にHTMLに変換', () => {
      const blogPost = `
# My Blog Post

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
const greeting = "Hello World";
console.log(greeting);
\`\`\`

[Visit my website](https://example.com)
`;
      const result = markdownToHtml(blogPost);
      
      expect(result).toContain('<h1');
      expect(result).toContain('My Blog Post');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('<a');
      expect(result).toContain('href="https://example.com"');
    });

    it('ユーザーコメントのマークダウンを安全に処理', () => {
      const userComment = `
Thanks for the post!

Check out my site: [click here](javascript:alert('XSS'))
<script>alert('XSS')</script>
`;
      const result = markdownToHtml(userComment);
      
      expect(result).toContain('Thanks for the post');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });
  });
});
