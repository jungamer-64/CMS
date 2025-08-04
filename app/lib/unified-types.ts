/**
 * 高速・厳格型安全統合型定義
 * 
 * - 後方互換性削除
 * - 型安全性強化
 * - パフォーマンス最適化
 * - 厳格なreadonlyインターフェイス
 */

// コア型システムからの直接エクスポート（厳格な型定義）
export type {
  // エンティティ型（厳格型安全）
  User,
  Post, 
  Comment,
  Settings,
  Page,
  PageEntity,
  MediaItem,
  ApiKey,
  
  // 入力型（厳格バリデーション）
  UserInput,
  PostInput,
  CommentInput,
  StaticPageInput,
  
  // API型（型安全レスポンス）
  ApiResponse,
  ApiSuccess,
  ApiError,
  PaginationMeta,
  
  // 基本型（厳格制約）
  UserRole,
  SortOrder,
  PostType,
  PostStatus,
  MediaType,
  PostSortField,
  UserSortField
} from './core/types';

// ============================================================================
// 厳格型安全カスタム型定義
// ============================================================================

/**
 * 高速ページネーション結果（厳格型制約）
 */
export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

/**
 * 型安全ホームページエンティティ
 */
export interface HomePage {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly components: readonly LayoutComponent[];
  readonly styles: GlobalStyles;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 厳格ホームページ入力型
 */
export interface HomePageInput {
  readonly title?: string;
  readonly content?: string;
  readonly components?: readonly LayoutComponentInput[];
  readonly styles?: GlobalStylesInput;
  readonly isActive?: boolean;
}

/**
 * 厳格グローバルスタイル型
 */
export interface GlobalStyles {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly darkMode: boolean;
  readonly variables?: Record<string, string>;
  readonly customCss?: string;
  readonly colorScheme: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
    readonly text: string;
  };
  readonly typography: {
    readonly fontFamily: string;
    readonly fontSize: {
      readonly base: string;
      readonly heading?: string;
      readonly small: string;
    };
  };
  readonly spacing: {
    readonly containerMaxWidth: string;
  };
  readonly layout: {
    readonly maxWidth?: string;
    readonly spacing: string;
    readonly borderRadius: string;
  };
}

/**
 * 厳格グローバルスタイル入力型
 */
export interface GlobalStylesInput {
  readonly name?: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly fontFamily?: string;
  readonly fontSize?: string;
  readonly darkMode?: boolean;
  readonly isActive?: boolean;
  readonly variables?: Record<string, string>;
  readonly customCss?: string;
  readonly colorScheme?: {
    readonly primary?: string;
    readonly secondary?: string;
    readonly accent?: string;
    readonly background?: string;
    readonly text?: string;
  };
  readonly typography?: {
    readonly fontFamily?: string;
    readonly fontSize?: {
      readonly base?: string;
      readonly heading?: string;
      readonly small?: string;
    };
  };
  readonly spacing?: {
    readonly containerMaxWidth?: string;
    readonly maxWidth?: string;
  };
  readonly layout?: {
    readonly maxWidth?: string;
    readonly spacing?: string;
    readonly borderRadius?: string;
  };
}

/**
 * 厳格レイアウトコンポーネント型
 */
export interface LayoutComponent {
  readonly id: string;
  readonly type: string;
  readonly content: string;
  readonly isActive: boolean;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 厳格レイアウトコンポーネント入力型
 */
export interface LayoutComponentInput {
  readonly id?: string;
  readonly type: string;
  readonly content: Record<string, unknown>;
  readonly isActive?: boolean;
  readonly order?: number;
}

// エクスポート（後方互換性）
const unifiedTypes = {};
export default unifiedTypes;
