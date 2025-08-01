# Ubuntu LiteSpeed サーバーへのデプロイ手順書

## 前提条件

### 1. サーバー要件
- Ubuntu 20.04 LTS以上
- OpenLiteSpeed がインストール済み
- Root または sudo 権限を持つユーザー
- SSH アクセスが可能

### 2. ローカル要件
- Git
- SSH クライアント（Windows の場合は OpenSSH または PuTTY）
- テキストエディタ

## 初回セットアップ

### 1. SSHキーの生成と設定

#### Windows (PowerShell)
```powershell
# SSHキーの生成
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 公開キーをサーバーにコピー
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh user@your-server.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

#### Linux/Mac
```bash
# SSHキーの生成
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 公開キーをサーバーにコピー
ssh-copy-id user@your-server.com
```

### 2. サーバーでの初期設定

```bash
# サーバーにログイン
ssh user@your-server.com

# セキュリティアップデート
sudo apt update && sudo apt upgrade -y

# 必要なディレクトリの作成
sudo mkdir -p /var/www/test-website
sudo mkdir -p /etc/test-website
sudo mkdir -p /var/log/test-website
sudo mkdir -p /var/backups/test-website

# 権限設定
sudo chown -R $USER:$USER /var/www/test-website
sudo chown -R $USER:$USER /var/log/test-website
```

### 3. 環境変数の設定

```bash
# 本番環境用環境変数ファイルを作成
sudo nano /etc/test-website/.env.production

# 以下の内容を設定（deploy/.env.production.templateを参考）
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=...
# など
```

## デプロイ実行

### 方法1: Windowsから自動デプロイ

```cmd
cd c:\Users\jumpe\Documents\Next..js\test-website

# デプロイ実行
deploy\deploy-remote.bat production your-server.com ubuntu
```

### 方法2: Linux/Macから自動デプロイ

```bash
cd /path/to/test-website

# スクリプトに実行権限を付与
chmod +x deploy/*.sh

# デプロイ実行
./deploy/deploy-remote.sh production your-server.com ubuntu
```

### 方法3: 手動デプロイ

```bash
# サーバーにログイン
ssh user@your-server.com

# 初回セットアップ（必要な場合）
chmod +x /tmp/server-setup.sh
sudo /tmp/server-setup.sh

# アプリケーションデプロイ
chmod +x /tmp/deploy.sh
/tmp/deploy.sh production
```

## LiteSpeed の設定

### 1. Virtual Host の作成

1. LiteSpeed管理画面（https://your-server.com:7080）にアクセス
2. Virtual Hosts → New → Virtual Host Type: Node.js を選択
3. 以下の設定を行う：

```
Virtual Host Name: test-website
Virtual Host Root: /var/www/test-website/
Config File: conf/vhosts/test-website/vhconf.conf
```

### 2. リスナーの設定

1. Listeners → New → Port: 80, IP: All(*), Secure: No
2. Listeners → New → Port: 443, IP: All(*), Secure: Yes

### 3. Virtual Host Mapping

1. Listeners → Port 80 → Virtual Host Mappings → New
   - Virtual Host: test-website
   - Domain: your-domain.com, www.your-domain.com

2. Listeners → Port 443 → Virtual Host Mappings → New
   - Virtual Host: test-website
   - Domain: your-domain.com, www.your-domain.com

## SSL証明書について

SSL証明書はCloudflare経由で設定済みです。
追加のSSL設定は不要です。

## メンテナンス

### 日常的な操作

```bash
# アプリケーション状態確認
./maintenance.sh status

# ログ確認
./maintenance.sh logs

# アプリケーション再起動
./maintenance.sh restart

# アップデート
./maintenance.sh update

# ヘルスチェック
./maintenance.sh health
```

### バックアップ

```bash
# 手動バックアップ
./maintenance.sh backup

# 定期バックアップの設定（crontab）
0 2 * * * /var/www/test-website/deploy/maintenance.sh backup
```

### ログローテーション

```bash
# ログクリーンアップ
./maintenance.sh cleanup

# 定期クリーンアップの設定（crontab）
0 3 * * 0 /var/www/test-website/deploy/maintenance.sh cleanup
```

## トラブルシューティング

### よくある問題

1. **Node.js プロセスが起動しない**
   ```bash
   pm2 logs test-website
   ```

2. **環境変数が読み込まれない**
   ```bash
   cat /etc/test-website/.env.production
   ```

3. **LiteSpeedでプロキシが動作しない**
   - Virtual Host設定でプロキシが正しく設定されているか確認
   - ポート3000でNext.jsが動作しているか確認

4. **SSL証明書エラー**
   ```bash
   sudo certbot certificates
   ```

### ログファイルの場所

- アプリケーションログ: `/var/log/test-website/`
- LiteSpeedログ: `/usr/local/lsws/logs/`
- システムログ: `/var/log/syslog`

### パフォーマンス監視

```bash
# CPU・メモリ使用量
htop

# ディスク使用量
df -h

# ネットワーク監視
netstat -tuln | grep :3000
```

## セキュリティ

### ファイアウォール設定

```bash
# UFWの有効化
sudo ufw enable

# 必要なポートを開放
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 7080  # LiteSpeed管理画面（必要に応じて）
```

### 定期的なセキュリティアップデート

```bash
# 自動アップデートの設定
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## 監視とアラート

### PM2 モニタリング

```bash
# PM2 Web監視の設定
pm2 web

# PM2 Plus（プロ版）の設定
pm2 link secret_key public_key
```

### ログ監視

```bash
# Logwatch のインストールと設定
sudo apt install logwatch
sudo nano /etc/logwatch/logwatch.conf
```
