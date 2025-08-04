/**
 * API ハンドラーファクトリー
 * LIB_COMMONIZATION_PLAN.md フェーズ4対応
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '../../core/types';
import { createSuccessResponse, createErrorResponse, handleApiError, parseRequestBody } from '../client/utils';

/**
 * POST ハンドラー型定義
 */
export type PostHandler<TBody = unknown, TResponse = unknown> = (
  request: NextRequest,
  body: TBody
) => Promise<ApiResponse<TResponse>>;

/**
 * GET ハンドラー型定義
 */
export type GetHandler<TResponse = unknown> = (
  request: NextRequest
) => Promise<ApiResponse<TResponse>>;

/**
 * PUT ハンドラー型定義
 */
export type PutHandler<TBody = unknown, TResponse = unknown> = (
  request: NextRequest,
  body: TBody
) => Promise<ApiResponse<TResponse>>;

/**
 * DELETE ハンドラー型定義
 */
export type DeleteHandler<TResponse = unknown> = (
  request: NextRequest
) => Promise<ApiResponse<TResponse>>;

/**
 * POST リクエスト用ファクトリー関数
 */
export function createPostHandler<TBody = unknown, TResponse = unknown>(
  handler: PostHandler<TBody, TResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await parseRequestBody<TBody>(request);
      if (!body) {
        return createErrorResponse('リクエストボディが無効です', 400);
      }

      const result = await handler(request, body);
      
      if (result.success) {
        return createSuccessResponse(result.data, result.message);
      } else {
        return createErrorResponse(result.error, 400, result.code, result.details);
      }
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * GET リクエスト用ファクトリー関数
 */
export function createGetHandler<TResponse = unknown>(
  handler: GetHandler<TResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const result = await handler(request);
      
      if (result.success) {
        return createSuccessResponse(result.data, result.message);
      } else {
        return createErrorResponse(result.error, 400, result.code, result.details);
      }
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * PUT リクエスト用ファクトリー関数
 */
export function createPutHandler<TBody = unknown, TResponse = unknown>(
  handler: PutHandler<TBody, TResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await parseRequestBody<TBody>(request);
      if (!body) {
        return createErrorResponse('リクエストボディが無効です', 400);
      }

      const result = await handler(request, body);
      
      if (result.success) {
        return createSuccessResponse(result.data, result.message);
      } else {
        return createErrorResponse(result.error, 400, result.code, result.details);
      }
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * DELETE リクエスト用ファクトリー関数
 */
export function createDeleteHandler<TResponse = unknown>(
  handler: DeleteHandler<TResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const result = await handler(request);
      
      if (result.success) {
        return createSuccessResponse(result.data, result.message);
      } else {
        return createErrorResponse(result.error, 400, result.code, result.details);
      }
    } catch (error) {
      return handleApiError(error);
    }
  };
}
