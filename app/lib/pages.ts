/**
 * ページ操作のための関数ラッパー
 * PageRepositoryクラスを使用したシンプルな関数インターフェースを提供
 */

import { PageRepository } from './data/repositories/page-repository';
import type { Page, ApiResponse } from './core/types';

// シングルトンインスタンス
const pageRepository = new PageRepository();

/**
 * ページIDで取得
 */
export async function getPageById(id: string): Promise<ApiResponse<Page>> {
  return pageRepository.getPageById(id);
}

/**
 * スラッグでページを取得
 */
export async function getPageBySlug(slug: string): Promise<ApiResponse<Page>> {
  return pageRepository.getPageBySlug(slug);
}

/**
 * 全ページを取得
 */
export async function getAllPages(): Promise<ApiResponse<Page[]>> {
  // getPages メソッドは options を期待するので、空のオプションを渡す
  return pageRepository.getPages({});
}

/**
 * ページを作成
 */
export async function createPage(pageData: Omit<Page, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Page>> {
  return pageRepository.createPage(pageData);
}

/**
 * ページを更新
 */
export async function updatePage(id: string, updates: Partial<Page>): Promise<ApiResponse<Page>> {
  return pageRepository.updatePage(id, updates);
}

/**
 * スラッグでページを更新
 */
export async function updatePageBySlug(slug: string, updates: Partial<Page>): Promise<ApiResponse<Page>> {
  return pageRepository.updateBySlug(slug, updates);
}

/**
 * ページを削除
 */
export async function deletePage(id: string): Promise<ApiResponse<boolean>> {
  return pageRepository.deletePage(id);
}

/**
 * スラッグでページを削除
 */
export async function deletePageBySlug(slug: string): Promise<ApiResponse<boolean>> {
  return pageRepository.deleteBySlug(slug);
}
