import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 動的サイト用設定
  images: {
    unoptimized: true,
  },
  
  // MongoDB接続用設定
  serverExternalPackages: ['mongodb'],
  
  // 環境変数設定
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    JWT_SECRET: process.env.JWT_SECRET,
    API_KEYS_DATA: process.env.API_KEYS_DATA,
    DEFAULT_API_KEY: process.env.DEFAULT_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // 本番環境での出力設定（Windows権限問題でスタンドアロンを無効化）
  // output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Turbopackの最適化設定
  turbopack: {
    // 解決する拡張子の優先順位を設定
    resolveExtensions: [
      '.mdx',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
    // Turbopackのルール設定
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    // 静的ファイルの処理設定
    resolveAlias: {
      '@': './app',
      '@/components': './app/components',
      '@/lib': './app/lib',
      '@/styles': './app/styles',
    },
  },

  // pnpm対応の実験的機能
  experimental: {
    // サーバーアクションの最適化
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    
    // Turbopackを使用した場合の最適化
    optimizePackageImports: [
      'react',
      'react-dom',
      'next',
      'tailwindcss',
    ],
  },
  
  // Webpack設定（pnpm対応）
  webpack: (config, { isServer }) => {
    // pnpmのシンボリックリンクに対応
    config.resolve.symlinks = false;
    
    // クライアントサイドでのNode.js専用モジュールの使用を防ぐ
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        child_process: false,
        mongodb: false,
      };
    }
    
    return config;
  },
  
  // TypeScript設定
  typescript: {
    // ビルド時の型チェックを無効化（別途型チェックスクリプトを使用）
    ignoreBuildErrors: false,
  },
  
  // ESLint設定
  eslint: {
    // ビルド時のESLintチェックを無効化（別途lintスクリプトを使用）
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
