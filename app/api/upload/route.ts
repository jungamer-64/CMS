import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';
import { withApiAuth } from '@/app/lib/auth-middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface UploadResponse {
  uploadedFiles: Array<{
    message: string;
    url: string;
    fileName: string;
    originalName: string;
    size: number;
    type: string;
  }>;
  errors?: string[];
  totalUploaded: number;
  totalErrors: number;
}

// ファイルアップロード（POST）
export const POST = withApiAuth(async (request: NextRequest, context) => {
  const user = context.user;
  if (!user) {
    return createErrorResponse('認証情報がありません', 401);
  }

  console.log('ファイルアップロードAPI - ユーザー:', user.username);

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return createErrorResponse('ファイルが選択されていません', 400);
    }

    // ファイル数の制限 (一度に10ファイルまで)
    if (files.length > 10) {
      return createErrorResponse('一度にアップロードできるファイル数は10個までです', 400);
    }

    const uploadedFiles = [];
    const errors = [];

    // アップロードディレクトリの作成
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      try {
        // ファイルタイプの検証（画像＋動画）
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 
          'video/x-m4v', 'video/x-matroska', 'video/ogg', 'video/3gpp', 'video/3gpp2'
        ];
        if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name}: 許可されていないファイル形式です`);
          continue;
        }

        // ファイルサイズの検証 (100MB)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
          errors.push(`${file.name}: ファイルサイズが大きすぎます (最大100MB)`);
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // ファイル名の生成（重複を避けるためタイムスタンプを追加、URL安全な形式に変換）
        const timestamp = Date.now();
        const originalName = file.name;
        const fileExtension = originalName.split('.').pop() || 'png';
        
        // ファイル名をURL安全な形式に変換
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, ''); // 拡張子を除去
        const safeName = nameWithoutExt
          .normalize('NFD') // Unicode正規化
          .replace(/[\u0300-\u036f]/g, '') // アクセント記号を除去
          .replace(/[^\w._-]/g, '-') // 英数字、ハイフン、アンダースコア、ドット以外をハイフンに変換
          .replace(/-+/g, '-') // 連続するハイフンを単一に
          .replace(/(^-+)|(-+$)/g, '') // 先頭末尾のハイフンを削除
          .toLowerCase(); // 小文字に変換
        
        const fileName = safeName 
          ? `${timestamp}-${safeName}.${fileExtension}` 
          : `${timestamp}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);

        // ファイルの保存
        await writeFile(filePath, buffer);

        uploadedFiles.push({
          message: 'ファイルのアップロードに成功しました',
          url: `/uploads/${fileName}`,
          fileName: fileName,
          originalName: originalName,
          size: file.size,
          type: file.type
        });

        console.log('=== File Upload Success ===');
        console.log('Original filename:', originalName);
        console.log('Safe filename:', fileName);
        console.log('URL path:', `/uploads/${fileName}`);

      } catch (fileError) {
        console.error(`ファイル処理エラー (${file.name}):`, fileError);
        errors.push(`${file.name}: アップロードに失敗しました`);
      }
    }

    // レスポンス
    const response: UploadResponse = {
      uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadedFiles.length,
      totalErrors: errors.length
    };
    
    console.log('Upload response:', response);
    const message = `${uploadedFiles.length}個のファイルをアップロードしました`;
    return createSuccessResponse(response, message);

  } catch (error) {
    console.error('アップロードエラー:', error);
    return createErrorResponse('ファイルのアップロードに失敗しました', 500);
  }
});
