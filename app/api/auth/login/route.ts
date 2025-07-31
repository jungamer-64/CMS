import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByUsername, updateLastLogin } from '@/app/lib/users';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateData,
  withRateLimit,
  handleApiError
} from '@/app/lib/api-utils';
import { loginSchema } from '@/app/lib/validation-schemas';
import { LoginRequest, AuthResponse, ApiErrorCode } from '@/app/lib/api-types';

// レート制限付きのログインエンドポイント
export const POST = withRateLimit(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body: LoginRequest = await request.json();

      // バリデーション
      const validation = validateData(body as unknown as Record<string, unknown>, loginSchema);
      if (!validation.isValid) {
        return createErrorResponse(
          validation.errors.map(e => e.message).join(', '),
          400,
          ApiErrorCode.VALIDATION_ERROR
        );
      }

      const { username, password } = body;

      // ユーザーを検索
      const user = await getUserByUsername(username);
      console.log('ログイン試行 - ユーザー:', username);
      
      if (!user) {
        return createErrorResponse(
          'ユーザー名またはパスワードが正しくありません', 
          401,
          ApiErrorCode.UNAUTHORIZED
        );
      }

      // パスワードを検証
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return createErrorResponse(
          'ユーザー名またはパスワードが正しくありません', 
          401,
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
        process.env.JWT_SECRET || 'fallback-secret',
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

      // レスポンスにトークンをCookieとして設定
      const response = createSuccessResponse(userResponse, 'ログインに成功しました');

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7日間
      });

      console.log('ログイン成功 - ユーザー:', username);
      return response;

    } catch (error) {
      return handleApiError(error);
    }
  },
  { maxRequests: 5, windowMs: 60000, message: 'ログイン試行回数が多すぎます' }
);
