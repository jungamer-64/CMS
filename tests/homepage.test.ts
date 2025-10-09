/**
 * Homepage Helper Functions ユニットテスト
 * 
 * homepage.tsのリファクタリング後のヘルパー関数をテストします。
 * buildColorScheme, buildTypography, buildLayout, buildSpacingの動作を検証します。
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { GlobalStylesInput } from '../app/lib/core/types/api-unified';

// モジュールのモック
vi.mock('../app/lib/data/connections/mongodb', () => ({
  getDatabase: vi.fn().mockResolvedValue({
    collection: vi.fn().mockReturnValue({
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateMany: vi.fn(),
    }),
  }),
}));

// homepage.tsから必要な関数をインポート
// 注: buildXXX関数はprivateなので、createGlobalStyles経由でテストします
import { createGlobalStyles } from '../app/lib/homepage';

describe('Homepage Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('buildColorScheme - カラースキームのデフォルト値処理', () => {
    it('すべてのカラースキーム値が指定されている場合、そのまま使用', async () => {
      const input: GlobalStylesInput = {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        accentColor: '#0000ff',
        backgroundColor: '#f0f0f0',
        colorScheme: {
          primary: '#ff0000',
          secondary: '#00ff00',
          accent: '#0000ff',
          background: '#f0f0f0',
          text: '#111111',
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      expect(result.colorScheme.primary).toBe('#ff0000');
      expect(result.colorScheme.secondary).toBe('#00ff00');
      expect(result.colorScheme.accent).toBe('#0000ff');
      expect(result.colorScheme.background).toBe('#f0f0f0');
      expect(result.colorScheme.text).toBe('#111111');
    });

    it('カラースキームが未指定の場合、デフォルト値を使用', async () => {
      const input: GlobalStylesInput = {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        accentColor: '#0070f3',
        backgroundColor: '#ffffff',
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      // デフォルト値の確認
      expect(result.colorScheme.primary).toBe('#000000');
      expect(result.colorScheme.secondary).toBe('#ffffff');
      expect(result.colorScheme.accent).toBe('#0070f3');
      expect(result.colorScheme.background).toBe('#ffffff');
      expect(result.colorScheme.text).toBe('#212529'); // デフォルト
    });

    it('一部のカラースキーム値が未指定の場合、デフォルト値を補完', async () => {
      const input: GlobalStylesInput = {
        primaryColor: '#ff0000',
        colorScheme: {
          primary: '#ff0000',
          // secondary, accent, background, textは未指定
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      expect(result.colorScheme.primary).toBe('#ff0000');
      expect(result.colorScheme.secondary).toBe('#ffffff'); // デフォルト
      expect(result.colorScheme.accent).toBe('#0070f3'); // デフォルト
      expect(result.colorScheme.background).toBe('#ffffff'); // デフォルト
      expect(result.colorScheme.text).toBe('#212529'); // デフォルト
    });
  });

  describe('buildTypography - タイポグラフィのデフォルト値処理', () => {
    it('すべてのタイポグラフィ値が指定されている場合、そのまま使用', async () => {
      const input: GlobalStylesInput = {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        typography: {
          fontFamily: 'Roboto, sans-serif',
          fontSize: {
            base: '18px',
            heading: '32px',
            small: '12px',
          },
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      expect(result.typography.fontFamily).toBe('Roboto, sans-serif');
      expect(result.typography.fontSize.base).toBe('18px');
      expect(result.typography.fontSize.heading).toBe('32px');
      expect(result.typography.fontSize.small).toBe('12px');
    });

    it('タイポグラフィが未指定の場合、デフォルト値を使用', async () => {
      const input: GlobalStylesInput = {
        primaryColor: '#000000',
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      // デフォルト値の確認
      expect(result.typography.fontFamily).toBe('system-ui');
      expect(result.typography.fontSize.base).toBe('16px');
      expect(result.typography.fontSize.heading).toBeUndefined();
      expect(result.typography.fontSize.small).toBe('14px');
    });

    it('一部のタイポグラフィ値が未指定の場合、デフォルト値を補完', async () => {
      const input: GlobalStylesInput = {
        typography: {
          fontFamily: 'Georgia, serif',
          fontSize: {
            base: '20px',
            // heading, smallは未指定
          },
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      expect(result.typography.fontFamily).toBe('Georgia, serif');
      expect(result.typography.fontSize.base).toBe('20px');
      expect(result.typography.fontSize.heading).toBeUndefined();
      expect(result.typography.fontSize.small).toBe('14px'); // デフォルト
    });

    it('フォントサイズのheadingのみ指定された場合', async () => {
      const input: GlobalStylesInput = {
        typography: {
          fontSize: {
            heading: '48px',
          },
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      expect(result.typography.fontFamily).toBe('system-ui'); // デフォルト
      expect(result.typography.fontSize.base).toBe('16px'); // デフォルト
      expect(result.typography.fontSize.heading).toBe('48px');
      expect(result.typography.fontSize.small).toBe('14px'); // デフォルト
    });
  });

  describe('buildLayout - レイアウトのデフォルト値処理', () => {
    it('すべてのレイアウト値が指定されている場合、そのまま使用', async () => {
      const input: GlobalStylesInput = {
        layout: {
          maxWidth: '1400px',
          spacing: '2rem',
          borderRadius: '8px',
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      expect(result.layout.maxWidth).toBe('1400px');
      expect(result.layout.spacing).toBe('2rem');
      expect(result.layout.borderRadius).toBe('8px');
    });

    it('レイアウトが未指定の場合、デフォルト値を使用', async () => {
      const input: GlobalStylesInput = {
        primaryColor: '#000000',
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      // デフォルト値の確認
      expect(result.layout.maxWidth).toBeUndefined();
      expect(result.layout.spacing).toBe('1rem');
      expect(result.layout.borderRadius).toBe('4px');
    });

    it('一部のレイアウト値が未指定の場合、デフォルト値を補完', async () => {
      const input: GlobalStylesInput = {
        layout: {
          maxWidth: '1600px',
          // spacing, borderRadiusは未指定
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      expect(result.layout.maxWidth).toBe('1600px');
      expect(result.layout.spacing).toBe('1rem'); // デフォルト
      expect(result.layout.borderRadius).toBe('4px'); // デフォルト
    });
  });

  describe('buildSpacing - スペーシングのデフォルト値処理', () => {
    it('スペーシング値が指定されている場合、そのまま使用', async () => {
      const input: GlobalStylesInput = {
        spacing: {
          containerMaxWidth: '1800px',
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      expect(result.spacing.containerMaxWidth).toBe('1800px');
    });

    it('スペーシングが未指定の場合、デフォルト値を使用', async () => {
      const input: GlobalStylesInput = {
        primaryColor: '#000000',
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      // デフォルト値の確認
      expect(result.spacing.containerMaxWidth).toBe('1200px');
    });
  });

  describe('統合テスト - 複数のヘルパー関数が協調動作', () => {
    it('すべての設定が組み合わさって正しいスタイルオブジェクトが生成される', async () => {
      const input: GlobalStylesInput = {
        primaryColor: '#ff6b6b',
        secondaryColor: '#4ecdc4',
        accentColor: '#ffe66d',
        backgroundColor: '#f7f7f7',
        fontFamily: 'Inter, sans-serif',
        fontSize: '17px',
        colorScheme: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          accent: '#ffe66d',
          background: '#f7f7f7',
          text: '#2d3748',
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          fontSize: {
            base: '17px',
            heading: '36px',
            small: '13px',
          },
        },
        layout: {
          maxWidth: '1300px',
          spacing: '1.5rem',
          borderRadius: '6px',
        },
        spacing: {
          containerMaxWidth: '1300px',
        },
        isActive: true,
      };

      const result = await createGlobalStyles(input);
      
      // すべてのセクションが正しく設定されているか確認
      expect(result.primaryColor).toBe('#ff6b6b');
      expect(result.colorScheme.primary).toBe('#ff6b6b');
      expect(result.typography.fontFamily).toBe('Inter, sans-serif');
      expect(result.layout.maxWidth).toBe('1300px');
      expect(result.spacing.containerMaxWidth).toBe('1300px');
    });

    it('最小限の入力でも有効なスタイルオブジェクトが生成される', async () => {
      const input: GlobalStylesInput = {
        isActive: false,
      };

      const result = await createGlobalStyles(input);
      
      // すべてのフィールドがデフォルト値で埋まっているか確認
      expect(result.primaryColor).toBe('#000000');
      expect(result.colorScheme.primary).toBe('#000000');
      expect(result.typography.fontFamily).toBe('system-ui');
      expect(result.layout.spacing).toBe('1rem');
      expect(result.spacing.containerMaxWidth).toBe('1200px');
    });
  });
});
