

import Document, { 
  Html, 
  Head, 
  Main, 
  NextScript, 
  DocumentContext, 
  DocumentInitialProps 
} from 'next/document';
import { ReactElement } from 'react';

// =============================================================================
// 型定義（厳格な型安全性）
// =============================================================================

type SupportedLanguage = 'ja' | 'en';
type ColorScheme = 'light' | 'dark' | 'light dark';

interface OptimizedDocumentProps {
  readonly lang: SupportedLanguage;
  readonly themeColor?: string;
  readonly description?: string;
}

interface DocumentMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly author?: string;
  readonly viewport?: string;
  readonly themeColor?: string;
  readonly colorScheme?: ColorScheme;
}

// =============================================================================
// Type Guards（実行時型安全性）
// =============================================================================

const isValidLanguage = (lang: unknown): lang is SupportedLanguage => {
  return typeof lang === 'string' && ['ja', 'en'].includes(lang);
};

const isValidColorScheme = (scheme: unknown): scheme is ColorScheme => {
  return typeof scheme === 'string' && 
    ['light', 'dark', 'light dark'].includes(scheme);
};

// =============================================================================
// パフォーマンス最適化されたカスタム Document
// =============================================================================

class MyDocument extends Document<OptimizedDocumentProps> {
  // 静的メタデータ（コンパイル時最適化）
  private static readonly DEFAULT_METADATA: Readonly<DocumentMetadata> = {
    viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
    themeColor: '#ffffff',
    description: 'Next.js アプリケーション',
    author: 'Web Developer',
    keywords: ['Next.js', 'React', 'TypeScript', 'Web App'],
    colorScheme: 'light dark'
  } as const;

  // 厳格な型安全性を持つ getInitialProps
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps & OptimizedDocumentProps> {
    // パフォーマンス最適化：非同期処理の並列実行
    const [initialProps] = await Promise.all([
      Document.getInitialProps(ctx)
    ]);

    // 型安全性：言語設定のバリデーション
    const defaultLang: SupportedLanguage = 'ja';
    const requestLang = ctx.req?.headers?.['accept-language']?.includes('en') ? 'en' : 'ja';
    const safeLang = isValidLanguage(requestLang) ? requestLang : defaultLang;

    // 厳格な型安全性：readonly プロパティで返却
    return {
      ...initialProps,
      lang: safeLang,
      themeColor: MyDocument.DEFAULT_METADATA.themeColor,
      description: MyDocument.DEFAULT_METADATA.description
    } as const;
  }

  // メタタグ生成の最適化（メモ化対象）
  private generateMetaTags(): readonly ReactElement[] {
    const { themeColor, description } = this.props;
    const metadata = MyDocument.DEFAULT_METADATA;
    
    // 型安全なカラースキーム
    const safeColorScheme = isValidColorScheme(metadata.colorScheme) 
      ? metadata.colorScheme 
      : 'light dark';

    return [
      <meta key="charset" charSet="utf-8" />,
      <meta key="viewport" name="viewport" content={metadata.viewport} />,
      <meta key="description" name="description" content={description || metadata.description} />,
      <meta key="author" name="author" content={metadata.author} />,
      <meta key="keywords" name="keywords" content={metadata.keywords?.join(', ') || ''} />,
      <meta key="theme-color" name="theme-color" content={themeColor || metadata.themeColor} />,
      <meta key="color-scheme" name="color-scheme" content={safeColorScheme} />,
      // パフォーマンス最適化
      <meta key="format-detection" name="format-detection" content="telephone=no" />,
      <meta key="msapplication-tap-highlight" name="msapplication-tap-highlight" content="no" />,
      // PWA 最適化
      <meta key="mobile-web-app-capable" name="mobile-web-app-capable" content="yes" />,
      <meta key="apple-mobile-web-app-capable" name="apple-mobile-web-app-capable" content="yes" />,
      <meta key="apple-mobile-web-app-status-bar-style" name="apple-mobile-web-app-status-bar-style" content="default" />
    ] as const;
  }

  // リソースヒント生成（パフォーマンス最適化）
  private generateResourceHints(): readonly ReactElement[] {
    return [
      <link key="dns-prefetch-fonts" rel="dns-prefetch" href="//fonts.googleapis.com" />,
      <link key="preconnect-fonts" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />,
      <link key="dns-prefetch-cdn" rel="dns-prefetch" href="//cdn.jsdelivr.net" />,
      <link key="preconnect-api" rel="preconnect" href="/api" />
    ] as const;
  }

  // パフォーマンス最適化：レンダリング最適化
  render(): ReactElement {
    const { lang } = this.props;
    const metaTags = this.generateMetaTags();
    const resourceHints = this.generateResourceHints();

    return (
      <Html lang={lang}>
        <Head>
          {metaTags}
          {resourceHints}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
