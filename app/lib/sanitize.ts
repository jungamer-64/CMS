/**
 * 基本的なHTMLエスケープ関数
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 安全なHTMLタグのみを許可する簡易サニタイザー
 */
export function sanitizeHtml(html: string): string {
  // 基本的なサニタイズ（危険なスクリプトタグやイベントハンドラーを削除）
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // iframeのsrcを信頼できるドメインのみに制限し、width/height属性を保持
  sanitized = sanitized.replace(
    /<iframe([^>]*?)>/gi,
    (match, attributes) => {
      // src属性を抽出
      const srcMatch = /src\s*=\s*["']([^"']*?)["']/i.exec(attributes);
      if (!srcMatch) {
        return `<!-- iframe blocked: no src attribute -->`;
      }
      
      const src = srcMatch[1];
      
      // 信頼できるドメインのリスト
      const trustedDomains = [
        'youtube.com',
        'www.youtube.com',
        'youtu.be',
        'vimeo.com',
        'player.vimeo.com',
        'codepen.io',
        'codesandbox.io',
        'jsfiddle.net',
        'replit.com',
        'github.com',
        'gist.github.com',
        'docs.google.com',
        'drive.google.com',
        'maps.google.com',
        'www.google.com/maps',
        'store.steampowered.com',
        'steamcommunity.com'
      ];
      
      try {
        const url = new URL(src);
        const hostname = url.hostname.toLowerCase();
        
        // 信頼できるドメインかチェック
        const isTrusted = trustedDomains.some(domain => 
          hostname === domain || hostname.endsWith('.' + domain)
        );
        
        if (isTrusted) {
          // 安全な属性のみを保持
          const safeAttributes = [];
          
          // src属性
          safeAttributes.push(`src="${src}"`);
          
          // width属性
          const widthMatch = /width\s*=\s*["']?(\d+)["']?/i.exec(attributes);
          if (widthMatch) {
            safeAttributes.push(`width="${widthMatch[1]}"`);
          }
          
          // height属性
          const heightMatch = /height\s*=\s*["']?(\d+)["']?/i.exec(attributes);
          if (heightMatch) {
            safeAttributes.push(`height="${heightMatch[1]}"`);
          }
          
          // frameborder属性
          const frameborderMatch = /frameborder\s*=\s*["']?([^"'\s]+)["']?/i.exec(attributes);
          if (frameborderMatch) {
            safeAttributes.push(`frameborder="${frameborderMatch[1]}"`);
          }
          
          // allowfullscreen属性
          if (/allowfullscreen/i.test(attributes)) {
            safeAttributes.push('allowfullscreen');
          }
          
          return `<iframe ${safeAttributes.join(' ')}>`;
        } else {
          return `<!-- iframe blocked: untrusted domain ${hostname} -->`;
        }
      } catch {
        return `<!-- iframe blocked: invalid URL -->`;
      }
    }
  );

  return sanitized;
}
