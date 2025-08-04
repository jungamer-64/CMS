import { NextRequest } from 'next/server';
import { createGetHandler, createPostHandler, createDeleteHandler } from '@/app/lib/api-factory';
import { requireAdmin } from '@/app/lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { User } from '@/app/lib/core/types';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// RESTful Resource: Media (/api/media) - 管理者専用
// ============================================================================

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  url: string;
  mediaType: 'image' | 'video' | 'other';
}

// GET /api/media - メディア一覧取得（管理者のみ）
export const GET = createGetHandler<MediaItem[]>(
  async (request: NextRequest, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      // uploadsディレクトリが存在しない場合は空配列を返す
      try {
        await fs.access(uploadsDir);
      } catch {
        return createSuccessResponse([]);
      }
      
      const files = await fs.readdir(uploadsDir);
      const mediaItems: MediaItem[] = [];
      
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const mediaType = getMediaType(file);
          mediaItems.push({
            id: file,
            filename: file,
            originalName: file,
            size: stats.size,
            uploadDate: stats.mtime.toISOString(),
            url: `/uploads/${file}`,
            mediaType
          });
        } else if (stats.isDirectory()) {
          // サブディレクトリ内のファイルも取得
          try {
            const subFiles = await fs.readdir(filePath);
            for (const subFile of subFiles) {
              const subFilePath = path.join(filePath, subFile);
              const subStats = await fs.stat(subFilePath);
              
              if (subStats.isFile()) {
                const mediaType = getMediaType(subFile);
                mediaItems.push({
                  id: `${file}/${subFile}`,
                  filename: subFile,
                  originalName: subFile,
                  size: subStats.size,
                  uploadDate: subStats.mtime.toISOString(),
                  url: `/uploads/${file}/${subFile}`,
                  mediaType
                });
              }
            }
          } catch (subError) {
            console.warn(`サブディレクトリの読み取りに失敗: ${file}`, subError);
          }
        }
      }
      
      return createSuccessResponse(mediaItems);
    } catch (error) {
      console.error('メディア一覧取得エラー:', error);
      return createErrorResponse('メディアの取得に失敗しました');
    }
  }
);

// POST /api/media - メディアアップロード（管理者のみ）
export const POST = createPostHandler<FormData, { success: boolean; url?: string; message: string }>(
  async (request: NextRequest, body: FormData, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      // FormDataの処理は実装が複雑なため、基本的なレスポンスのみ返す
      return createSuccessResponse({
        success: false,
        message: 'メディアアップロード機能は実装中です'
      });
    } catch (error) {
      console.error('メディアアップロードエラー:', error);
      return createErrorResponse('メディアのアップロードに失敗しました');
    }
  }
);

// DELETE /api/media - メディア削除（管理者のみ）
export const DELETE = createDeleteHandler(
  async (request: NextRequest, user: User) => {
    // 管理者権限チェック
    const authContext = { user, sessionInfo: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), ip: '', userAgent: '', loginTime: new Date() } };
    if (!requireAdmin(authContext)) {
      return createErrorResponse('管理者権限が必要です');
    }
    
    try {
      const url = new URL(request.url);
      const files = url.searchParams.get('files')?.split(',') || [];
      
      if (files.length === 0) {
        return createErrorResponse('削除するファイルが指定されていません');
      }
      
      // ファイル削除処理（簡易実装）
      for (const file of files) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', file);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn(`ファイル削除に失敗: ${file}`, error);
        }
      }
      
      return createSuccessResponse({ message: `${files.length}個のファイルを削除しました` });
    } catch (error) {
      console.error('メディア削除エラー:', error);
      return createErrorResponse('メディアの削除に失敗しました');
    }
  }
);

// メディアタイプ判定ヘルパー関数
function getMediaType(filename: string): 'image' | 'video' | 'other' {
  const ext = path.extname(filename).toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.m4v', '.mkv', '.ogv', '.3gp', '.3g2'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  
  if (videoExtensions.includes(ext)) return 'video';
  if (imageExtensions.includes(ext)) return 'image';
  return 'other';
}
