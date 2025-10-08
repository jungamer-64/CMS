/**
 * ユーザー関連バリデーションスキーマ
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import type { ValidationSchema } from '../middleware/validation';
import { idSchema } from './common-schemas';

// ユーザー作成スキーマ
export const createUserSchema: ValidationSchema = {
  username: {
    required: true,
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 3,
    maxLength: 30,
  },
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 100,
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 100,
    custom: (value) => {
      const password = value as string;
      // 最低1つの数字と1つの文字を含む
      return /(?=.*[a-zA-Z])(?=.*\d)/.test(password);
    },
  },
  displayName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
  },
  role: {
    type: 'string',
    enum: ['user', 'admin'],
  },
};

// ユーザー更新スキーマ
export const updateUserSchema: ValidationSchema = {
  email: {
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 100,
  },
  displayName: {
    type: 'string',
    minLength: 1,
    maxLength: 50,
  },
  role: {
    type: 'string',
    enum: ['user', 'admin'],
  },
  darkMode: {
    type: 'boolean',
  },
};

// パスワード変更スキーマ
export const changePasswordSchema: ValidationSchema = {
  currentPassword: {
    required: true,
    type: 'string',
    minLength: 1,
  },
  newPassword: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 100,
    custom: (value) => {
      const password = value as string;
      return /(?=.*[a-zA-Z])(?=.*\d)/.test(password);
    },
  },
};

// ユーザーログインスキーマ
export const loginSchema: ValidationSchema = {
  username: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 30,
  },
  password: {
    required: true,
    type: 'string',
    minLength: 1,
  },
};

// ユーザークエリスキーマ
export const userQuerySchema: ValidationSchema = {
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
  sortBy: {
    type: 'string',
    enum: ['createdAt', 'username', 'displayName'],
  },
  sortOrder: {
    type: 'string',
    enum: ['asc', 'desc'],
  },
  role: {
    type: 'string',
    enum: ['user', 'admin'],
  },
  search: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
};

// ユーザーIDパラメータスキーマ
export const userIdSchema = idSchema;
