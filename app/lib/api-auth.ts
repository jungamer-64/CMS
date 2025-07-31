import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ApiKey, ApiKeyPermissions } from './api-keys';

interface Settings {
  darkMode: boolean;
  apiAccess: boolean;
  apiKey: string;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  maxPostsPerPage: number;
  allowComments: boolean;
  requireApproval: boolean;
}

// デフォルト設定
const defaultSettings: Settings = {
  darkMode: false,
  apiAccess: true,
  apiKey: '',
  emailNotifications: true,
  maintenanceMode: false,
  maxPostsPerPage: 10,
  allowComments: true,
  requireApproval: false,
};

// 設定ファイルのパス
const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
const apiKeysPath = path.join(process.cwd(), 'data', 'api-keys.json');

// 設定を読み込む
function loadSettings(): Settings {
  try {
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      return { ...defaultSettings, ...settings };
    }
  } catch (error) {
    console.error('設定読み込みエラー:', error);
  }
  return defaultSettings;
}

// APIキーを読み込む
function loadApiKeys(): ApiKey[] {
  try {
    if (fs.existsSync(apiKeysPath)) {
      const data = fs.readFileSync(apiKeysPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('APIキー読み込みエラー:', error);
  }
  return [];
}

// APIキーの最終使用日時を更新
function updateApiKeyLastUsed(keyId: string): void {
  try {
    const apiKeys = loadApiKeys();
    const keyIndex = apiKeys.findIndex(key => key.id === keyId);
    if (keyIndex !== -1) {
      apiKeys[keyIndex].lastUsed = new Date();
      const dir = path.dirname(apiKeysPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(apiKeysPath, JSON.stringify(apiKeys, null, 2));
    }
  } catch (error) {
    console.error('APIキー最終使用日時更新エラー:', error);
  }
}

// APIキー認証と権限チェック
export function validateApiKey(
  request: NextRequest, 
  requiredPermission?: { 
    resource: 'posts' | 'comments' | 'settings', 
    action: 'create' | 'read' | 'update' | 'delete' | 'moderate' 
  }
): { valid: boolean; error?: string; apiKey?: ApiKey } {
  const settings = loadSettings();
  
  // APIアクセスが無効の場合
  if (!settings.apiAccess) {
    return { valid: false, error: 'API access is disabled' };
  }
  
  // リクエストからAPIキーを取得
  const providedKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!providedKey) {
    return { valid: false, error: 'API key is required. Use X-API-Key header or Authorization: Bearer <key>' };
  }

  // 新しいAPIキーシステムをチェック
  const apiKeys = loadApiKeys();
  const foundApiKey = apiKeys.find(key => key.key === providedKey && key.isActive);
  
  if (foundApiKey) {
    // 権限チェック
    if (requiredPermission) {
      const hasPermission = checkPermission(foundApiKey.permissions, requiredPermission);
      if (!hasPermission) {
        return { 
          valid: false, 
          error: `Insufficient permissions. Required: ${requiredPermission.resource}:${requiredPermission.action}` 
        };
      }
    }

    // 最終使用日時を更新（非同期で実行）
    setTimeout(() => updateApiKeyLastUsed(foundApiKey.id), 0);
    
    return { valid: true, apiKey: foundApiKey };
  }

  // レガシーAPIキー（設定ファイル）をチェック
  if (settings.apiKey && providedKey === settings.apiKey) {
    return { valid: true };
  }
  
  return { valid: false, error: 'Invalid API key' };
}

// 権限チェック関数
function checkPermission(
  permissions: ApiKeyPermissions,
  required: { resource: 'posts' | 'comments' | 'settings', action: string }
): boolean {
  const { resource, action } = required;
  
  switch (resource) {
    case 'posts':
      return permissions.posts[action as keyof typeof permissions.posts] || false;
    case 'comments':
      return permissions.comments[action as keyof typeof permissions.comments] || false;
    case 'settings':
      return permissions.settings[action as keyof typeof permissions.settings] || false;
    default:
      return false;
  }
}

// レート制限（簡易版）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): { allowed: boolean; error?: string } {
  const now = Date.now();
  const key = ip;
  
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    // 新しいウィンドウまたは期限切れ
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (current.count >= limit) {
    return { allowed: false, error: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds` };
  }
  
  current.count++;
  return { allowed: true };
}
