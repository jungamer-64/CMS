/**
 * UI・エディター関連型定義
 * 
 * ブロックエディター、コンポーネント等のUI機能で使用される型を定義します。
 */

// ============================================================================
// ブロックエディター型
// ============================================================================

/**
 * ブロックの種類
 */
export type BlockType = 'text' | 'image' | 'heading' | 'columns' | 'spacer' | 'button' | 'video' | 'list' | 'quote' | 'code' | 'divider';

/**
 * ブロック設定の詳細型
 */
export interface BlockSettings {
  readonly alignment?: 'left' | 'center' | 'right';
  readonly size?: 'small' | 'medium' | 'large';
  readonly columns?: number;
  readonly color?: string;
  readonly backgroundColor?: string;
  readonly padding?: string;
  readonly margin?: string;
  readonly children?: Block[];
  // 見出しブロック用のプロパティ
  readonly level?: 1 | 2 | 3 | 4 | 5 | 6;
  // スペーサーブロック用のプロパティ
  readonly height?: number;
  // ボタンブロック用のプロパティ
  readonly url?: string;
  readonly target?: '_blank' | '_self';
  // 画像・動画ブロック用のプロパティ
  readonly src?: string;
  readonly alt?: string;
  readonly width?: number;
  // 汎用スタイル設定
  readonly style?: Record<string, string>;
}

/**
 * ブロックデータの型定義
 */
export interface Block {
  readonly id: string;
  readonly type: BlockType;
  readonly content: string;
  readonly settings?: BlockSettings;
}

/**
 * ブロックエディターのプロパティ型
 */
export interface BlockEditorProps {
  readonly blocks: Block[];
  readonly onChange: (blocks: Block[]) => void;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
}

// ============================================================================
// 認証コンテキスト型
// ============================================================================

/**
 * 認証コンテキストの型定義
 */
export interface AuthContextType {
  readonly user: {
    readonly id: string;
    readonly username: string;
    readonly email: string;
    readonly displayName: string;
    readonly role: 'user' | 'admin';
  } | null;
  readonly loading: boolean;
  readonly isLoading?: boolean; // 既存コードとの互換性
  readonly login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  readonly logout: () => Promise<void>;
  readonly refresh?: () => Promise<void>;
  readonly refreshAuth?: () => Promise<void>; // 既存コードとの互換性
}

// ============================================================================
// レイアウトコンポーネント型
// ============================================================================

/**
 * レイアウトコンポーネントの型定義
 */
export interface LayoutComponent {
  readonly id: string;
  readonly type: string;
  readonly content: string;
  readonly settings?: {
    readonly [key: string]: unknown;
  };
}

/**
 * レイアウトコンポーネント入力型
 */
export interface LayoutComponentInput {
  readonly id?: string;
  readonly type: string;
  readonly content: string;
  readonly settings?: {
    readonly [key: string]: unknown;
  };
}

// ============================================================================
// テーマ設定型
// ============================================================================

/**
 * テーマ設定型
 */
export interface ThemeSettings {
  readonly colorScheme: {
    readonly primary: string;
    readonly secondary: string;
    readonly background: string;
    readonly text: string;
    readonly accent?: string;
  };
  readonly typography: {
    readonly fontFamily: string;
    readonly fontSize: {
      readonly base: string;
      readonly heading?: string;
    };
  };
  readonly spacing: {
    readonly spacing: string;
  };
  readonly layout: {
    readonly maxWidth?: string;
  };
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly darkMode: boolean;
}

/**
 * テーマ設定入力型
 */
export interface ThemeSettingsInput {
  readonly colorScheme?: {
    readonly primary?: string;
    readonly secondary?: string;
    readonly background?: string;
    readonly text?: string;
    readonly accent?: string;
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
    readonly spacing?: string;
    readonly maxWidth?: string;
  };
  readonly layout?: {
    readonly maxWidth?: string;
    readonly spacing?: string;
    readonly borderRadius?: string;
  };
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly fontFamily?: string;
  readonly fontSize?: string;
  readonly darkMode?: boolean;
  readonly isActive?: boolean;
}
