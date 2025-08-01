import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import fs from 'fs/promises';
import path from 'path';
import type { MediaItem } from '@/app/lib/api-types';
import { getDatabase } from '@/app/lib/mongodb';

// MongoDB のメディアドキュメント型定義
interface MediaDocument {
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  url: string;
  mediaType: 'image' | 'video' | 'other';
  directory: string;
}

// ヘルパー関数: MongoDBドキュメントをMediaItemに変換
function convertToMediaItem(doc: unknown): MediaItem {
  const mediaDoc = doc as MediaDocument;
  return {
    filename: mediaDoc.filename,
    originalName: mediaDoc.originalName,
    size: mediaDoc.size,
    uploadDate: mediaDoc.uploadDate,
    url: mediaDoc.url,
    mediaType: mediaDoc.mediaType,
    directory: mediaDoc.directory
  };
}

// 型ガード関数
function isDeleteRequest(obj: unknown): obj is { filenames: string[] } {
  if (!obj || typeof obj !== 'object') return false;
  const req = obj as Record<string, unknown>;
  return Array.isArray(req.filenames) && req.filenames.length > 0 &&
         req.filenames.every(f => typeof f === 'string');
}

// メディア一覧取得（GET）
export const GET = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  
  try {
    const db = await getDatabase();
    const docs = await db.collection('media').find({}).sort({ uploadDate: -1 }).toArray();
    const media: MediaItem[] = docs.map(convertToMediaItem);
    
    return createSuccessResponse({ media }, 'メディア一覧を取得しました');
  } catch (error) {
    console.error('メディア一覧取得エラー:', error);
    return createErrorResponse('メディア一覧の取得に失敗しました', 500);
  }
});

// ファイルアップロード（POST）
export const POST = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    
    if (!files || files.length === 0) {
      return createErrorResponse('アップロードするファイルがありません', 400);
    }
    
    const uploadsDir: string = path.join(process.cwd(), 'public', 'uploads');
    const imageExtensions: string[] = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const videoExtensions: string[] = ['.mp4', '.webm', '.mov', '.avi', '.m4v', '.mkv', '.ogv', '.3gp', '.3g2'];
    const db = await getDatabase();
    
    for (const file of files) {
      if (typeof file === 'object' && 'arrayBuffer' in file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name).toLowerCase();
        
        let mediaType: 'image' | 'video' | 'other' = 'other';
        if (imageExtensions.includes(ext)) mediaType = 'image';
        else if (videoExtensions.includes(ext)) mediaType = 'video';
        
        const filename = `${Date.now()}-${file.name}`;
        const savePath = path.join(uploadsDir, filename);
        
        await fs.writeFile(savePath, buffer);
        const stats = await fs.stat(savePath);
        
        const mediaDoc = {
          filename,
          originalName: file.name,
          size: stats.size,
          uploadDate: stats.birthtime.toISOString(),
          url: `/uploads/${filename}`,
          mediaType,
          directory: '/uploads'
        };
        
        await db.collection('media').insertOne(mediaDoc);
      }
    }
    
    // 最新一覧返却
    const docs = await db.collection('media').find({}).sort({ uploadDate: -1 }).toArray();
    const media: MediaItem[] = docs.map(convertToMediaItem);
    
    return createSuccessResponse({ media }, 'ファイルが正常にアップロードされました');
  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    return createErrorResponse('ファイルのアップロードに失敗しました', 500);
  }
});

// 選択したメディアを削除（DELETE）
export const DELETE = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }
  
  try {
    const body = await request.json();
    
    // 型ガードによる検証
    if (!isDeleteRequest(body)) {
      return createErrorResponse('削除するファイル名が指定されていません', 400);
    }
    
    const { filenames } = body;
    const uploadsDir: string = path.join(process.cwd(), 'public', 'uploads');
    const db = await getDatabase();
    const deletedFiles: string[] = [];
    const errors: string[] = [];
    
    for (const filename of filenames) {
      try {
        const sanitizedFilename: string = path.basename(filename);
        const filePath: string = path.join(uploadsDir, sanitizedFilename);
        
        await fs.access(filePath);
        await fs.unlink(filePath);
        await db.collection('media').deleteOne({ filename: sanitizedFilename });
        
        deletedFiles.push(filename);
      } catch (error) {
        console.error(`ファイル削除エラー (${filename}):`, error);
        errors.push(`${filename}: 削除に失敗しました`);
      }
    }
    
    // 最新一覧返却
    const docs = await db.collection('media').find({}).sort({ uploadDate: -1 }).toArray();
    const media: MediaItem[] = docs.map(convertToMediaItem);
    
    return createSuccessResponse(
      {
        deleted: deletedFiles,
        errors,
        media
      }, 
      `${deletedFiles.length}個のファイルを削除しました`
    );
  } catch (error) {
    console.error('メディア削除エラー:', error);
    if (error instanceof SyntaxError) {
      return createErrorResponse('無効なJSONデータです', 400);
    }
    return createErrorResponse('メディアの削除中にエラーが発生しました', 500);
  }
});
