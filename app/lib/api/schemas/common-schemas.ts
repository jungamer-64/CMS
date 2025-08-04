/**
 * 共通バリデーションスキーマ
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import type { ValidationSchema } from '../middleware/validation';

// ページネーションスキーマ
export const paginationSchema: ValidationSchema = {
  page: {
    type: 'string',
    custom: (value) => {
      const num = parseInt(value as string, 10);
      return !isNaN(num) && num > 0;
    },
  },
  limit: {
    type: 'string',
    custom: (value) => {
      const num = parseInt(value as string, 10);
      return !isNaN(num) && num > 0 && num <= 100;
    },
  },
};

// ソートスキーマ
export const sortSchema: ValidationSchema = {
  sortBy: {
    type: 'string',
    enum: ['createdAt', 'updatedAt', 'title', 'username', 'displayName'],
  },
  sortOrder: {
    type: 'string',
    enum: ['asc', 'desc'],
  },
};

// 検索スキーマ
export const searchSchema: ValidationSchema = {
  search: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
};

// ID検証スキーマ
export const idSchema: ValidationSchema = {
  id: {
    required: true,
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 1,
    maxLength: 50,
  },
};

// スラッグ検証スキーマ
export const slugSchema: ValidationSchema = {
  slug: {
    required: true,
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 1,
    maxLength: 100,
  },
};

// メディアタイプスキーマ
export const mediaTypeSchema: ValidationSchema = {
  mediaType: {
    type: 'string',
    enum: ['image', 'video', 'other'],
  },
};

// ユーザーロールスキーマ
export const userRoleSchema: ValidationSchema = {
  role: {
    type: 'string',
    enum: ['user', 'admin'],
  },
};

// 日付範囲スキーマ
export const dateRangeSchema: ValidationSchema = {
  startDate: {
    type: 'string',
    custom: (value) => {
      const date = new Date(value as string);
      return !isNaN(date.getTime());
    },
  },
  endDate: {
    type: 'string',
    custom: (value) => {
      const date = new Date(value as string);
      return !isNaN(date.getTime());
    },
  },
};

// 共通のクエリパラメータスキーマ
export const commonQuerySchema: ValidationSchema = {
  ...paginationSchema,
  ...sortSchema,
  ...searchSchema,
};
