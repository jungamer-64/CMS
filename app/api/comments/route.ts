import { NextRequest, NextResponse } from 'next/server';
import { createComment } from '@/app/lib/comments';
import { getSettings } from '@/app/lib/settings';
import { CommentInput } from '@/app/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 設定を確認
    const settings = await getSettings();
    
    if (!settings.allowComments) {
      return NextResponse.json(
        { error: 'コメント投稿は現在無効になっています' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { postSlug, authorName, authorEmail, content }: CommentInput = body;

    // バリデーション
    if (!postSlug || !authorName || !authorEmail || !content) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    if (content.trim().length < 1) {
      return NextResponse.json(
        { error: 'コメント内容を入力してください' },
        { status: 400 }
      );
    }

    if (authorName.trim().length < 1) {
      return NextResponse.json(
        { error: '名前を入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの簡単な検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // コメントを作成（設定に基づいて自動承認）
    const comment = await createComment({
      postSlug: postSlug.trim(),
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      content: content.trim()
    }, !settings.requireApproval); // 承認不要の場合は自動承認

    // 承認が必要かどうかによってメッセージを変更
    const message = settings.requireApproval
      ? 'コメントが投稿されました。管理者の承認後に表示されます。'
      : 'コメントが投稿されました。';

    return NextResponse.json({
      success: true,
      message,
      comment: {
        id: comment.id,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
        isApproved: comment.isApproved
      }
    });

  } catch (error) {
    console.error('コメント投稿エラー:', error);
    return NextResponse.json(
      { error: 'コメントの投稿に失敗しました' },
      { status: 500 }
    );
  }
}
