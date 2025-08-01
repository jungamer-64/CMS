import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersWithFilters, createUserByAdmin } from '@/app/lib/users';
import { 
  withIntegratedAuth, 
  createSuccessResponse, 
  createErrorResponse, 
  validateData,
  handleApiError,
  parsePaginationParams,
  AuthContext
} from '@/app/lib/api-utils';
import { userCreateSchema } from '@/app/lib/validation-schemas';
import {
  UsersListRequest,
  UsersListResponse,
  UserCreateRequest,
  UserResponse,
  ApiErrorCode
} from '@/app/lib/api-types';

// ユーザー一覧を取得（GET）
export async function GET(request: NextRequest): Promise<NextResponse> {
  return withIntegratedAuth(async (request: NextRequest, authContext?: AuthContext): Promise<NextResponse> => {
    const userInfo = authContext?.user?.username || 'unknown';
    console.log('管理者ユーザーAPI呼び出し - ユーザー:', userInfo);
  
  try {
    // URLパラメータから検索とフィルタを取得
    const { searchParams } = new URL(request.url);
    const queryParams: UsersListRequest = {
      role: searchParams.get('role') as 'user' | 'admin' | undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as 'createdAt' | 'username' | 'displayName' | undefined,
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | undefined,
      ...parsePaginationParams(searchParams)
    };

    console.log('取得パラメータ:', queryParams);

    // フィルタリング済みユーザーを取得
    const users = await getAllUsersWithFilters(queryParams);
    console.log('取得したユーザー数:', users.length);

    const response: UsersListResponse = {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      total: users.length,
      filters: queryParams
    };

    return createSuccessResponse(response);
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return handleApiError(error);
  }
  })(request);
}

// 新しいユーザーを作成（POST）
export async function POST(request: NextRequest): Promise<NextResponse> {
  return withIntegratedAuth(async (request: NextRequest, authContext?: AuthContext): Promise<NextResponse> => {
    const userInfo = authContext?.user?.username || 'unknown';
    console.log('管理者ユーザー作成API呼び出し - ユーザー:', userInfo);
  
  try {
    const body: UserCreateRequest = await request.json();
    console.log('受信したデータ:', body);

    // バリデーション
    const validation = validateData(body as unknown as Record<string, unknown>, userCreateSchema);
    if (!validation.isValid) {
      return createErrorResponse(
        validation.errors.map(e => e.message).join(', '),
        400,
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    const { username, email, password, displayName, role } = body;

    // 新しいユーザーを作成
    const newUser = await createUserByAdmin({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName.trim(),
      role: role || 'user'
    });
    
    console.log('新規ユーザー作成成功:', newUser.username);

    // レスポンス用にパスワードハッシュを除外
    const response: UserResponse = {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    };

    return createSuccessResponse(response, 'ユーザーが正常に作成されました');
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    return handleApiError(error);
  }
  })(request);
}
