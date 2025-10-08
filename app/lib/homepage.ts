import type { Collection } from 'mongodb';
import type {
  ThemeSettings,
  ThemeSettingsInput
} from './core/types';
import { getDatabase } from './data/connections/mongodb';
import type {
  GlobalStyles,
  GlobalStylesInput,
  HomePage,
  HomePageInput,
  LayoutComponent,
  LayoutComponentInput,
} from './unified-types';

// =============================================================================
// ホームページ管理
// =============================================================================

export async function getHomePageCollection(): Promise<Collection<HomePage>> {
  const db = await getDatabase();
  return db.collection<HomePage>('homepage');
}

export async function getLayoutComponentsCollection(): Promise<Collection<LayoutComponent>> {
  const db = await getDatabase();
  return db.collection<LayoutComponent>('layout_components');
}

export async function getGlobalStylesCollection(): Promise<Collection<GlobalStyles>> {
  const db = await getDatabase();
  return db.collection<GlobalStyles>('global_styles');
}

export async function getThemeSettingsCollection(): Promise<Collection<ThemeSettings>> {
  const db = await getDatabase();
  return db.collection<ThemeSettings>('theme_settings');
}

// ホームページ取得（現在アクティブなもの）
export async function getActivePage(): Promise<HomePage | null> {
  const collection = await getHomePageCollection();
  return await collection.findOne({}, { sort: { updatedAt: -1 } });
}

// ホームページ保存/更新
export async function saveHomePage(pageData: HomePageInput): Promise<HomePage> {
  const collection = await getHomePageCollection();
  const now = new Date();

  // LayoutComponentInputをLayoutComponentに変換
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const components: readonly any[] = (pageData.components || []).map((comp, index) => ({
    id: comp.id || crypto.randomUUID(), // idが未定義の場合は生成
    type: comp.type,
    content: JSON.stringify(comp.content), // Record<string, unknown>をstringに変換
    isActive: comp.isActive ?? true, // 未定義の場合はtrueに設定
    order: comp.order ?? index, // 未定義の場合はインデックスを使用
    createdAt: now,
    updatedAt: now,
  }));

  const homePage: HomePage = {
    id: crypto.randomUUID(),
    title: pageData.title || 'ホームページ',
    content: pageData.content || '',
    styles: (pageData.styles as GlobalStyles) || {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      accentColor: '#0070f3',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui',
      fontSize: '16px',
    },
    components,
    isActive: true, // ホームページ自体のisActiveプロパティ
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(homePage);
  return homePage;
}

// ホームページ更新
export async function updateHomePage(id: string, updates: Partial<HomePageInput>): Promise<HomePage | null> {
  const collection = await getHomePageCollection();

  // updatesにcomponentsが含まれている場合は変換
  let processedUpdates: Record<string, unknown> = { ...updates };
  if (updates.components) {
    processedUpdates = {
      ...processedUpdates,
      components: updates.components.map((comp, index) => ({
        ...comp,
        id: comp.id || crypto.randomUUID(),
        isActive: comp.isActive ?? true,
        order: comp.order ?? index
      }))
    };
  }

  const result = await collection.findOneAndUpdate(
    { id },
    {
      $set: {
        ...processedUpdates,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );
  return result;
}

// =============================================================================
// レイアウトコンポーネント管理
// =============================================================================

// コンポーネント一覧取得
export async function getLayoutComponents(): Promise<LayoutComponent[]> {
  const collection = await getLayoutComponentsCollection();
  return await collection.find({}).sort({ order: 1, name: 1 }).toArray();
}

// アクティブなコンポーネント取得
export async function getActiveLayoutComponents(): Promise<LayoutComponent[]> {
  const collection = await getLayoutComponentsCollection();
  return await collection.find({ isActive: true }).sort({ order: 1 }).toArray();
}

// コンポーネント作成
export async function createLayoutComponent(componentData: LayoutComponentInput): Promise<LayoutComponent> {
  const collection = await getLayoutComponentsCollection();

  const now = new Date();

  const component: LayoutComponent = {
    id: componentData.id || crypto.randomUUID(),
    type: componentData.type,
    content: JSON.stringify(componentData.content), // Record<string, unknown>をstringに変換
    isActive: componentData.isActive ?? true,
    order: componentData.order ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(component);
  return component;
}

// コンポーネント更新
export async function updateLayoutComponent(id: string, updates: Partial<LayoutComponentInput>): Promise<LayoutComponent | null> {
  const collection = await getLayoutComponentsCollection();

  // content フィールドを string に変換
  const processedUpdates: Partial<LayoutComponent> = {
    ...updates,
    content: updates.content ? JSON.stringify(updates.content) : undefined,
    updatedAt: new Date(),
  };

  const result = await collection.findOneAndUpdate(
    { id },
    { $set: processedUpdates },
    { returnDocument: 'after' }
  );
  return result;
}

// コンポーネント削除
export async function deleteLayoutComponent(id: string): Promise<boolean> {
  const collection = await getLayoutComponentsCollection();
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

// =============================================================================
// グローバルスタイル管理
// =============================================================================

// スタイル一覧取得
export async function getGlobalStyles(): Promise<GlobalStyles[]> {
  const collection = await getGlobalStylesCollection();
  return await collection.find({}).sort({ createdAt: -1 }).toArray();
}

// アクティブなスタイル取得
export async function getActiveGlobalStyles(): Promise<GlobalStyles | null> {
  const collection = await getGlobalStylesCollection();
  return await collection.findOne({ isActive: true });
}

// スタイル作成
export async function createGlobalStyles(stylesData: GlobalStylesInput): Promise<GlobalStyles> {
  const collection = await getGlobalStylesCollection();
  const now = new Date();

  // 新しいスタイルをアクティブにする場合、他を非アクティブに
  if (stylesData.isActive) {
    await collection.updateMany({}, { $set: { isActive: false } });
  }

  // themeSettingsがある場合はidとcreatedAtを追加し、必要なプロパティのデフォルト値を設定
  let processedThemeSettings: ThemeSettings | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((stylesData as any).themeSettings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const themeInput = (stylesData as any).themeSettings;
    const defaultColorScheme = {
      primary: '#007bff',
      secondary: '#6c757d',
      accent: '#28a745',
      background: '#ffffff',
      text: '#212529'
    };

    const defaultTypography = {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        base: '16px',
        heading: '24px',
        small: '14px'
      }
    };

    const colorScheme = themeInput.colorScheme ? {
      primary: themeInput.colorScheme.primary || defaultColorScheme.primary,
      secondary: themeInput.colorScheme.secondary || defaultColorScheme.secondary,
      accent: themeInput.colorScheme.accent || defaultColorScheme.accent,
      background: themeInput.colorScheme.background || defaultColorScheme.background,
      text: themeInput.colorScheme.text || defaultColorScheme.text
    } : defaultColorScheme;

    const typography = themeInput.typography ? {
      fontFamily: themeInput.typography.fontFamily || defaultTypography.fontFamily,
      fontSize: themeInput.typography.fontSize ? {
        base: themeInput.typography.fontSize.base || defaultTypography.fontSize.base,
        heading: themeInput.typography.fontSize.heading || defaultTypography.fontSize.heading,
        small: themeInput.typography.fontSize.small || defaultTypography.fontSize.small
      } : defaultTypography.fontSize
    } : defaultTypography;

    const defaultSpacing = {
      containerMaxWidth: '1200px',
      sectionPadding: '2rem'
    };

    const defaultLayout = {
      maxWidth: '1200px',
      spacing: '1rem',
      borderRadius: '0.5rem'
    };

    const spacing = themeInput.spacing ? {
      containerMaxWidth: themeInput.spacing.containerMaxWidth || defaultSpacing.containerMaxWidth,
      sectionPadding: themeInput.spacing.sectionPadding || defaultSpacing.sectionPadding
    } : defaultSpacing;

    const layout = themeInput.layout ? {
      maxWidth: themeInput.layout.maxWidth || defaultLayout.maxWidth,
      spacing: themeInput.layout.spacing || defaultLayout.spacing,
      borderRadius: themeInput.layout.borderRadius || defaultLayout.borderRadius
    } : defaultLayout;

    processedThemeSettings = {
      ...themeInput,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isActive: themeInput.isActive ?? false,
      colorScheme,
      typography,
      spacing,
      layout
    };
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const styles: any = {
    id: crypto.randomUUID(),
    primaryColor: stylesData.primaryColor || '#000000',
    secondaryColor: stylesData.secondaryColor || '#ffffff',
    accentColor: stylesData.accentColor || '#0070f3',
    backgroundColor: stylesData.backgroundColor || '#ffffff',
    fontFamily: stylesData.fontFamily || 'system-ui',
    fontSize: stylesData.fontSize || '16px',
    darkMode: false,
    colorScheme: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#0070f3',
      background: '#ffffff',
      text: '#212529',
    },
    isActive: stylesData.isActive ?? false,
    createdAt: now,
    updatedAt: now,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  await collection.insertOne(styles);
  return styles;
}

// スタイル更新
export async function updateGlobalStyles(id: string, updates: Partial<GlobalStylesInput>): Promise<GlobalStyles | null> {
  const collection = await getGlobalStylesCollection();

  // アクティブ状態を変更する場合の処理
  if (updates.isActive === true) {
    await collection.updateMany({ id: { $ne: id } }, { $set: { isActive: false } });
  }

  const result = await collection.findOneAndUpdate(
    { id },
    {
      $set: {
        ...(updates as Record<string, unknown>),
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );
  return result;
}

// スタイル削除
export async function deleteGlobalStyles(id: string): Promise<boolean> {
  const collection = await getGlobalStylesCollection();
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

// =============================================================================
// テーマ設定管理
// =============================================================================

// テーマ設定取得
export async function getActiveThemeSettings(): Promise<ThemeSettings | null> {
  const collection = await getThemeSettingsCollection();
  return await collection.findOne({ isActive: true });
}

// テーマ設定一覧取得
export async function getAllThemeSettings(): Promise<ThemeSettings[]> {
  const collection = await getThemeSettingsCollection();
  return await collection.find({}).sort({ createdAt: -1 }).toArray();
}

// デフォルトテーマ設定を作成
export async function createDefaultThemeSettings(): Promise<ThemeSettings> {
  const collection = await getThemeSettingsCollection();
  const now = new Date();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const defaultTheme: any = {
    id: crypto.randomUUID(),
    colorScheme: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#ffffff',
      text: '#1f2937',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        base: '16px',
        heading: '24px',
        small: '14px',
      } as any,
    },
    spacing: {
      containerMaxWidth: '1200px',
      sectionPadding: '2rem',
    } as any,
    layout: {
      maxWidth: '1200px',
      spacing: '1rem',
      borderRadius: '0.5rem',
    } as any,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  // 他のテーマを非アクティブに
  await collection.updateMany({}, { $set: { isActive: false } });
  await collection.insertOne(defaultTheme);
  return defaultTheme;
}

// テーマ設定更新
export async function updateThemeSettings(id: string, updates: ThemeSettingsInput): Promise<ThemeSettings | null> {
  const collection = await getThemeSettingsCollection();

  // アクティブ状態を変更する場合の処理
  if (updates.isActive === true) {
    await collection.updateMany({ id: { $ne: id } }, { $set: { isActive: false } });
  }

  const result = await collection.findOneAndUpdate(
    { id },
    {
      $set: {
        ...(updates as Record<string, unknown>),
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );
  return result;
}

// CSS変数を生成
export async function generateThemeCssVariables(): Promise<string> {
  const theme = await getActiveThemeSettings();
  const globalStyles = await getActiveGlobalStyles();

  let css = ':root {\n';

  if (theme) {
    // カラーパレット
    css += `  --color-primary: ${theme.colorScheme.primary};\n`;
    css += `  --color-secondary: ${theme.colorScheme.secondary};\n`;
    css += `  --color-accent: ${theme.colorScheme.accent};\n`;
    css += `  --color-background: ${theme.colorScheme.background};\n`;
    css += `  --color-text: ${theme.colorScheme.text};\n`;

    // タイポグラフィ
    css += `  --font-family: ${theme.typography.fontFamily};\n`;
    css += `  --font-size-base: ${theme.typography.fontSize.base};\n`;
    css += `  --font-size-heading: ${theme.typography.fontSize.heading};\n`;
    css += `  --font-size-small: ${(theme.typography.fontSize as any).small};\n`;

    // レイアウト
    css += `  --max-width: ${theme.layout.maxWidth};\n`;
    css += `  --spacing: ${(theme.layout as any).spacing};\n`;
    css += `  --border-radius: ${(theme.layout as any).borderRadius};\n`;
  }

  // グローバルスタイルのカスタム変数
  if (globalStyles?.variables) {
    Object.entries(globalStyles.variables).forEach(([key, value]) => {
      css += `  --${key}: ${value};\n`;
    });
  }

  css += '}\n';

  // グローバルスタイルのカスタムCSS
  if (globalStyles?.customCss) {
    css += '\n' + globalStyles.customCss;
  }

  return css;
}
