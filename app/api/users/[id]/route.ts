import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/app/lib/data/repositories/user-repository';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// 認証ヘルパー
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userResponse = await userRepository.findById(decoded.userId);
    
    if (!userResponse.success || !userResponse.data) {
      return null;
    }
    
    return userResponse.data;
  } catch (err: unknown) {
    console.error('Authentication error:', err instanceof Error ? err : String(err));
    return null;
  }
}

// ユーザー情報更新（PATCH）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'ユーザーIDが必要です'
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // 認証チェック
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: '認証が必要です'
          },
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // 自分自身または管理者のみ更新可能
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_FAILED',
            message: 'このユーザー情報を更新する権限がありません'
          },
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, displayName, role } = body;

    // updateData を構築
    const updateData: Record<string, string | boolean> = {};
    
    if (username !== undefined) updateData.username = username.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (currentUser.role === 'admin' && role !== undefined) updateData.role = role;

    // ユーザー情報を更新
    const updateResponse = await userRepository.update(id, updateData);

    if (!updateResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'ユーザーが見つかりません'
          },
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    // 更新後のユーザー情報を取得
    const userResponse = await userRepository.findById(id);
    if (!userResponse.success || !userResponse.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '更新されたユーザー情報の取得に失敗しました'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: userResponse.data,
        meta: {
          message: 'ユーザー情報が正常に更新されました'
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('ユーザー更新エラー:', err instanceof Error ? err : String(err));
    
    if (err instanceof Error && err.message.includes('already exists')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESOURCE_CONFLICT',
            message: 'このユーザー名またはメールアドレスは既に使用されています'
          },
          timestamp: new Date().toISOString()
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ユーザー情報の更新に失敗しました'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 特定ユーザー取得（GET）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'ユーザーIDが必要です'
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // 認証チェック
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: '認証が必要です'
          },
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // 自分自身または管理者のみアクセス可能
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_FAILED',
            message: 'このユーザー情報にアクセスする権限がありません'
          },
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      );
    }

    const userResponse = await userRepository.findById(id);
    
    if (!userResponse.success || !userResponse.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'ユーザーが見つかりません'
          },
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: userResponse.data,
        meta: {
          message: 'ユーザー情報を取得しました'
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('ユーザー取得エラー:', err instanceof Error ? err : String(err));
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ユーザー情報の取得に失敗しました'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ユーザー削除（DELETE）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const permanent = url.searchParams.get('permanent') === 'true';
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'ユーザーIDが必要です'
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // 認証チェック
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: '認証が必要です'
          },
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // 管理者のみ削除可能
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_FAILED',
            message: '管理者権限が必要です'
          },
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      );
    }

    // 自分自身は削除できない - 削除対象ユーザーを取得して確認
    const targetUserResponse = await userRepository.findById(id);
    if (!targetUserResponse.success || !targetUserResponse.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'ユーザーが見つかりません'
          },
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    const targetUser = targetUserResponse.data;
    if (currentUser.id === targetUser.id || 
        currentUser.username === targetUser.username ||
        currentUser.email === targetUser.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_FAILED',
            message: '自分自身を削除することはできません'
          },
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      );
    }

    const deleteResponse = permanent 
      ? await userRepository.permanentDelete(id)
      : await userRepository.delete(id);

    if (!deleteResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'ユーザーが見つかりません'
          },
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    const message = permanent 
      ? 'ユーザーが完全に削除されました' 
      : 'ユーザーが無効化されました';

    return NextResponse.json(
      {
        success: true,
        data: { message },
        meta: { message },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('ユーザー削除エラー:', err instanceof Error ? err : String(err));
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ユーザーの削除に失敗しました'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
