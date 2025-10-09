import type { Collection } from 'mongodb';
import type {
  GlobalStyles,
  GlobalStylesInput,
  HomePage,
  HomePageInput,
  LayoutComponent,
  LayoutComponentInput,
} from './core/types/api-unified';
import type {
  ThemeSettings,
  ThemeSettingsInput
} from './core/types/ui-types';
import { getDatabase } from './data/connections/mongodb';

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

/**
 * カラースキームのデフォルト値を設定
 */
function buildColorScheme(input: GlobalStylesInput): GlobalStyles['colorScheme'] {
  return {
    primary: input.colorScheme?.primary || '#000000',
    secondary: input.colorScheme?.secondary || '#ffffff',
    accent: input.colorScheme?.accent || '#0070f3',
    background: input.colorScheme?.background || '#ffffff',
    text: input.colorScheme?.text || '#212529',
  };
}

/**
 * タイポグラフィ設定のデフォルト値を設定
 */
function buildTypography(input: GlobalStylesInput): GlobalStyles['typography'] {
  return {
    fontFamily: input.typography?.fontFamily || 'system-ui',
    fontSize: {
      base: input.typography?.fontSize?.base || '16px',
      heading: input.typography?.fontSize?.heading,
      small: input.typography?.fontSize?.small || '14px',
    },
  };
}

/**
 * レイアウト設定のデフォルト値を設定
 */
function buildLayout(input: GlobalStylesInput): GlobalStyles['layout'] {
  return {
    maxWidth: input.layout?.maxWidth,
    spacing: input.layout?.spacing || '1rem',
    borderRadius: input.layout?.borderRadius || '4px',
  };
}

/**
 * スペーシング設定のデフォルト値を設定
 */
function buildSpacing(input: GlobalStylesInput): GlobalStyles['spacing'] {
  return {
    containerMaxWidth: input.spacing?.containerMaxWidth || '1200px',
  };
}

// スタイル作成
export async function createGlobalStyles(stylesData: GlobalStylesInput): Promise<GlobalStyles> {
  const collection = await getGlobalStylesCollection();
  const now = new Date();

  // 新しいスタイルをアクティブにする場合、他を非アクティブに
  if (stylesData.isActive) {
    await collection.updateMany({}, { $set: { isActive: false } });
  }

  const styles: GlobalStyles & { createdAt: Date; updatedAt: Date } = {
    primaryColor: stylesData.primaryColor || '#000000',
    secondaryColor: stylesData.secondaryColor || '#ffffff',
    accentColor: stylesData.accentColor || '#0070f3',
    backgroundColor: stylesData.backgroundColor || '#ffffff',
    fontFamily: stylesData.fontFamily || 'system-ui',
    fontSize: stylesData.fontSize || '16px',
    darkMode: false,
    colorScheme: buildColorScheme(stylesData),
    typography: buildTypography(stylesData),
    spacing: buildSpacing(stylesData),
    layout: buildLayout(stylesData),
    variables: stylesData.variables,
    customCss: stylesData.customCss,
    createdAt: now,
    updatedAt: now,
  };

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

  // updatesから未定義の値を除去してMongoDBに送信
  const updateFields: Record<string, unknown> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields[key] = value;
    }
  });
  updateFields.updatedAt = new Date();

  const result = await collection.findOneAndUpdate(
    { id },
    { $set: updateFields },
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

  const defaultTheme: ThemeSettings & { id: string; isActive: boolean; createdAt: Date; updatedAt: Date } = {
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
      },
    },
    spacing: {
      spacing: '2rem',
    },
    layout: {
      maxWidth: '1200px',
    },
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#06b6d4',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16px',
    darkMode: false,
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
    if (theme.typography.fontSize.heading) {
      css += `  --font-size-heading: ${theme.typography.fontSize.heading};\n`;
    }

    // スペーシング
    css += `  --spacing: ${theme.spacing.spacing};\n`;

    // レイアウト
    if (theme.layout.maxWidth) {
      css += `  --max-width: ${theme.layout.maxWidth};\n`;
    }
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
