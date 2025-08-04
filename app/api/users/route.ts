import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/app/lib/database/connection';
import { createUserModel } from '@/app/lib/database/models/user';
import { 
  createGetHandler, 
  createPostHandler, 
  createPutHandler,
  createSuccessResponse, 
  createErrorResponse 
} from '@/app/lib/api-factory';
import { User } from '@/app/lib/auth-middleware';

// ============================================================================
// 型定義
// ============================================================================

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'user';
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  displayName?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
  darkMode?: boolean;
}

interface UserResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  darkMode: boolean;
  createdAt: string;
  lastLogin?: string;
}

// ============================================================================
// GET /api/users - ユーザー一覧取得（データベース版）
// ============================================================================

export const GET = createGetHandler<UserResponse[]>(
  async (request: NextRequest, user: User) => {
    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page')) || 1;
      const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100);
      const search = url.searchParams.get('search') || undefined;
      const role = url.searchParams.get('role') as 'admin' | 'user' | undefined;

      // データベース接続
      await connectToDatabase();
      const userModel = await createUserModel();

      // 権限チェック（管理者以外は自分の情報のみ）
      if (user.role !== 'admin') {
        const userData = await userModel.findById(user.id);
        if (!userData) {
          return createErrorResponse('ユーザーが見つかりません', 404);
        }

        const response: UserResponse = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          isActive: userData.isActive,
          darkMode: userData.darkMode || false,
          createdAt: userData.createdAt.toISOString(),
          lastLogin: userData.lastLogin?.toISOString()
        };

        return createSuccessResponse([response]);
      }

      // 管理者は全ユーザー取得
      const users = await userModel.findAll({ search, role, page, limit });

      // レスポンス形式に変換
      const response: UserResponse[] = users.map(userData => ({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        isActive: userData.isActive,
        darkMode: userData.darkMode || false,
        createdAt: userData.createdAt instanceof Date ? userData.createdAt.toISOString() : userData.createdAt,
        lastLogin: userData.lastLogin instanceof Date ? userData.lastLogin.toISOString() : userData.lastLogin
      }));

      return createSuccessResponse(response);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      return createErrorResponse('ユーザーの取得に失敗しました');
    }
  }
);

// ============================================================================
// POST /api/users - ユーザー作成（データベース版）
// ============================================================================

export const POST = createPostHandler<CreateUserRequest, UserResponse>(
  async (request: NextRequest, body: CreateUserRequest, user: User) => {
    // 管理者のみユーザー作成可能
    if (user.role !== 'admin') {
      return createErrorResponse('管理者権限が必要です', 403);
    }

    // バリデーション
    if (!body.username || !body.email || !body.password) {
      return createErrorResponse('ユーザー名、メール、パスワードが必要です');
    }

    try {
      // データベース接続
      await connectToDatabase();
      const userModel = await createUserModel();

      // 重複チェック
      const existingUser = await userModel.findByUsernameOrEmail(body.username, body.email);
      if (existingUser) {
        return createErrorResponse('ユーザー名またはメールアドレスが既に使用されています');
      }

      // パスワードハッシュ化は UserModel 内で実行される
      const newUser = await userModel.create({
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        username: body.username,
        email: body.email,
        password: body.password, // UserModel でハッシュ化される
        passwordHash: '', // 一時的な値（UserModel内で上書きされる）
        displayName: body.displayName || body.username,
        role: body.role || 'user',
        isActive: true,
        darkMode: false
      });

      // レスポンス形式に変換
      const response: UserResponse = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        isActive: newUser.isActive,
        darkMode: newUser.darkMode || false,
        createdAt: newUser.createdAt.toISOString(),
        lastLogin: newUser.lastLogin?.toISOString()
      };

      return createSuccessResponse(response);
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      return createErrorResponse('ユーザーの作成に失敗しました');
    }
  }
);

// ============================================================================
// PUT /api/users - ユーザー更新（データベース版）
// ============================================================================

export const PUT = createPutHandler<UpdateUserRequest & { id: string }, UserResponse>(
  async (request: NextRequest, body: UpdateUserRequest & { id: string }, user: User) => {
    // 自分のユーザー情報または管理者のみ更新可能
    if (user.id !== body.id && user.role !== 'admin') {
      return createErrorResponse('アクセス権限がありません', 403);
    }

    if (!body.id) {
      return createErrorResponse('ユーザーIDが必要です');
    }

    try {
      // データベース接続
      await connectToDatabase();
      const userModel = await createUserModel();

      // ユーザーの存在確認
      const existingUser = await userModel.findById(body.id);
      if (!existingUser) {
        return createErrorResponse('ユーザーが見つかりません', 404);
      }

      // 更新データを準備
      const updateData: Partial<UpdateUserRequest> = {};
      if (body.username && body.username !== existingUser.username) {
        updateData.username = body.username;
      }
      if (body.email && body.email !== existingUser.email) {
        updateData.email = body.email;
      }
      if (body.displayName !== undefined) {
        updateData.displayName = body.displayName;
      }
      if (body.role !== undefined && user.role === 'admin') {
        updateData.role = body.role;
      }
      if (body.isActive !== undefined && user.role === 'admin') {
        updateData.isActive = body.isActive;
      }
      if (body.darkMode !== undefined) {
        updateData.darkMode = body.darkMode;
      }

      // ユーザー更新
      const success = await userModel.update(body.id, updateData);
      if (!success) {
        return createErrorResponse('ユーザーの更新に失敗しました');
      }

      // 更新されたユーザーを取得
      const updatedUser = await userModel.findById(body.id);
      if (!updatedUser) {
        return createErrorResponse('更新されたユーザーの取得に失敗しました');
      }

      // レスポンス形式に変換
      const response: UserResponse = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        darkMode: updatedUser.darkMode || false,
        createdAt: updatedUser.createdAt.toISOString(),
        lastLogin: updatedUser.lastLogin?.toISOString()
      };

      return createSuccessResponse(response);
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      return createErrorResponse('ユーザーの更新に失敗しました');
    }
  }
);
