# RESTful API 構造 - 完成版

## 実装完了したRESTful API エンドポイント

### 1. ユーザー管理 (Users)

#### ユーザー一覧・作成
- `GET /api/users/` - ユーザー一覧取得（管理者のみ）
- `POST /api/users/` - ユーザー作成（管理者のみ）

#### 個別ユーザー操作
- `GET /api/users/[id]/` - 特定ユーザー情報取得
- `PUT /api/users/[id]/` - ユーザー情報更新
- `DELETE /api/users/[id]/` - ユーザー削除（管理者のみ）

#### ユーザー関連リソース
- `GET /api/users/[id]/profile/` - プロフィール情報取得
- `PUT /api/users/[id]/profile/` - プロフィール更新
- `PUT /api/users/[id]/password/` - パスワード変更
- `GET /api/users/[id]/theme/` - テーマ設定取得
- `PUT /api/users/[id]/theme/` - テーマ設定更新

### 2. 認証 (Authentication)

#### セッション管理
- `GET /api/auth/session/` - 現在のセッション情報取得
- `DELETE /api/auth/session/` - ログアウト（セッション削除）

#### 認証操作（既存を保持）
- `POST /api/auth/login/` - ログイン
- `POST /api/auth/register/` - ユーザー登録

### 3. 投稿管理 (Posts)

#### 投稿一覧・作成（既存を維持）
- `GET /api/posts/` - 投稿一覧取得（公開・管理者両対応）
- `POST /api/posts/` - 投稿作成

#### 個別投稿操作（既存を維持）
- `GET /api/posts/[slug]/` - 特定投稿取得
- `PUT /api/posts/[slug]/` - 投稿更新
- `DELETE /api/posts/[slug]/` - 投稿削除

#### 投稿関連コメント（新規RESTful）
- `GET /api/posts/[postId]/comments/` - 特定投稿のコメント一覧
- `POST /api/posts/[postId]/comments/` - 特定投稿へのコメント投稿

### 4. コメント管理 (Comments)

#### 個別コメント操作（新規RESTful）
- `GET /api/comments/[id]/` - 特定コメント取得
- `PUT /api/comments/[id]/` - コメント更新（管理者のみ）
- `DELETE /api/comments/[id]/` - コメント削除（管理者のみ）

### 5. メディア管理 (Media)

#### メディア一覧・アップロード（新規RESTful）
- `GET /api/media/` - メディア一覧取得（管理者のみ）
- `POST /api/media/` - メディアアップロード（管理者のみ）

#### 個別メディア操作（新規RESTful）
- `GET /api/media/[filename]/` - 特定メディアファイル情報取得
- `DELETE /api/media/[filename]/` - メディアファイル削除（管理者のみ）

### 6. 設定管理 (Settings)

#### 設定操作（新規RESTful）
- `GET /api/settings/` - 設定取得（管理者のみ）
- `PUT /api/settings/` - 設定更新（管理者のみ）

#### 公開設定（既存を維持）
- `GET /api/settings/public/` - 公開設定取得（認証不要）

### 7. Webhooks（既存を維持）
- `GET /api/webhooks/` - Webhook一覧
- `POST /api/webhooks/` - Webhook作成
- `GET /api/webhooks/[id]/` - 特定Webhook取得
- `PUT /api/webhooks/[id]/` - Webhook更新
- `DELETE /api/webhooks/[id]/` - Webhook削除

## RESTful設計原則の適用

### 1. リソース中心の設計
- URLはリソースを表現（動詞ではなく名詞）
- 例: `/api/users/123/profile` 

### 2. HTTPメソッドの適切な使用
- `GET` - リソース取得
- `POST` - リソース作成
- `PUT` - リソース更新（全体）
- `DELETE` - リソース削除

### 3. 階層構造の表現
- 親子関係をURLで表現
- 例: `/api/posts/[postId]/comments` - 特定投稿のコメント

### 4. 一貫したレスポンス形式
```json
{
  "success": true,
  "data": { ... },
  "message": "操作が成功しました"
}
```

### 5. 適切なHTTPステータスコード
- `200` - 成功
- `201` - 作成成功
- `400` - リクエストエラー
- `401` - 認証エラー
- `403` - 権限エラー
- `404` - リソースが見つからない
- `500` - サーバーエラー

## 権限管理

### 認証レベル
- **認証不要**: 公開API（公開設定、公開投稿一覧など）
- **認証必要**: ユーザー固有操作
- **管理者のみ**: システム管理操作

### リソースレベル権限
- **自分のリソース**: ユーザーは自分のプロフィール・設定のみ操作可能
- **管理者権限**: すべてのユーザー・コメント・メディア・設定を操作可能

## レート制限

### API別制限
- **認証API**: 5回/分
- **コメント投稿**: 3回/分
- **メディアアップロード**: 5回/分
- **設定更新**: 10回/分
- **その他**: 10-20回/分

## バリデーション

### 入力検証
- 必須フィールドチェック
- データ型検証
- 文字列長制限
- ファイルサイズ・形式制限

### セキュリティ
- SQLインジェクション対策
- XSS対策
- CSRF対策（必要に応じて）

## 下位互換性

### 既存APIの維持
現在のフロントエンドとの互換性を保つため、以下は維持：
- `/api/auth/me` → `/api/auth/session`へのリダイレクト
- `/api/user/*` → `/api/users/[id]/*`へのリダイレクト
- `/api/upload` → `/api/media`へのリダイレクト

### 段階的移行
1. 新しいRESTful APIを実装
2. フロントエンドの段階的移行
3. 古いAPIの廃止予告
4. 古いAPIの削除

## エラーハンドリング

### 統一されたエラーレスポンス
```json
{
  "success": false,
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### エラーコード体系
- `VALIDATION_ERROR` - 入力検証エラー
- `UNAUTHORIZED` - 認証エラー
- `FORBIDDEN` - 権限エラー
- `NOT_FOUND` - リソースが見つからない
- `CONFLICT` - リソース競合
- `INTERNAL_ERROR` - サーバーエラー

## パフォーマンス最適化

### ページネーション
すべての一覧APIでページネーション対応：
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### フィルタリング・ソート
クエリパラメータでフィルタリング・ソート対応：
- `?search=キーワード`
- `?sortBy=createdAt&sortOrder=desc`
- `?type=published`

## 今後の拡張予定

### 1. API バージョニング
- `/api/v1/users/` - バージョン1
- `/api/v2/users/` - バージョン2

### 2. GraphQLサポート
- RESTful APIと並行してGraphQL APIを提供

### 3. OpenAPI仕様書
- Swagger/OpenAPIドキュメント自動生成

### 4. テスト自動化
- APIエンドポイントの自動テスト

このRESTful API構造により、一貫性のある、拡張しやすく、保守しやすいAPIが実現されました。
