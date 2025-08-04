import { 
  ValidationSchema,
  PostCreateRequest, 
  PostUpdateRequest,
  UserCreateRequest,
  UserUpdateRequest,
  CommentCreateRequest,
  CommentUpdateRequest,
  LoginRequest,
  RegisterRequest,
  PasswordChangeRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ApiKeyCreateRequest,
  ApiKeyUpdateRequest,
  SettingsUpdateRequest,
  ThemeUpdateRequest,
  AdminCommentUpdateRequest,
  AdminCommentDeleteRequest,
  AdminPostsListParams
} from './api-types';

// =============================================================================
// Posts API バリデーションスキーマ
// =============================================================================

export const postCreateSchema: ValidationSchema<PostCreateRequest> = {
  title: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200
  },
  content: {
    required: true,
    type: 'string',
    minLength: 1
  },
  author: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  slug: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  media: {
    type: 'array',
    items: { type: 'string' },
    required: false
  }
};

export const postUpdateSchema: ValidationSchema<PostUpdateRequest> = {
  title: {
    type: 'string',
    minLength: 1,
    maxLength: 200
  },
  content: {
    type: 'string',
    minLength: 1
  },
  author: {
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  slug: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  }
};

// =============================================================================
// Users API バリデーションスキーマ
// =============================================================================

export const userCreateSchema: ValidationSchema<UserCreateRequest> = {
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    required: true,
    type: 'email',
    maxLength: 254
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    custom: (value) => {
      if (typeof value !== 'string') return false;
      // パスワード強度チェック: 最低1つの大文字、小文字、数字
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      if (!hasUpper || !hasLower || !hasNumber) {
        return 'パスワードには大文字、小文字、数字をそれぞれ1つ以上含める必要があります';
      }
      return true;
    }
  },
  displayName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  role: {
    type: 'string',
    custom: (value) => {
      if (value !== undefined && value !== 'user' && value !== 'admin') {
        return 'roleはuserまたはadminである必要があります';
      }
      return true;
    }
  }
};

export const userUpdateSchema: ValidationSchema<UserUpdateRequest> = {
  displayName: {
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  email: {
    type: 'email',
    maxLength: 254
  },
  role: {
    type: 'string',
    custom: (value) => {
      if (value !== undefined && value !== 'user' && value !== 'admin') {
        return 'roleはuserまたはadminである必要があります';
      }
      return true;
    }
  },
  darkMode: {
    type: 'boolean'
  }
};

// =============================================================================
// Theme API バリデーションスキーマ
// =============================================================================

export const themeUpdateSchema: ValidationSchema<ThemeUpdateRequest> = {
  darkMode: {
    required: true,
    type: 'boolean'
  }
};

// =============================================================================
// Comments API バリデーションスキーマ
// =============================================================================

export const commentCreateSchema: ValidationSchema<CommentCreateRequest> = {
  postSlug: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  authorName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  authorEmail: {
    required: true,
    type: 'email',
    maxLength: 254
  },
  content: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 2000
  }
};

export const commentUpdateSchema: ValidationSchema<CommentUpdateRequest> = {
  authorName: {
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  authorEmail: {
    type: 'email',
    maxLength: 254
  },
  content: {
    type: 'string',
    minLength: 1,
    maxLength: 2000
  },
  isApproved: {
    type: 'boolean'
  }
};

// Admin Comments API バリデーションスキーマ
export const adminCommentUpdateSchema: ValidationSchema<AdminCommentUpdateRequest> = {
  commentId: {
    required: true,
    type: 'string',
    minLength: 1
  },
  isApproved: {
    required: true,
    type: 'boolean'
  }
};

export const adminCommentDeleteSchema: ValidationSchema<AdminCommentDeleteRequest> = {
  commentId: {
    required: true,
    type: 'string',
    minLength: 1
  }
};

// Admin Posts API バリデーションスキーマ
export const adminPostsListSchema: ValidationSchema<AdminPostsListParams> = {
  page: {
    type: 'number',
    min: 1
  },
  limit: {
    type: 'number',
    min: 1,
    max: 100
  },
  type: {
    type: 'string',
    custom: (value) => {
      if (typeof value !== 'string') return false;
      return ['all', 'published', 'deleted'].includes(value);
    }
  },
  search: {
    type: 'string',
    maxLength: 255
  },
  author: {
    type: 'string',
    maxLength: 100
  },
  sortBy: {
    type: 'string',
    custom: (value) => {
      if (typeof value !== 'string') return false;
      return ['createdAt', 'updatedAt', 'title'].includes(value);
    }
  },
  sortOrder: {
    type: 'string',
    custom: (value) => {
      if (typeof value !== 'string') return false;
      return ['asc', 'desc'].includes(value);
    }
  }
};

// =============================================================================
// Auth API バリデーションスキーマ
// =============================================================================

export const loginSchema: ValidationSchema<LoginRequest> = {
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 30
  },
  password: {
    required: true,
    type: 'string',
    minLength: 1
  }
};

export const registerSchema: ValidationSchema<RegisterRequest> = {
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    required: true,
    type: 'email',
    maxLength: 254
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    custom: (value) => {
      if (typeof value !== 'string') return false;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      if (!hasUpper || !hasLower || !hasNumber) {
        return 'パスワードには大文字、小文字、数字をそれぞれ1つ以上含める必要があります';
      }
      return true;
    }
  },
  displayName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  }
};

export const passwordChangeSchema: ValidationSchema<PasswordChangeRequest> = {
  currentPassword: {
    required: true,
    type: 'string',
    minLength: 1
  },
  newPassword: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    custom: (value) => {
      if (typeof value !== 'string') return false;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      if (!hasUpper || !hasLower || !hasNumber) {
        return 'パスワードには大文字、小文字、数字をそれぞれ1つ以上含める必要があります';
      }
      return true;
    }
  }
};

export const forgotPasswordSchema: ValidationSchema<ForgotPasswordRequest> = {
  email: {
    required: true,
    type: 'email',
    maxLength: 254
  }
};

export const resetPasswordSchema: ValidationSchema<ResetPasswordRequest> = {
  token: {
    required: true,
    type: 'string',
    minLength: 1
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    custom: (value) => {
      if (typeof value !== 'string') return false;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      if (!hasUpper || !hasLower || !hasNumber) {
        return 'パスワードには大文字、小文字、数字をそれぞれ1つ以上含める必要があります';
      }
      return true;
    }
  }
};

// =============================================================================
// API Keys バリデーションスキーマ
// =============================================================================

export const apiKeyCreateSchema: ValidationSchema<ApiKeyCreateRequest> = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  permissions: {
    required: true,
    custom: (value) => {
      if (typeof value !== 'object' || value === null) {
        return 'permissionsはオブジェクトである必要があります';
      }
      // 詳細な権限検証は別途実装
      return true;
    }
  },
  expiresAt: {
    custom: (value) => {
      if (value !== undefined) {
        try {
          const date = new Date(value as string);
          if (isNaN(date.getTime())) {
            return '有効な日付を入力してください';
          }
          if (date <= new Date()) {
            return '有効期限は現在時刻より後である必要があります';
          }
        } catch {
          return '有効な日付を入力してください';
        }
      }
      return true;
    }
  }
};

export const apiKeyUpdateSchema: ValidationSchema<ApiKeyUpdateRequest> = {
  name: {
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  permissions: {
    custom: (value) => {
      if (value !== undefined && (typeof value !== 'object' || value === null)) {
        return 'permissionsはオブジェクトである必要があります';
      }
      return true;
    }
  },
  isActive: {
    type: 'boolean'
  },
  expiresAt: {
    custom: (value) => {
      if (value !== undefined) {
        try {
          const date = new Date(value as string);
          if (isNaN(date.getTime())) {
            return '有効な日付を入力してください';
          }
        } catch {
          return '有効な日付を入力してください';
        }
      }
      return true;
    }
  }
};

// =============================================================================
// Settings API バリデーションスキーマ
// =============================================================================

export const settingsUpdateSchema: ValidationSchema<SettingsUpdateRequest> = {
  apiAccess: {
    type: 'boolean'
  },
  apiKey: {
    type: 'string',
    maxLength: 255
  },
  emailNotifications: {
    type: 'boolean'
  },
  maintenanceMode: {
    type: 'boolean'
  },
  maxPostsPerPage: {
    type: 'number',
    min: 1,
    max: 100
  },
  allowComments: {
    type: 'boolean'
  },
  requireApproval: {
    type: 'boolean'
  },
  userHomeUrl: {
    type: 'string',
    maxLength: 255,
    pattern: /^\/.*$/
  },
  adminHomeUrl: {
    type: 'string',
    maxLength: 255,
    pattern: /^\/.*$/
  }
};

// =============================================================================
// バリデーションヘルパー関数
// =============================================================================

export function validatePermissions(permissions: Record<string, unknown>): boolean {
  if (typeof permissions !== 'object' || permissions === null) {
    return false;
  }

  const requiredResources = ['posts', 'comments', 'users', 'settings', 'uploads'];
  
  for (const resource of requiredResources) {
    if (!permissions[resource] || typeof permissions[resource] !== 'object') {
      return false;
    }
    
    const actions = Object.keys(permissions[resource]);
    if (actions.length === 0) {
      return false;
    }
    
    for (const action of actions) {
      const resourcePerms = permissions[resource] as Record<string, unknown>;
      if (typeof resourcePerms[action] !== 'boolean') {
        return false;
      }
    }
  }
  
  return true;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(username);
}

export function isStrongPassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'パスワードは8文字以上である必要があります' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'パスワードは128文字以下である必要があります' };
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasUpper || !hasLower || !hasNumber) {
    return { 
      isValid: false, 
      message: 'パスワードには大文字、小文字、数字をそれぞれ1つ以上含める必要があります' 
    };
  }
  
  return { isValid: true };
}

// バリデーションスキーマのエクスポート
export const validationSchemas = {
  postCreate: postCreateSchema,
  postUpdate: postUpdateSchema,
  userCreate: userCreateSchema,
  userUpdate: userUpdateSchema,
  commentCreate: commentCreateSchema,
  commentUpdate: commentUpdateSchema,
  login: loginSchema,
  register: registerSchema,
  passwordChange: passwordChangeSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  apiKeyCreate: apiKeyCreateSchema,
  apiKeyUpdate: apiKeyUpdateSchema,
  settingsUpdate: settingsUpdateSchema,
  themeUpdate: themeUpdateSchema,
  adminCommentUpdate: adminCommentUpdateSchema,
  adminCommentDelete: adminCommentDeleteSchema
};
