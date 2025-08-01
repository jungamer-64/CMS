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
  
  // 本番環境での出力設定
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // pnpm対応の実験的機能
  experimental: {
    // サーバーアクションの最適化
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    
    // pnpmのホイスティングに対応
    esmExternals: 'loose',
    
    // Turbopackの有効化（開発時のパフォーマンス向上）
    turbo: {
      resolveExtensions: [
        '.mdx',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.mjs',
        '.json',
      ],
    },
  },
  
  // Webpack設定（pnpm対応）
  webpack: (config, { isServer }) => {
    // pnpmのシンボリックリンクに対応
    config.resolve.symlinks = false;
    
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
