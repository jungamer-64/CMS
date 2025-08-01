import { createPostHandler } from '@/app/lib/api-factory';
import { 
  createApiSuccess,
  createApiError, 
  ApiErrorCode 
} from '@/app/lib/api-types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByUsername, updateLastLogin } from '@/app/lib/users';
import type { LoginRequest, AuthResponse } from '@/app/lib/api-types';
import { JWT_SECRET } from '@/app/lib/env';

// ログインAPI（レート制限付き）
export const POST = createPostHandler<LoginRequest, AuthResponse>(
  async (request, body) => {
    try {
      const { username, password } = body;

      // ユーザーを検索
      const user = await getUserByUsername(username);
      console.log('ログイン試行 - ユーザー:', username);
      
      if (!user) {
        return createApiError(
          'ユーザー名またはパスワードが正しくありません', 
          ApiErrorCode.UNAUTHORIZED
        );
      }

      // パスワードを検証
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return createApiError(
          'ユーザー名またはパスワードが正しくありません', 
          ApiErrorCode.UNAUTHORIZED
        );
      }

      // 最終ログイン時刻を更新
      await updateLastLogin(user.id);

      // JWTトークンを生成
      const token = jwt.sign(
        { 
          userId: user.id,
          username: user.username,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userResponse: AuthResponse = {
        user: {
          _id: user._id,
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          darkMode: user.darkMode ?? false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      };

      console.log('ログイン成功 - ユーザー:', username);
      return createApiSuccess(userResponse, 'ログインに成功しました');

    } catch (error) {
      return createApiError(
        error instanceof Error ? error.message : 'ログインに失敗しました',
        ApiErrorCode.INTERNAL_ERROR
      );
    }
  },
  {
    requireAuth: false,
    rateLimit: { 
      maxRequests: 5, 
      windowMs: 60000, 
      message: 'ログイン試行回数が多すぎます' 
    }
  }
);
