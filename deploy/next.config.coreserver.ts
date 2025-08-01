import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CorelServer用設定
  output: 'standalone',
  
  // 静的ファイル最適化
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
  
  // pnpm対応の実験的機能
  experimental: {
    // サーバーアクションの最適化
    serverActions: {
      allowedOrigins: ["*.coreserver.jp", "localhost:3000"],
    },
    
    // pnpmのホイスティングに対応
    esmExternals: 'loose',
  },
  
  // Webpack設定（CorelServer対応）
  webpack: (config, { dev, isServer }) => {
    // pnpmのシンボリックリンクに対応
    config.resolve.symlinks = false;
    
    // CorelServer環境での最適化
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 本番環境での圧縮設定
  compress: true,
  
  // CorelServer用セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
