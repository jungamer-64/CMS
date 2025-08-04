# RESTful API リファクタリング計画

## 現在の構造 → 新しいRESTful構造

### 1. Posts (投稿)
- **現在**: `/api/posts/` (GET, POST), `/api/posts/[slug]/` (GET, PUT, DELETE)
- **新規**: そのまま維持（既にRESTful）

### 2. Comments (コメント)
- **現在**: `/api/comments/` (POST), `/api/comments/[slug]/` (GET)
- **新規**: 
  - `/api/posts/[postId]/comments/` (GET, POST) - 特定投稿のコメント
  - `/api/comments/[id]/` (GET, PUT, DELETE) - 個別コメント操作

### 3. Users (ユーザー)
- **現在**: `/api/user/profile/`, `/api/user/password/`, `/api/user/theme/`
- **新規**: 
  - `/api/users/[id]/` (GET, PUT, DELETE)
  - `/api/users/[id]/profile/` (GET, PUT)
  - `/api/users/[id]/password/` (PUT)
  - `/api/users/[id]/theme/` (GET, PUT)

### 4. Authentication (認証)
- **現在**: `/api/auth/me/`, `/api/auth/logout/`
- **新規**: 
  - `/api/auth/session/` (GET, DELETE) - セッション管理
  - `/api/auth/login/` (POST)
  - `/api/auth/register/` (POST)

### 5. Admin (管理者)
- **現在**: `/api/admin/*` - 様々なリソース
- **新規**: リソースごとに分離
  - `/api/admin/users/` → `/api/users/` (admin権限チェック)
  - `/api/admin/posts/` → `/api/posts/` (admin権限チェック)
  - `/api/admin/settings/` → `/api/settings/`

### 6. Settings (設定)
- **現在**: `/api/settings/public/`
- **新規**: 
  - `/api/settings/` (GET, PUT) - 管理者用
  - `/api/settings/public/` (GET) - 公開設定

### 7. Media/Upload (メディア)
- **現在**: `/api/upload/`
- **新規**: 
  - `/api/media/` (GET, POST) - メディア一覧・アップロード
  - `/api/media/[id]/` (GET, DELETE) - 個別メディア操作

### 8. Webhooks
- **現在**: `/api/webhooks/`, `/api/webhooks/[id]/`
- **新規**: そのまま維持（既にRESTful）

## RESTful API設計原則

1. **リソースベースのURL**: `/api/users/123` ではなく `/api/user/profile/`
2. **HTTPメソッドの適切な使用**:
   - GET: リソース取得
   - POST: リソース作成
   - PUT: リソース更新（全体）
   - PATCH: リソース部分更新
   - DELETE: リソース削除
3. **ステータスコードの適切な使用**
4. **一貫したレスポンス形式**
5. **リソース間の関係を URL で表現**: `/api/posts/123/comments`

## 移行手順

1. 新しい構造でAPIを作成
2. 既存APIを新APIに段階的に移行
3. 古いAPIの廃止