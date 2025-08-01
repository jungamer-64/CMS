#!/bin/bash

# Ubuntu LiteSpeed サーバーセットアップスクリプト

echo "=== Node.js環境のセットアップ ==="

# Node.js 20.x LTSのインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpmのインストール
npm install -g pnpm

# PM2のインストール（プロセス管理用）
npm install -g pm2

# 必要なシステムパッケージのインストール
sudo apt-get update
sudo apt-get install -y git

echo "=== インストール完了 ==="
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "pnpm version: $(pnpm --version)"
echo "PM2 version: $(pm2 --version)"
