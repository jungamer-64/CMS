# GMO CoreServerへのデプロイ手順書

## 前提条件

### 1. CoreServer要件
- GMO CoreServerのアカウント
- SSH接続が有効化されていること
- Node.js機能が有効化されていること
- 独自ドメインまたはサブドメインの設定

### 2. ローカル要件
- Git
- SSH クライアント
- SSH鍵ペア（既に `jgm_rsa` が用意済み）

## 初回セットアップ

### 1. CoreServerでのSSH設定

1. CoreServer管理画面にログイン
2. 「SSH」メニューを選択
3. 「SSH接続」を有効化
4. 公開鍵を登録

#### 公開鍵の生成（必要な場合）
```powershell
# PowerShellで実行
ssh-keygen -y -f C:\Users\jumpe\.ssh\jgm_rsa
```

### 2. Node.js機能の有効化

1. CorelServer管理画面の「Node.js」メニュー
2. Node.js機能を有効化
3. 利用可能なバージョンを確認（推奨: 18.x以上）

### 3. 環境変数ファイルの準備

```bash
# deploy/.env.coreserver.template をコピー
copy deploy\.env.coreserver.template deploy\.env.production

# MongoDB URI、JWT Secret等を実際の値に変更
notepad deploy\.env.production
```

## デプロイ実行

### 方法1: Windows自動デプロイ（推奨）

```cmd
cd c:\Users\jumpe\Documents\Next..js\test-website

# デプロイ実行（サーバー番号とユーザー名を指定）
deploy\deploy-coreserver.bat v2008 rebelor
```

### 方法2: 手動デプロイ

```powershell
# 1. SSH接続確認
ssh -i C:\Users\jumpe\.ssh\jgm_rsa rebelor@v2008.coreserver.jp

# 2. 必要なディレクトリ作成
mkdir -p public_html/test-website
mkdir -p backup/test-website
mkdir -p logs

# 3. 環境変数ファイルアップロード
scp -i C:\Users\jumpe\.ssh\jgm_rsa deploy\.env.production rebelor@v2008.coreserver.jp:~/.env.production

# 4. デプロイスクリプトアップロード
scp -i C:\Users\jumpe\.ssh\jgm_rsa deploy\deploy-coreserver.sh rebelor@v2008.coreserver.jp:~/

# 5. デプロイ実行
ssh -i C:\Users\jumpe\.ssh\jgm_rsa rebelor@v2008.coreserver.jp "chmod +x deploy-coreserver.sh && ./deploy-coreserver.sh production"
```

## CoreServer管理画面での設定

### 1. ドメイン設定

1. 「ドメイン」メニューを選択
2. jungamer.uk ドメインを選択
3. DocumentRoot を `/home/rebelor/domains/jungamer.uk/public_html` に設定

### 2. SSL証明書について

SSL証明書はCloudflare経由で設定済みです。
追加のSSL設定は不要です。

### 3. .htaccess設定

デプロイスクリプトが自動生成する `.htaccess` ファイルで以下が設定されます：
- Next.js静的ファイルへのリライト
- APIルートのプロキシ設定
- セキュリティヘッダー
- 機密ファイルへのアクセス拒否

## アプリケーションの起動

### 1. SSH接続してプロセス起動

```bash
# サーバーに接続
ssh -i ~/.ssh/jgm_rsa rebelor@v2008.coreserver.jp

# アプリケーションディレクトリに移動
cd public_html/jgm-blog

# Node.jsアプリケーション起動
nohup node server.js > jgm-blog.log 2>&1 &

# プロセス確認
ps aux | grep node
```

### 2. メンテナンススクリプトの使用

```bash
# メンテナンススクリプトをアップロード
scp -i C:\Users\jumpe\.ssh\jgm_rsa deploy\maintenance-coreserver.sh rebelor@v2008.coreserver.jp:~/

# 実行権限付与
ssh -i C:\Users\jumpe\.ssh\jgm_rsa rebelor@v2008.coreserver.jp "chmod +x maintenance-coreserver.sh"

# 各種操作
ssh -i C:\Users\jumpe\.ssh\jgm_rsa rebelor@v2008.coreserver.jp "./maintenance-coreserver.sh status"
ssh -i C:\Users\jumpe\.ssh\jgm_rsa rebelor@v2008.coreserver.jp "./maintenance-coreserver.sh restart"
ssh -i C:\Users\jumpe\.ssh\jgm_rsa rebelor@v2008.coreserver.jp "./maintenance-coreserver.sh logs"
```

## 日常メンテナンス

### アプリケーション管理

```bash
# 状態確認
./maintenance-coreserver.sh status

# ログ確認
./maintenance-coreserver.sh logs

# 再起動
./maintenance-coreserver.sh restart

# アップデート
./maintenance-coreserver.sh update

# ヘルスチェック
./maintenance-coreserver.sh health
```

### バックアップ

```bash
# 手動バックアップ
./maintenance-coreserver.sh backup

# 定期バックアップ設定（crontabが利用可能な場合）
crontab -e
# 以下を追加
0 2 * * * /home/rebelor/domains/jungamer.uk/private_html/maintenance-coreserver.sh backup
```

## CoreServer固有の制限と対応

### 1. メモリ制限
- 共用サーバーのためメモリ使用量に注意
- 不要なプロセスは停止する
- 重い処理は分散して実行

### 2. CPU制限
- 連続的な高CPU使用は制限される
- バッチ処理は時間をずらして実行

### 3. ファイル数制限
- inode制限に注意
- 不要なファイルは定期的に削除
- node_modulesは最小限に

### 4. ネットワーク制限
- 外部API呼び出しに制限がある場合あり
- MongoDB Atlasなど外部DB推奨

## トラブルシューティング

### よくある問題

1. **Node.jsプロセスが起動しない**
   ```bash
   # ログ確認
   cat test-website.log
   
   # 環境確認
   node --version
   npm --version
   ```

2. **環境変数が読み込まれない**
   ```bash
   # ファイル確認
   ls -la ~/.env.production
   cat ~/.env.production
   ```

3. **ビルドエラー**
   ```bash
   # 依存関係再インストール
   rm -rf node_modules
   npm install
   npm run build
   ```

4. **SSL証明書エラー**
   - CloudflareのSSL設定を確認
   - DNS設定がCloudflare経由になっているか確認

### パフォーマンス監視

```bash
# リソース使用量確認
./maintenance-coreserver.sh health

# プロセス確認
ps aux | grep node

# ディスク使用量
df -h

# メモリ使用量
free -h
```

## セキュリティ

### 1. ファイル権限
```bash
# 適切な権限設定
chmod 600 ~/.env.production
chmod 755 public_html/test-website
chmod 644 public_html/test-website/.htaccess
```

### 2. 定期的なセキュリティアップデート
```bash
# 依存関係の更新
npm audit
npm update
```

### 3. ログ監視
```bash
# エラーログの定期確認
tail -f logs/test-website.log | grep -i error
```

## 監視とアラート

### ログ監視
```bash
# エラーパターンの監視
grep -i "error\|fail\|exception" logs/test-website.log
```

### 稼働監視
- CorelServer管理画面での稼働状況確認
- 外部監視サービスの利用推奨（UptimeRobot等）

## 参考情報

- [GMO CorelServer公式ドキュメント](https://help.coreserver.jp/)
- [Node.js公式ドキュメント](https://nodejs.org/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
