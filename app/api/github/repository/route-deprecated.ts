import { NextRequest } from 'next/server';
import { createErrorResponse } from '@/app/lib/api-utils';

// DEPRECATED: GitHub integration is no longer supported
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'branches':
      return Response.json(createErrorResponse('GitHub integration is deprecated', 410));
    case 'commits':
      return Response.json(createErrorResponse('GitHub integration is deprecated', 410));
    case 'files':
      return Response.json(createErrorResponse('GitHub integration is deprecated', 410));
    case 'auth-status':
      return Response.json(createErrorResponse('GitHub integration is deprecated', 410));
    default:
      return Response.json(createErrorResponse('Unknown action', 400));
  }
}

export async function POST() {
  return Response.json(createErrorResponse('GitHub integration is deprecated', 410));
}

export async function PUT() {
  return Response.json(createErrorResponse('GitHub integration is deprecated', 410));
}
