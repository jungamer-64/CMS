/**
 * RESTful リソースサービス基底クラス
 * 
 * 統一されたCRUD操作インターフェース
 * - 型安全性
 * - 統一されたエラーハンドリング  
 * - パフォーマンス最適化
 */

import type { 
  PostEntity, 
  UserEntity,
  PostInput,
  UserInput,
} from '../../core/types/entity-types';
import { isApiSuccess } from '../../core/utils/type-guards';

// ============================================================================
// 基底型定義
// ============================================================================

/**
 * サービス操作結果型
 */
export interface ServiceResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

/**
 * ページネーションメタデータ
 */
export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages?: number;
}

/**
 * リスト操作結果型
 */
export interface ServiceListResult<T> {
  readonly success: boolean;
  readonly data?: {
    readonly data: T[];
    readonly pagination: PaginationMeta;
  };
  readonly error?: string;
}

/**
 * フィルター・ソート条件
 */
export interface QueryFilters {
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly page?: number;
  readonly limit?: number;
  readonly [key: string]: unknown;
}

// ============================================================================
// 抽象基底サービスクラス
// ============================================================================

/**
 * RESTfulリソースサービス抽象基底クラス
 */
export abstract class RestResourceService<TEntity, TCreateInput, TUpdateInput> {
  
  /**
   * リソース一覧取得
   */
  abstract getAll(filters?: QueryFilters): Promise<ServiceListResult<TEntity>>;
  
  /**
   * ID によるリソース取得
   */
  abstract getById(id: string): Promise<ServiceResult<TEntity>>;
  
  /**
   * リソース作成
   */
  abstract create(input: TCreateInput): Promise<ServiceResult<TEntity>>;
  
  /**
   * リソース更新
   */
  abstract update(id: string, input: TUpdateInput): Promise<ServiceResult<TEntity>>;
  
  /**
   * リソース削除
   */
  abstract delete(id: string): Promise<ServiceResult<boolean>>;
  
  /**
   * エンティティの存在確認
   */
  abstract exists(id: string): Promise<boolean>;

  // ============================================================================
  // 共通ユーティリティメソッド
  // ============================================================================

  /**
   * 成功結果の作成
   */
  protected createSuccess<T>(data: T): ServiceResult<T> {
    return { success: true, data };
  }

  /**
   * エラー結果の作成
   */
  protected createError(error: string): ServiceResult<never> {
    return { success: false, error };
  }

  /**
   * リスト成功結果の作成
   */
  protected createListSuccess<T>(
    data: T[], 
    pagination: PaginationMeta
  ): ServiceListResult<T> {
    return { 
      success: true, 
      data: { data, pagination }
    };
  }

  /**
   * リストエラー結果の作成
   */
  protected createListError(error: string): ServiceListResult<never> {
    return { success: false, error };
  }

  /**
   * Repository 結果の ServiceResult への変換
   */
  protected transformRepositoryResult<T>(
    result: { success: boolean; data?: T; error?: string }
  ): ServiceResult<T> {
    if (result.success && result.data !== undefined) {
      return this.createSuccess(result.data);
    }
    return this.createError(result.error || 'Operation failed');
  }

  /**
   * Repository リスト結果の ServiceListResult への変換
   */
  protected transformRepositoryListResult<T>(
    result: { 
      success: boolean; 
      data?: { data: T[]; pagination: PaginationMeta }; 
      error?: string;
    }
  ): ServiceListResult<T> {
    if (result.success && result.data) {
      return this.createListSuccess(result.data.data, result.data.pagination);
    }
    return this.createListError(result.error || 'List operation failed');
  }

  /**
   * ページネーション計算
   */
  protected calculatePagination(
    total: number,
    page: number = 1,
    limit: number = 10
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      page: Math.max(1, page),
      limit: Math.max(1, Math.min(100, limit)), // 最大100件まで
      total,
      totalPages,
    };
  }

  /**
   * フィルター・ソート条件の正規化
   */
  protected normalizeFilters(filters?: QueryFilters): Required<Pick<QueryFilters, 'page' | 'limit'>> & QueryFilters {
    return {
      page: Math.max(1, filters?.page || 1),
      limit: Math.max(1, Math.min(100, filters?.limit || 10)),
      ...filters,
    };
  }
}

// ============================================================================
// 具象実装: PostService
// ============================================================================

/**
 * 投稿リソースサービス実装
 */
export class PostService extends RestResourceService<PostEntity, PostInput, Partial<PostInput>> {
  
  async getAll(filters?: QueryFilters): Promise<ServiceListResult<PostEntity>> {
    try {
      const { postRepository } = await import('../../data/repositories/post-repository');
      const normalizedFilters = this.normalizeFilters(filters);
      
      const result = await postRepository.findAll({
        search: normalizedFilters.search,
        page: normalizedFilters.page,
        limit: normalizedFilters.limit,
        sortBy: normalizedFilters.sortBy || 'createdAt',
        sortOrder: normalizedFilters.sortOrder || 'desc',
      });

      return this.transformRepositoryListResult(result);
    } catch (error) {
      console.error('PostService.getAll error:', error);
      return this.createListError('Failed to retrieve posts');
    }
  }

  async getById(id: string): Promise<ServiceResult<PostEntity>> {
    try {
      const { postRepository } = await import('../../data/repositories/post-repository');
      const result = await postRepository.findById(id);
      return this.transformRepositoryResult(result);
    } catch (error) {
      console.error('PostService.getById error:', error);
      return this.createError('Failed to retrieve post');
    }
  }

  async create(input: PostInput): Promise<ServiceResult<PostEntity>> {
    try {
      const { postRepository } = await import('../../data/repositories/post-repository');
      const result = await postRepository.create(input);
      return this.transformRepositoryResult(result);
    } catch (error) {
      console.error('PostService.create error:', error);
      return this.createError('Failed to create post');
    }
  }

  async update(id: string, input: Partial<PostInput>): Promise<ServiceResult<PostEntity>> {
    try {
      const { postRepository } = await import('../../data/repositories/post-repository');
      const result = await postRepository.update(id, input);
      return this.transformRepositoryResult(result);
    } catch (error) {
      console.error('PostService.update error:', error);
      return this.createError('Failed to update post');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const { postRepository } = await import('../../data/repositories/post-repository');
      const result = await postRepository.delete(id);
      
      if (isApiSuccess(result)) {
        return this.createSuccess(true);
      }
      return this.createError(result.error || 'Failed to delete post');
    } catch (error) {
      console.error('PostService.delete error:', error);
      return this.createError('Failed to delete post');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.getById(id);
      return result.success && !!result.data;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// 具象実装: UserService
// ============================================================================

/**
 * ユーザーリソースサービス実装
 */
export class UserService extends RestResourceService<UserEntity, UserInput, Partial<UserInput>> {
  
  async getAll(filters?: QueryFilters): Promise<ServiceListResult<UserEntity>> {
    try {
      const { UserRepository } = await import('../../data/repositories/user-repository');
      const userRepo = new UserRepository();
      const normalizedFilters = this.normalizeFilters(filters);
      
      const result = await userRepo.findAll({
        search: normalizedFilters.search,
        page: normalizedFilters.page,
        limit: normalizedFilters.limit,
        role: normalizedFilters.role as 'admin' | 'user' | undefined,
        sortBy: normalizedFilters.sortBy || 'createdAt',
        sortOrder: normalizedFilters.sortOrder || 'desc',
      });

      return this.transformRepositoryListResult(result);
    } catch (error) {
      console.error('UserService.getAll error:', error);
      return this.createListError('Failed to retrieve users');
    }
  }

  async getById(id: string): Promise<ServiceResult<UserEntity>> {
    try {
      const { UserRepository } = await import('../../data/repositories/user-repository');
      const userRepo = new UserRepository();
      const result = await userRepo.findById(id);
      return this.transformRepositoryResult(result);
    } catch (error) {
      console.error('UserService.getById error:', error);
      return this.createError('Failed to retrieve user');
    }
  }

  async create(input: UserInput): Promise<ServiceResult<UserEntity>> {
    try {
      const { UserRepository } = await import('../../data/repositories/user-repository');
      const userRepo = new UserRepository();
      const result = await userRepo.create(input);
      return this.transformRepositoryResult(result);
    } catch (error) {
      console.error('UserService.create error:', error);
      return this.createError('Failed to create user');
    }
  }

  async update(id: string, input: Partial<UserInput>): Promise<ServiceResult<UserEntity>> {
    try {
      const { UserRepository } = await import('../../data/repositories/user-repository');
      const userRepo = new UserRepository();
      const result = await userRepo.update(id, input);
      return this.transformRepositoryResult(result);
    } catch (error) {
      console.error('UserService.update error:', error);
      return this.createError('Failed to update user');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const { UserRepository } = await import('../../data/repositories/user-repository');
      const userRepo = new UserRepository();
      const result = await userRepo.delete(id);
      
      if (isApiSuccess(result)) {
        return this.createSuccess(true);
      }
      return this.createError(result.error || 'Failed to delete user');
    } catch (error) {
      console.error('UserService.delete error:', error);
      return this.createError('Failed to delete user');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.getById(id);
      return result.success && !!result.data;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// サービスインスタンス（シングルトン）
// ============================================================================

export const postService = new PostService();
export const userService = new UserService();
