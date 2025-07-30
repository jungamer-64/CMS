'use client';

import { markdownToHtml } from '@/app/lib/markdown';
import { sanitizeHtml } from '@/app/lib/sanitize';
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
    return <div className="text-gray-500 italic">投稿内容がありません。</div>;
  }

  if (isLoading) {
    return <div className="text-gray-500">読み込み中...</div>;
  }

  return (
    <div 
      className="max-w-none text-gray-700 leading-relaxed markdown-content
        [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-gray-900
        [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:text-gray-800
        [&>h3]:text-xl [&>h3]:font-medium [&>h3]:mb-3 [&>h3]:mt-5 [&>h3]:text-gray-700
        [&>h4]:text-lg [&>h4]:font-medium [&>h4]:mb-2 [&>h4]:mt-4 [&>h4]:text-gray-700
        [&>h5]:text-base [&>h5]:font-medium [&>h5]:mb-2 [&>h5]:mt-3 [&>h5]:text-gray-600
        [&>h6]:text-sm [&>h6]:font-medium [&>h6]:mb-2 [&>h6]:mt-3 [&>h6]:text-gray-600
        [&>p]:mb-4 [&>p]:leading-relaxed
        [&>a]:text-blue-600 [&>a:hover]:text-blue-800 [&>a]:underline
        [&>strong]:font-semibold [&>strong]:text-gray-900
        [&>em]:italic
        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4
        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4
        [&>li]:mb-1
        [&>img]:rounded-lg [&>img]:shadow-sm [&>img]:my-6
        [&>hr]:border-gray-300 [&>hr]:my-8
        [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-700 [&>blockquote]:my-4
        [&>table]:min-w-full [&>table]:border-collapse [&>table]:border [&>table]:border-gray-300 [&>table]:my-4
        [&>pre]:bg-gray-100 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-4
        [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:text-gray-800
        [&>iframe]:block [&>iframe]:my-6 [&>iframe]:rounded-lg [&>iframe]:max-w-full
        [&>iframe[src*='steampowered.com']]:border-0
        [&>iframe[src*='youtube.com']]:border-0
        [&>iframe[src*='youtu.be']]:border-0
        [&>iframe[src*='vimeo.com']]:border-0"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
