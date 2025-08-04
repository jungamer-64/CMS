import { NextRequest } from 'next/server';
import { createGetHandler, createPutHandler } from '@/app/lib/api-factory';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { User } from '@/app/lib/core/types';
import { connectToDatabase } from '@/app/lib/database/connection';
import { createSettingsModel } from '@/app/lib/database/models/settings';

// ============================================================================
// 管理者専用設定API - データベース統合版
// ============================================================================

interface SettingsData {
  siteName: string;
  siteDescription: string;
  theme: 'light' | 'dark' | 'auto';
  maintenanceMode: boolean;
  allowRegistration: boolean;
  apiAccess: boolean;
  apiKey: string;
  emailNotifications: boolean;
  maxPostsPerPage: number;
  allowComments: boolean;
  requireApproval: boolean;
  [key: string]: unknown;
}

// ============================================================================
// GET /api/settings - 設定取得（データベース版）
// ============================================================================

export const GET = createGetHandler<{ settings: SettingsData }>(
  async (request: NextRequest, user: User) => {
    try {
      // データベース接続
      await connectToDatabase();
      const settingsModel = await createSettingsModel();

      // 設定を取得
      let settingsDoc = await settingsModel.getSystemSettings();
      
      // 設定が存在しない場合はデフォルトを作成
      if (!settingsDoc) {
        console.log('📝 デフォルト設定を作成中...');
        settingsDoc = await settingsModel.initializeDefaults(user.id);
      }

      // レスポンス用の設定データを構築
      const settingsToReturn: SettingsData = {
        siteName: settingsDoc.siteName,
        siteDescription: settingsDoc.siteDescription,
        theme: settingsDoc.theme,
        maintenanceMode: settingsDoc.maintenanceMode,
        allowRegistration: settingsDoc.allowRegistration,
        apiAccess: settingsDoc.apiAccess,
        apiKey: settingsDoc.apiKey,
        emailNotifications: settingsDoc.emailNotifications,
        maxPostsPerPage: settingsDoc.maxPostsPerPage,
        allowComments: settingsDoc.allowComments,
        requireApproval: settingsDoc.requireApproval
      };

      // 管理者以外には機密情報を隠す
      if (user.role !== 'admin') {
        settingsToReturn.apiKey = '[HIDDEN]';
      }
      
      return createSuccessResponse({ settings: settingsToReturn });
    } catch (error) {
      console.error('設定取得エラー:', error);
      return createErrorResponse('設定の取得に失敗しました');
    }
  }
);

// ============================================================================
// PUT /api/settings - 設定更新（管理者のみ・データベース版）
// ============================================================================

export const PUT = createPutHandler<Partial<SettingsData>, { settings: SettingsData }>(
  async (request: NextRequest, body: Partial<SettingsData>, user: User) => {
    // 管理者権限チェック
    if (user.role !== 'admin') {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      // データベース接続
      await connectToDatabase();
      const settingsModel = await createSettingsModel();

      // 設定を更新
      const updatedSettings = await settingsModel.updateSystemSettings(body, user.id);

      // レスポンス用データを構築
      const responseData: SettingsData = {
        siteName: updatedSettings.siteName,
        siteDescription: updatedSettings.siteDescription,
        theme: updatedSettings.theme,
        maintenanceMode: updatedSettings.maintenanceMode,
        allowRegistration: updatedSettings.allowRegistration,
        apiAccess: updatedSettings.apiAccess,
        apiKey: updatedSettings.apiKey,
        emailNotifications: updatedSettings.emailNotifications,
        maxPostsPerPage: updatedSettings.maxPostsPerPage,
        allowComments: updatedSettings.allowComments,
        requireApproval: updatedSettings.requireApproval
      };
      
      return createSuccessResponse({ settings: responseData });
    } catch (error) {
      console.error('設定更新エラー:', error);
      return createErrorResponse('設定の更新に失敗しました');
    }
  }
);
