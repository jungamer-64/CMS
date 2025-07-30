import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発環境では動的機能を有効にする
  // 本番デプロイ時は環境変数でoutputを制御
  ...(process.env.NEXT_STATIC_EXPORT === 'true' && {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'dist',
  }),
  
  images: {
    unoptimized: true,
  },
  
  // Edge Runtimeを使用（Cloudflare Workers対応）
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
};

export default nextConfig;
