import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/app/lib/auth-middleware';

// GET /api/test - APIキー認証をテストするエンドポイント
export const GET = withApiAuth(async (request: NextRequest, context) => {
  return NextResponse.json({
    success: true,
    message: 'APIキー認証が成功しました',
    authMethod: context.authMethod,
    timestamp: new Date().toISOString(),
    ...(context.user && { user: context.user }),
    ...(context.apiKey && { 
      apiKeyUserId: context.apiKey.userId,
      permissions: context.apiKey.permissions 
    })
  });
}, { resource: 'posts', action: 'read' });

// POST /api/test - 投稿作成権限が必要なテストエンドポイント
export const POST = withApiAuth(async (request: NextRequest, context) => {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: '投稿作成権限での認証が成功しました',
    authMethod: context.authMethod,
    receivedData: body,
    timestamp: new Date().toISOString(),
    ...(context.user && { user: context.user }),
    ...(context.apiKey && { 
      apiKeyUserId: context.apiKey.userId,
      permissions: context.apiKey.permissions 
    })
  });
}, { resource: 'posts', action: 'create' });
