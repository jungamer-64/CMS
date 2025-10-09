/**
 * 設定リポジトリ
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import type { Collection } from 'mongodb';
import { getDatabase } from '../connections/mongodb';
import type { Settings, ApiResponse } from '../../core/types';

export class SettingsRepository {
  private async getCollection(): Promise<Collection<Settings>> {
    const db = await getDatabase();
    return db.collection<Settings>('settings');
  }

  /**
   * 設定を取得
   */
  async getSettings(): Promise<ApiResponse<Settings>> {
    try {
      const collection = await this.getCollection();
      const settings = await collection.findOne({});
      
      if (!settings) {
        // デフォルト設定を返す
        const defaultSettings: Settings = {
          siteName: 'My Site',
          siteDescription: 'Welcome to my site',
          adminEmail: 'admin@example.com',
          maxFileSize: 5242880, // 5MB
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
          postsPerPage: 10,
          enableComments: true,
          enableRegistration: false
        };
        
        return {
          success: true,
          data: defaultSettings
        };
      }
      
      return {
        success: true,
        data: settings
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * 設定を更新
   */
  async updateSettings(data: Partial<Settings>): Promise<ApiResponse<Settings>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      
      const updateData = {
        ...data,
        updatedAt: now
      };
      
      const result = await collection.findOneAndUpdate(
        {},
        { $set: updateData },
        { 
          returnDocument: 'after',
          upsert: true
        }
      );
      
      if (!result) {
        return {
          success: false,
          error: 'Failed to update settings'
        };
      }
      
      return {
        success: true,
        data: result
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
}
