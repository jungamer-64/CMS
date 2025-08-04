/**
 * ページリポジトリ
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 * 
 * ページデータのCRUD操作を提供します。
 */

import type { Collection } from 'mongodb';
import { getDatabase } from '../connections/mongodb';
import type { Page, ApiResponse } from '../../core/types';

export class PageRepository {
  private async getCollection(): Promise<Collection<Page>> {
    const db = await getDatabase();
    return db.collection<Page>('pages');
  }

  /**
   * ページIDで取得
   */
  async getPageById(id: string): Promise<ApiResponse<Page>> {
    try {
      const collection = await this.getCollection();
      const page = await collection.findOne({ _id: id } as { _id: string });
      
      if (!page) {
        return {
          success: false,
          error: 'Page not found'
        };
      }
      
      return {
        success: true,
        data: page
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * スラグでページを検索（互換性のため）
   */
  async findBySlug(slug: string): Promise<ApiResponse<Page>> {
    return this.getPageBySlug(slug);
  }

  /**
   * 全ページを取得（互換性のため）
   */
  async findAll(): Promise<ApiResponse<Page[]>> {
    return this.getPages();
  }

  /**
   * ページを作成（互換性のため）
   */
  async create(data: Page): Promise<ApiResponse<Page>> {
    return this.createPage(data);
  }

  /**
   * ページを更新（互換性のため）
   */
  async update(id: string, data: Partial<Page>): Promise<ApiResponse<Page>> {
    return this.updatePage(id, data);
  }

  /**
   * スラグでページを更新（互換性のため）
   */
  async updateBySlug(slug: string, data: Partial<Page>): Promise<ApiResponse<Page>> {
    // スラグからIDを取得してupdatePageを呼び出す
    const pageResult = await this.getPageBySlug(slug);
    if (!pageResult.success || !pageResult.data._id) {
      return pageResult as ApiResponse<Page>;
    }
    return this.updatePage(pageResult.data._id, data);
  }

  /**
   * ページを削除（互換性のため）
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.deletePage(id);
  }

  /**
   * スラグでページを削除（互換性のため）
   */
  async deleteBySlug(slug: string): Promise<ApiResponse<boolean>> {
    // スラグからIDを取得してdeletePageを呼び出す
    const pageResult = await this.getPageBySlug(slug);
    if (!pageResult.success || !pageResult.data._id) {
      return { success: false, error: 'Page not found' };
    }
    return this.deletePage(pageResult.data._id);
  }

  /**
   * ページネーション付きでページを取得（互換性のため）
   */
  async findWithPagination(
    page: number, 
    limit: number, 
    _filters?: Record<string, unknown>
  ): Promise<ApiResponse<{ pages: Page[]; total: number }>> {
    const pagesResult = await this.getPages();
    if (!pagesResult.success) {
      return { success: false, error: pagesResult.error };
    }
    
    // 簡易実装：ページング処理
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPages = pagesResult.data.slice(start, end);
    
    return {
      success: true,
      data: {
        pages: paginatedPages,
        total: pagesResult.data.length
      }
    };
  }

  /**
   * コレクションへの直接アクセス（互換性のため）
   */
  get collection() {
    return this.getCollection();
  }

  /**
   * ページスラッグで取得
   */
  async getPageBySlug(slug: string): Promise<ApiResponse<Page>> {
    try {
      const collection = await this.getCollection();
      const page = await collection.findOne({ slug });
      
      if (!page) {
        return {
          success: false,
          error: 'Page not found'
        };
      }
      
      return {
        success: true,
        data: page
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ページ一覧を取得
   */
  async getPages(options: {
    limit?: number;
    skip?: number;
    status?: 'published' | 'draft' | 'archived';
  } = {}): Promise<ApiResponse<Page[]>> {
    try {
      const collection = await this.getCollection();
      const { limit = 10, skip = 0, status } = options;
      
      const filter: Record<string, unknown> = {};
      if (status) {
        filter.status = status;
      }
      
      const pages = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      return {
        success: true,
        data: pages
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ページを作成
   */
  async createPage(pageData: Omit<Page, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Page>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      
      const newPage = {
        ...pageData,
        _id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      
      await collection.insertOne(newPage);
      
      return {
        success: true,
        data: newPage as Page
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ページを更新
   */
  async updatePage(id: string, updates: Partial<Page>): Promise<ApiResponse<Page>> {
    try {
      const collection = await this.getCollection();
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      const result = await collection.findOneAndUpdate(
        { _id: id } as { _id: string },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (!result) {
        return {
          success: false,
          error: 'Page not found'
        };
      }
      
      return {
        success: true,
        data: result as Page
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ページを削除
   */
  async deletePage(id: string): Promise<ApiResponse<boolean>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: id } as { _id: string });
      
      if (result.deletedCount === 0) {
        return {
          success: false,
          error: 'Page not found'
        };
      }
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
