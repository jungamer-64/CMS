// スタブファイル - settings
export interface Settings {
  siteName: string;
  siteDescription: string;
  commentsEnabled: boolean;
}

export interface SettingsResponse {
  success: boolean;
  data?: Settings;
  error?: string;
}

export const getSettings = async (): Promise<SettingsResponse> => {
  return {
    success: true,
    data: {
      siteName: 'Test Site',
      siteDescription: 'Test Description',
      commentsEnabled: true
    }
  };
};

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  throw new Error('Not implemented');
};
