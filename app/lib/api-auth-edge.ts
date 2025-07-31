import { NextRequest } from 'next/server';
import { ApiKey, ApiKeyPermissions } from './api-keys';

interface Settings {
  apiKeys: ApiKey[];
}

// Edge Runtime用のAPIキー管理
class EdgeApiAuth {
  private static settings: Settings | null = null;

  private static getSettings(): Settings {
    this.settings ??= (() => {
      // 環境変数からAPIキーを読み込み
      const apiKeysData = process.env.API_KEYS_DATA;
      if (apiKeysData) {
        try {
          return JSON.parse(apiKeysData);
        } catch (error) {
          console.error('Failed to parse API_KEYS_DATA:', error);
        }
      }
      
      // デフォルト設定
      return {
        apiKeys: [
          {
            id: 'default-key',
            name: 'Default API Key',
            key: process.env.DEFAULT_API_KEY || 'default-test-key',
            permissions: {
              posts: {
                create: true,
                read: true,
                update: true,
                delete: false
              },
              comments: {
                read: true,
                moderate: false
              },
              settings: {
                read: false
              }
            },
            isActive: true,
            createdAt: new Date(),
            lastUsed: undefined
          }
        ]
      };
    })();
    return this.settings!;
  }

  static validateApiKey(apiKey: string): ApiKey | null {
    const settings = this.getSettings();
    const key = settings.apiKeys.find(k => k.key === apiKey && k.isActive);
    
    if (key) {
      // 使用時間を更新（実際のアプリケーションでは永続化が必要）
      key.lastUsed = new Date();
    }
    
    return key || null;
  }

  static getApiKeyFromRequest(request: NextRequest): string | null {
    // Authorization Bearerヘッダーから取得
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // X-API-Keyヘッダーから取得
    const apiKeyHeader = request.headers.get('x-api-key');
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // クエリパラメータから取得
    const url = new URL(request.url);
    const apiKeyParam = url.searchParams.get('api_key');
    if (apiKeyParam) {
      return apiKeyParam;
    }

    return null;
  }

  static checkPermissions(apiKey: ApiKey, requiredPermissions: Partial<ApiKeyPermissions>): boolean {
    // 各権限をチェック
    for (const [category, permissions] of Object.entries(requiredPermissions)) {
      if (permissions && typeof permissions === 'object') {
        const apiKeyCategory = apiKey.permissions[category as keyof ApiKeyPermissions];
        for (const [permission, required] of Object.entries(permissions)) {
          if (required && !apiKeyCategory[permission as keyof typeof apiKeyCategory]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  static async authenticateRequest(
    request: NextRequest,
    requiredPermissions: Partial<ApiKeyPermissions> = {}
  ): Promise<{ success: boolean; apiKey?: ApiKey; error?: string }> {
    const apiKeyValue = this.getApiKeyFromRequest(request);

    if (!apiKeyValue) {
      return {
        success: false,
        error: 'API key is required. Please provide it in the Authorization header (Bearer token), X-API-Key header, or api_key query parameter.'
      };
    }

    const apiKey = this.validateApiKey(apiKeyValue);

    if (!apiKey) {
      return {
        success: false,
        error: 'Invalid or expired API key.'
      };
    }

    // 権限チェック
    if (!this.checkPermissions(apiKey, requiredPermissions)) {
      return {
        success: false,
        error: 'Insufficient permissions for this operation.'
      };
    }

    return {
      success: true,
      apiKey
    };
  }

  static getAllApiKeys(): ApiKey[] {
    const settings = this.getSettings();
    return settings.apiKeys;
  }

  static addApiKey(newKey: Omit<ApiKey, 'id' | 'createdAt' | 'lastUsed'>): ApiKey {
    const settings = this.getSettings();
    const apiKey: ApiKey = {
      ...newKey,
      id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      lastUsed: undefined
    };
    
    settings.apiKeys.push(apiKey);
    this.settings = settings;
    
    return apiKey;
  }

  static updateApiKey(id: string, updates: Partial<ApiKey>): ApiKey | null {
    const settings = this.getSettings();
    const index = settings.apiKeys.findIndex(k => k.id === id);
    
    if (index === -1) return null;
    
    settings.apiKeys[index] = { ...settings.apiKeys[index], ...updates };
    this.settings = settings;
    
    return settings.apiKeys[index];
  }

  static deleteApiKey(id: string): boolean {
    const settings = this.getSettings();
    const index = settings.apiKeys.findIndex(k => k.id === id);
    
    if (index === -1) return false;
    
    settings.apiKeys.splice(index, 1);
    this.settings = settings;
    
    return true;
  }
}

export default EdgeApiAuth;
