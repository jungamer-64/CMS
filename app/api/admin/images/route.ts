import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession } from '@/app/lib/api-auth';
import fs from 'fs/promises';
import path from 'path';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

// アップロード済み画像の一覧を取得
export async function GET(request: NextRequest) {
  try {
    console.log('=== Images API GET Request ===');
    
    // 管理者認証チェック
    const userValidation = await validateUserSession(request);
    console.log('User validation result:', userValidation);
    
    if (!userValidation.valid) {
      console.log('Validation failed:', userValidation.error);
      return NextResponse.json(
        { error: userValidation.error || '認証が必要です' },
        { status: 401 }
      );
    }
    
    if (!userValidation.user?.role || userValidation.user.role !== 'admin') {
      console.log('User role check failed. User role:', userValidation.user?.role);
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    console.log('Authentication successful for user:', userValidation.user.username);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      const files = await fs.readdir(uploadsDir);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      
      const images = await Promise.all(
        files
          .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
          })
          .map(async (file) => {
            const filePath = path.join(uploadsDir, file);
            const stats = await fs.stat(filePath);
            
            // ファイル名から元の名前を推測（タイムスタンプを除去）
            const originalName = file.replace(/^\d+-/, '');
            
            return {
              filename: file,
              originalName: originalName,
              size: stats.size,
              uploadDate: stats.birthtime.toISOString(),
              url: `/uploads/${file}`
            };
          })
      );

      // 日付順にソート（新しい順）
      const sortedImages = images.toSorted((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );

      return NextResponse.json({
        success: true,
        images: sortedImages
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // uploadsディレクトリが存在しない場合
        return NextResponse.json({
          success: true,
          images: []
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('画像一覧取得エラー:', error);
    return NextResponse.json(
      { error: '画像一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 選択した画像を削除
export async function DELETE(request: NextRequest) {
  try {
    // 管理者認証チェック
    const userValidation = await validateUserSession(request);
    if (!userValidation.valid || userValidation.user?.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { filenames } = body;

    if (!Array.isArray(filenames) || filenames.length === 0) {
      return NextResponse.json(
        { error: '削除するファイル名が指定されていません' },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const deletedFiles: string[] = [];
    const errors: string[] = [];

    for (const filename of filenames) {
      try {
        // ファイル名のサニタイズ（ディレクトリトラバーサル対策）
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(uploadsDir, sanitizedFilename);
        
        // ファイルが存在するか確認
        await fs.access(filePath);
        
        // ファイルを削除
        await fs.unlink(filePath);
        deletedFiles.push(filename);
      } catch (error) {
        console.error(`ファイル削除エラー (${filename}):`, error);
        errors.push(`${filename}: 削除に失敗しました`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deletedFiles.length}個のファイルを削除しました`,
      deleted: deletedFiles,
      errors: errors
    });
  } catch (error) {
    console.error('画像削除エラー:', error);
    return NextResponse.json(
      { error: '画像の削除に失敗しました' },
      { status: 500 }
    );
  }
}
