# 共通化された検索システム

このプロジェクトでは、高度な検索機能を共通化して再利用可能にしました。

## 📁 ファイル構成

```
app/lib/
├── search-engine.ts           # 検索エンジンの核心機能
├── hooks/
│   └── use-search.tsx        # React検索フック
└── ui/components/search/
    └── SearchComponents.tsx  # 検索UIコンポーネント
```

## 🔍 機能概要

### 検索エンジン (`search-engine.ts`)
- **論理演算**: AND (`&`), OR (`|`), NOT (`!`)
- **ワイルドカード**: `*` による前方・後方・部分一致
- **括弧グループ化**: `(term1 | term2) & term3`
- **完全一致**: `"exact phrase"`
- **ファイルタイプ検索**: `filetype:jpg`, `filetype:video`
- **日付フィルター**: `before:2024-01-01`, `after:2023/12/31`
- **自動検知**: 入力内容に応じてモードを自動切り替え

### Reactフック (`use-search.tsx`)
- 検索状態の管理
- 自動フィルタリング
- プレースホルダー生成
- ヘルプテキスト提供

### UIコンポーネント (`SearchComponents.tsx`)
- `SearchInput`: 検索入力フィールド
- `RegexToggleButton`: 正規表現切り替え
- `SearchBar`: 完全な検索バー
- `SearchStats`: 検索統計表示
- `EmptySearchResults`: 空結果表示

## 📖 使用方法

### 1. 基本的な使用例

```tsx
import { useSearch, SearchBar, EmptySearchResults } from '@/lib';
import type { SearchableItem } from '@/lib';

interface MyItem extends SearchableItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

function MySearchComponent({ items }: { items: MyItem[] }) {
  const search = useSearch(items, {
    searchFields: ['title', 'content'],
    dateField: 'createdAt',
  });

  return (
    <div>
      <SearchBar search={search} placeholder="記事を検索..." />
      
      {search.filteredItems.length === 0 ? (
        <EmptySearchResults 
          hasSearchTerm={Boolean(search.searchTerm)}
          emptyMessage="記事がありません"
          noResultsMessage="検索条件に一致する記事が見つかりません"
        />
      ) : (
        <div>
          {search.filteredItems.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. カスタム検索フィールド

```tsx
const search = useSearch(products, {
  searchFields: ['name', 'description', 'brand'],
  filenameField: 'sku',  // SKUをファイル名として扱う
  dateField: 'releaseDate',
  getFileType: (sku) => sku.startsWith('ELEC') ? 'electronics' : 'other',
});
```

### 3. 個別コンポーネントの使用

```tsx
import { SearchInput, RegexToggleButton, SearchStats } from '@/lib';

function CustomSearchUI({ search, totalCount, selectedCount }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <SearchInput search={search} />
        <RegexToggleButton search={search} />
      </div>
      
      <SearchStats
        totalCount={totalCount}
        filteredCount={search.filteredItems.length}
        selectedCount={selectedCount}
      />
    </div>
  );
}
```

### 4. 投稿管理での実装例

```tsx
// 投稿管理ページでの実装例
export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Post型をSearchableItemに適合させる
  const searchablePosts = useMemo(() => {
    return posts.map(post => ({
      ...post,
      createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt)
    }));
  }, [posts]);

  const search = useSearch(searchablePosts, {
    searchFields: ['title', 'content', 'author', 'slug'],
    dateField: 'createdAt',
    getFileType: () => 'post',
  });

  return (
    <div>
      <SearchBar 
        search={search} 
        placeholder="タイトル、内容、著者、スラッグで検索..."
        showHelp={true}
      />
      {/* 投稿一覧表示 */}
    </div>
  );
}
```

```tsx
import { SearchInput, RegexToggleButton, SearchStats } from '@/lib';

function CustomSearchUI({ search, totalCount, selectedCount }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <SearchInput search={search} />
        <RegexToggleButton search={search} />
      </div>
      
      <SearchStats
        totalCount={totalCount}
        filteredCount={search.filteredItems.length}
        selectedCount={selectedCount}
      />
    </div>
  );
}
```

## 🎯 検索クエリ例

| クエリ | 説明 |
|--------|------|
| `photo` | "photo"を含むアイテム |
| `photo*` | "photo"で始まるアイテム |
| `*holiday*` | "holiday"を含むアイテム |
| `photo image` | "photo"と"image"の両方を含む |
| `photo \| video` | "photo"または"video"を含む |
| `!temp` | "temp"を含まない |
| `"完全一致"` | 完全に一致する文字列 |
| `filetype:jpg` | JPGファイル |
| `before:2024-01-01` | 2024年1月1日以前 |
| `after:2023/12/31` | 2023年12月31日以降 |
| `(photo* \| image) & !temp` | 複合条件 |

## 🔧 型定義

### SearchableItem
```tsx
interface SearchableItem {
  [key: string]: unknown;
  uploadDate?: string;
  filename?: string;
}
```

### SearchOptions
```tsx
interface SearchOptions {
  isRegex?: boolean;
  dateField?: string;
  filenameField?: string;
}

interface UseSearchOptions<T extends SearchableItem> extends SearchOptions {
  searchFields: (keyof T)[];
  getFileType?: (filename: string) => string;
}
```

## 🚀 実装済み箇所

- **メディア管理** (`/app/admin/media/page.tsx`): 
  - ファイル名・アップロード日・メディアタイプでの検索
  - ワイルドカード・論理演算・日付フィルター対応

- **投稿管理** (`/app/admin/posts/page.tsx`):
  - タイトル・内容・著者・スラッグでの検索
  - ステータスフィルター（すべて・公開済み・削除済み）との組み合わせ
  - 論理演算・ワイルドカード・日付フィルター対応

## 📈 今後の拡張可能性

1. **ユーザー検索**: 管理者用ユーザー検索
2. **コメント検索**: コメント管理での検索
3. **タグ検索**: タグベースの絞り込み
4. **カテゴリ検索**: カテゴリ別フィルタリング
5. **サイズフィルター**: `size:>10MB`形式
6. **期間検索**: `range:2024-01-01:2024-12-31`
7. **ページ検索**: 静的ページでの検索機能

## 🧪 テスト

検索エンジンの各機能は以下でテストできます：

```tsx
import { hasLogicalOperators, filterItems } from '@/lib';

// 論理演算の検知
console.log(hasLogicalOperators('photo & image')); // true
console.log(hasLogicalOperators('simple')); // false

// アイテムフィルタリング（新しい高速API）
const items = [
  { title: 'Summer vacation', uploadDate: '2024-07-01', author: 'john' },
  { title: 'Work meeting', uploadDate: '2024-08-01', author: 'jane' }
];

// 基本検索
const basicResults = filterItems(items, 'vacation');
console.log(basicResults.length); // 1

// 高度な検索
const advancedResults = filterItems(items, 'author:john & vacation', {
  authorField: 'author',
  titleField: 'title',
  dateField: 'uploadDate',
  maxResults: 100
});
console.log(advancedResults.length); // 1

// 日付範囲検索
const dateResults = filterItems(items, 'after:2024-07-01 & before:2024-08-01');
console.log(dateResults.length); // 1
```
