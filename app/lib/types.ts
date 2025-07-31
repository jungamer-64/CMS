// Re-export modern API types for backward compatibility
export * from './api-types';

// Legacy types (deprecated - use api-types.ts instead)
export interface Post {
  _id?: string;
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export interface PostInput {
  title: string;
  content: string;
  author: string;
  slug?: string; // オプション（自動生成可能）
}

export interface User {
  _id?: string;
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'user' | 'admin';
  darkMode?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// API Response Types for Admin
export interface AdminPostsResponse {
  success: boolean;
  data: Post[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AdminUsersResponse {
  success: boolean;
  data: User[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AdminStatsResponse {
  success: boolean;
  data: {
    totalPosts: number;
    publishedPosts: number;
    deletedPosts: number;
    totalUsers: number;
    totalComments: number;
  };
}

// Pagination and Filter Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PostFilters {
  type: 'all' | 'published' | 'deleted';
  search?: string;
  author?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilters {
  role?: 'user' | 'admin';
  search?: string;
  sortBy?: 'createdAt' | 'username' | 'displayName';
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

// Account Management Types
export interface UserUpdateInput {
  displayName?: string;
  email?: string;
  role?: 'user' | 'admin';
  darkMode?: boolean;
}

export interface UserCreationInput extends UserInput {
  role?: 'user' | 'admin';
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

export interface AdminUserManagement {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  darkMode?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserSessionInfo {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  darkMode?: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

// API Error Types (deprecated - use api-types.ts)
export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = {
  success: true;
  data: T;
} | ApiError;

export interface Comment {
  _id?: string;
  id: string;
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export interface CommentInput {
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
}

export interface PasswordResetToken {
  _id?: string;
  id: string;
  userId: string;
  token: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

// API Key Types
export interface ApiKey {
  _id?: string;
  id: string;
  userId: string; // アカウントID
  name: string;
  key: string;
  permissions: ApiKeyPermissions;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  expiresAt?: Date;
}

export interface ApiKeyPermissions {
  posts: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  comments: {
    read: boolean;
    moderate: boolean;
    delete: boolean;
  };
  users: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  settings: {
    read: boolean;
    update: boolean;
  };
  uploads: {
    create: boolean;
    read: boolean;
    delete: boolean;
  };
}

export interface ApiKeyInput {
  name: string;
  permissions: ApiKeyPermissions;
  expiresAt?: Date;
}

export interface ApiKeyResponse {
  success: boolean;
  data: {
    apiKey: ApiKey;
  };
}

export interface ApiKeysResponse {
  success: boolean;
  data: {
    apiKeys: ApiKey[];
  };
}
