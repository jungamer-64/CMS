# PM2 セットアップと使用方法

PM2が正常にインストールされ、設定が完了しました。

## 基本的な使用方法

### 開発環境でのアプリケーション起動

```bash
# アプリケーションをビルド
pnpm run build

# PM2でアプリケーションを起動
pnpm run pm2:start

# または直接PM2コマンドを使用
pm2 start ecosystem.config.js
```

### PM2管理コマンド

```bash
# アプリケーションの状態確認
pnpm run pm2:status

# アプリケーションの停止
pnpm run pm2:stop

# アプリケーションの再起動
pnpm run pm2:restart

# アプリケーションのリロード（ゼロダウンタイム）
pnpm run pm2:reload

# アプリケーションの削除
pnpm run pm2:delete

# ログの確認
pnpm run pm2:logs

# リアルタイム監視
pnpm run pm2:monit
```

### 本番環境での使用

```bash
# 本番環境用設定でアプリケーションを起動
pm2 start ecosystem.production.config.js --env production

# PM2を自動起動設定
pm2 startup
pm2 save
```

## 設定ファイル

- `ecosystem.config.js`: 開発/ローカル環境用設定
- `ecosystem.production.config.js`: 本番環境用設定

## ログファイル

PM2のログは `logs/` ディレクトリに保存されます：

- `logs/pm2-out.log`: 標準出力ログ
- `logs/pm2-error.log`: エラーログ

## トラブルシューティング

### アプリケーションが起動しない場合

```bash
# ログを確認
pm2 logs test-website

# プロセスの詳細情報を確認
pm2 describe test-website

# 設定を再読み込み
pm2 restart ecosystem.config.js
```

### メモリ使用量が多い場合

`ecosystem.config.js`の`max_memory_restart`設定を調整してください。

### ポートが使用中の場合

環境変数`PORT`を変更するか、`ecosystem.config.js`の`env.PORT`設定を変更してください。

## 参考リンク

- [PM2公式ドキュメント](https://pm2.keymetrics.io/docs/)
- [PM2 Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)
