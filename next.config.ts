import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 動的サイト用設定
  images: {
    unoptimized: true,
  },
  
  // MongoDB接続用設定
  serverExternalPackages: ['mongodb'],
};

export default nextConfig;
