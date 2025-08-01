// app/lib/admin-types.ts
export const MEDIA_MANAGEMENT_LABEL = "メディア管理";

// メディア関連の型定義
export interface MediaFile {
  _id: string;
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: string;
  tags?: string[];
  description?: string;
}

export interface MediaUploadResponse {
  success: boolean;
  file?: MediaFile;
  error?: string;
}

export interface MediaListResponse {
  files: MediaFile[];
  total: number;
  page: number;
  limit: number;
}

// 設定関連の型定義
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  postsPerPage: number;
  enableComments: boolean;
  enableRegistration: boolean;
}

// ユーザー関連の型定義
export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface UserFormData {
  username: string;
  email: string;
  displayName: string;
  password?: string;
  role: 'user' | 'admin';
}

// API レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
