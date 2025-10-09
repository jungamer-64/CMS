/**
 * 統一されたリポジトリパターン
 * LIB_COMMONIZATION_PLAN.md フェーズ5対応
 */

import type { Sort } from 'mongodb';
import type { ApiResponse, PaginationMeta } from '../../core/types';

export interface BaseEntity {
  readonly _id?: string;
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

export interface RepositoryFilters {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly search?: string;
}

export interface RepositoryResult<T> {
  readonly data: T[];
  readonly pagination: PaginationMeta;
}

export abstract class BaseRepository<
  TEntity extends BaseEntity,
  TCreateInput,
  TUpdateInput,
  TFilters extends RepositoryFilters = RepositoryFilters
> {
  abstract findAll(filters?: TFilters): Promise<ApiResponse<RepositoryResult<TEntity>>>;
  abstract findById(id: string): Promise<ApiResponse<TEntity>>;
  abstract create(data: TCreateInput): Promise<ApiResponse<TEntity>>;
  abstract update(id: string, data: TUpdateInput): Promise<ApiResponse<TEntity>>;
  abstract delete(id: string): Promise<ApiResponse<boolean>>;

  // 共通メソッド
  protected buildPagination(
    total: number,
    page: number = 1,
    limit: number = 10
  ): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  protected buildSortQuery(sortBy?: string, sortOrder?: 'asc' | 'desc'): Sort {
    if (!sortBy) return {};
    return { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  }

  protected formatDateFilter(dateValue?: string | Date): Date | undefined {
    if (!dateValue) return undefined;
    return dateValue instanceof Date ? dateValue : new Date(dateValue);
  }

  protected buildSearchRegex(search?: string): RegExp | undefined {
    if (!search || search.trim().length === 0) return undefined;

    // セキュリティ: 検索文字列の長さを制限してReDoSを防止
    const MAX_SEARCH_LENGTH = 100;
    const sanitizedSearch = search.trim().slice(0, MAX_SEARCH_LENGTH);

    // すべての特殊文字をエスケープ
    const escapedSearch = sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    try {
      return new RegExp(escapedSearch, 'i');
    } catch (err: unknown) {
      console.error('Invalid regex pattern:', err instanceof Error ? err : String(err));
      return undefined;
    }
  }

  /**
   * エラーレスポンスを作成
   */
  protected createErrorResponse<T>(
    error: unknown,
    defaultMessage: string = 'An error occurred'
  ): ApiResponse<T> {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    console.error(`Repository Error: ${errorMessage}`, error);

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * 成功レスポンスを作成
   */
  protected createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * ObjectIdのバリデーション
   */
  protected isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}
