/**
 * 投稿関連バリデーションスキーマ
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import type { ValidationSchema } from '../middleware/validation';
import { slugSchema } from './common-schemas';

// 投稿作成スキーマ
export const createPostSchema: ValidationSchema = {
  title: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200,
  },
  content: {
    required: true,
    type: 'string',
    minLength: 1,
  },
  slug: {
    required: true,
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 1,
    maxLength: 100,
  },
  author: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
  },
  media: {
    type: 'array',
    custom: (value) => {
      const arr = value as unknown[];
      return arr.every(item => typeof item === 'string');
    },
  },
};

// 投稿更新スキーマ
export const updatePostSchema: ValidationSchema = {
  title: {
    type: 'string',
    minLength: 1,
    maxLength: 200,
  },
  content: {
    type: 'string',
    minLength: 1,
  },
  slug: {
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 1,
    maxLength: 100,
  },
  media: {
    type: 'array',
    custom: (value) => {
      const arr = value as unknown[];
      return arr.every(item => typeof item === 'string');
    },
  },
};

// 投稿取得クエリスキーマ
export const postQuerySchema: ValidationSchema = {
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
      return !isNaN(num) && num > 0 && num <= 50;
    },
  },
  sortBy: {
    type: 'string',
    enum: ['createdAt', 'updatedAt', 'title'],
  },
  sortOrder: {
    type: 'string',
    enum: ['asc', 'desc'],
  },
  type: {
    type: 'string',
    enum: ['all', 'published', 'deleted'],
  },
  search: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
  author: {
    type: 'string',
    minLength: 1,
    maxLength: 50,
  },
};

// 投稿スラッグパラメータスキーマ
export const postSlugSchema = slugSchema;
