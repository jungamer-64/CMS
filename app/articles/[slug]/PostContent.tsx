'use client';

import { markdownToHtml } from '@/app/lib/utils/markdown';
import { sanitizeHtml } from '@/app/lib/utils/sanitize';
import { useEffect, useState } from 'react';

interface PostContentProps {
  readonly content: string;
}

export default function PostContent({ content }: PostContentProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!content) {
      setIsLoading(false);
      return;
    }

    const processContent = async () => {
      try {
        // マークダウンをHTMLに変換
        const rawHtml = markdownToHtml(content);
        
        try {
          // まずフォールバックサニタイザーを試す（iframe属性保持が確実）
          const fallbackSanitized = sanitizeHtml(rawHtml);
          console.log('フォールバックサニタイザー結果:', fallbackSanitized);
          
          // Steamなどの特殊なiframeが含まれている場合はフォールバックを使用
          if (rawHtml.includes('steampowered.com') || rawHtml.includes('width=') || rawHtml.includes('height=')) {
            console.log('特殊なiframeを検出、フォールバックサニタイザーを使用');
            setHtmlContent(fallbackSanitized);
            return;
          }
          
          // DOMPurifyを試す
          const DOMPurify = await import('dompurify');
          const purify = DOMPurify.default;
          
          if (purify && typeof purify.sanitize === 'function') {
            // カスタムフック: iframeの属性を保護
            purify.addHook('beforeSanitizeAttributes', function (node) {
              if (node.tagName === 'IFRAME') {
                // iframe要素の属性を一時的に保存
                const width = node.getAttribute('width');
                const height = node.getAttribute('height');
                const frameborder = node.getAttribute('frameborder');
                
                if (width) node.setAttribute('data-original-width', width);
                if (height) node.setAttribute('data-original-height', height);
                if (frameborder) node.setAttribute('data-original-frameborder', frameborder);
              }
            });
            
            purify.addHook('afterSanitizeAttributes', function (node) {
              if (node.tagName === 'IFRAME') {
                // 保存した属性を復元
                const width = node.getAttribute('data-original-width');
                const height = node.getAttribute('data-original-height');
                const frameborder = node.getAttribute('data-original-frameborder');
                
                if (width) {
                  node.setAttribute('width', width);
                  node.removeAttribute('data-original-width');
                }
                if (height) {
                  node.setAttribute('height', height);
                  node.removeAttribute('data-original-height');
                }
                if (frameborder) {
                  node.setAttribute('frameborder', frameborder);
                  node.removeAttribute('data-original-frameborder');
                }
              }
            });
            
            const sanitizedHtml = purify.sanitize(rawHtml, {
              ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
                'ul', 'ol', 'li',
                'a', 'img',
                'blockquote',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'div', 'span',
                'iframe'
              ],
              ALLOWED_ATTR: [
                'href', 'src', 'alt', 'title', 'class', 'id',
                'target', 'rel',
                'width', 'height', 'frameborder', 'allowfullscreen',
                'allow', 'loading', 'referrerpolicy', 'style',
                'data-original-width', 'data-original-height', 'data-original-frameborder'
              ],
              ALLOWED_URI_REGEXP: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com|codepen\.io|codesandbox\.io|jsfiddle\.net|replit\.com|github\.com|gist\.github\.com|docs\.google\.com|drive\.google\.com|maps\.google\.com|store\.steampowered\.com|steamcommunity\.com|mailto:|tel:)/i,
              KEEP_CONTENT: true,
              WHOLE_DOCUMENT: false
            });
            
            // フックをクリーンアップ
            purify.removeAllHooks();
            
            console.log('元のHTML:', rawHtml);
            console.log('DOMPurify処理完了:', sanitizedHtml);
            setHtmlContent(sanitizedHtml);
          } else {
            throw new Error('DOMPurify not available');
          }
        } catch (dompurifyError) {
          console.warn('DOMPurify failed, using fallback sanitizer:', dompurifyError);
          // フォールバック: カスタムサニタイザーを使用
          const sanitizedHtml = sanitizeHtml(rawHtml);
          setHtmlContent(sanitizedHtml);
        }
      } catch (error) {
        console.error('Content processing error:', error);
        // 最終フォールバック: マークダウンを生で表示
        setHtmlContent(content);
      } finally {
        setIsLoading(false);
      }
    };

    processContent();
  }, [content]);

  // iframeの属性を適用
  useEffect(() => {
    if (htmlContent && content) {
      const timeout = setTimeout(() => {
        console.log('iframe処理開始');
        const container = document.querySelector('.markdown-content');
        if (!container) {
          console.warn('markdown-contentコンテナが見つかりません');
          return;
        }
        
        const iframes = container.querySelectorAll('iframe');
        console.log(`${iframes.length}個のiframeが見つかりました`);
        
        // 元のマークダウンからiframe情報を抽出
        const iframeMatches = content.match(/<iframe[^>]*>/gi) || [];
        
        iframes.forEach((iframe, index) => {
          console.log(`iframe ${index}:`, {
            src: iframe.src,
            width: iframe.getAttribute('width'),
            height: iframe.getAttribute('height'),
            style: iframe.style.cssText
          });
          
          // 元のマークダウンから対応するiframeタグを見つける
          const originalIframe = iframeMatches[index];
          if (originalIframe) {
            // width属性を抽出
            const widthRegex = /width\s*=\s*["']?(\d+)["']?/i;
            const widthMatch = widthRegex.exec(originalIframe);
            if (widthMatch) {
              const width = `${widthMatch[1]}px`;
              iframe.style.width = width;
              iframe.setAttribute('width', widthMatch[1]);
              console.log(`iframe ${index} width設定: ${width}`);
            }
            
            // height属性を抽出
            const heightRegex = /height\s*=\s*["']?(\d+)["']?/i;
            const heightMatch = heightRegex.exec(originalIframe);
            if (heightMatch) {
              const height = `${heightMatch[1]}px`;
              iframe.style.height = height;
              iframe.setAttribute('height', heightMatch[1]);
              console.log(`iframe ${index} height設定: ${height}`);
            }
          }
          
          // 基本的なスタイルを確保
          const src = iframe.src || '';
          
          // Steamウィジェットや特定のサービスでは枠線を表示しない
          if (src.includes('steampowered.com') || 
              src.includes('youtube.com') || 
              src.includes('youtu.be') ||
              src.includes('vimeo.com')) {
            iframe.style.border = 'none';
          } else {
            iframe.style.border = '1px solid #e5e7eb';
          }
          
          iframe.style.borderRadius = '8px';
          iframe.style.display = 'block';
          iframe.style.margin = '16px 0';
          iframe.style.maxWidth = '100%';
        });
      }, 200); // タイムアウトを少し長くする

      return () => clearTimeout(timeout);
    }
  }, [htmlContent, content]);

  if (!content) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📄</div>
        <p className="text-slate-500 dark:text-slate-400 italic">投稿内容がありません。</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="relative mx-auto mb-4 w-8 h-8">
          <div className="absolute inset-0 border-2 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-500 dark:text-slate-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div 
      className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed markdown-content
        [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-slate-900 [&>h1]:dark:text-slate-100
        [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mb-5 [&>h2]:mt-8 [&>h2]:text-slate-800 [&>h2]:dark:text-slate-200 [&>h2]:border-b [&>h2]:border-slate-200 [&>h2]:dark:border-slate-700 [&>h2]:pb-2
        [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mb-4 [&>h3]:mt-6 [&>h3]:text-slate-800 [&>h3]:dark:text-slate-200
        [&>h4]:text-lg [&>h4]:font-medium [&>h4]:mb-3 [&>h4]:mt-5 [&>h4]:text-slate-700 [&>h4]:dark:text-slate-300
        [&>h5]:text-base [&>h5]:font-medium [&>h5]:mb-2 [&>h5]:mt-4 [&>h5]:text-slate-700 [&>h5]:dark:text-slate-300
        [&>h6]:text-sm [&>h6]:font-medium [&>h6]:mb-2 [&>h6]:mt-3 [&>h6]:text-slate-600 [&>h6]:dark:text-slate-400
        [&>p]:mb-6 [&>p]:leading-relaxed [&>p]:text-slate-700 [&>p]:dark:text-slate-300
        [&>a]:text-indigo-600 [&>a]:dark:text-indigo-400 [&>a:hover]:text-indigo-800 [&>a:hover]:dark:text-indigo-300 [&>a]:underline [&>a]:underline-offset-2 [&>a]:decoration-indigo-300 [&>a]:hover:decoration-indigo-500
        [&>strong]:font-semibold [&>strong]:text-slate-900 [&>strong]:dark:text-slate-100
        [&>em]:italic [&>em]:text-slate-600 [&>em]:dark:text-slate-400
        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul]:space-y-2
        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol]:space-y-2
        [&>li]:text-slate-700 [&>li]:dark:text-slate-300 [&>li]:leading-relaxed
        [&>img]:rounded-2xl [&>img]:shadow-lg [&>img]:my-8 [&>img]:border [&>img]:border-slate-200 [&>img]:dark:border-slate-700
        [&>hr]:border-slate-300 [&>hr]:dark:border-slate-600 [&>hr]:my-12
        [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500 [&>blockquote]:bg-indigo-50 [&>blockquote]:dark:bg-indigo-900/20 [&>blockquote]:pl-6 [&>blockquote]:pr-4 [&>blockquote]:py-4 [&>blockquote]:rounded-r-lg [&>blockquote]:italic [&>blockquote]:text-slate-700 [&>blockquote]:dark:text-slate-300 [&>blockquote]:my-6
        [&>table]:min-w-full [&>table]:border-collapse [&>table]:border [&>table]:border-slate-300 [&>table]:dark:border-slate-600 [&>table]:my-6 [&>table]:rounded-lg [&>table]:overflow-hidden [&>table]:shadow-sm
        [&>thead]:bg-slate-50 [&>thead]:dark:bg-slate-800
        [&>th]:border [&>th]:border-slate-300 [&>th]:dark:border-slate-600 [&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold [&>th]:text-slate-900 [&>th]:dark:text-slate-100
        [&>td]:border [&>td]:border-slate-300 [&>td]:dark:border-slate-600 [&>td]:px-4 [&>td]:py-3 [&>td]:text-slate-700 [&>td]:dark:text-slate-300
        [&>pre]:bg-slate-900 [&>pre]:dark:bg-slate-950 [&>pre]:text-slate-100 [&>pre]:p-6 [&>pre]:rounded-2xl [&>pre]:overflow-x-auto [&>pre]:my-6 [&>pre]:shadow-lg [&>pre]:border [&>pre]:border-slate-700
        [&>code]:bg-slate-100 [&>code]:dark:bg-slate-800 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded-md [&>code]:text-sm [&>code]:text-indigo-600 [&>code]:dark:text-indigo-400 [&>code]:font-mono
        [&>pre>code]:bg-transparent [&>pre>code]:text-slate-100 [&>pre>code]:p-0
        [&>iframe]:block [&>iframe]:my-8 [&>iframe]:rounded-2xl [&>iframe]:max-w-full [&>iframe]:shadow-lg [&>iframe]:border [&>iframe]:border-slate-200 [&>iframe]:dark:border-slate-700
        [&>iframe[src*='steampowered.com']]:border-0
        [&>iframe[src*='youtube.com']]:border-0
        [&>iframe[src*='youtu.be']]:border-0
        [&>iframe[src*='vimeo.com']]:border-0"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
