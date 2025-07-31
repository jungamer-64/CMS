import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, validateRequired } from '@/app/lib/api-utils';
import { createComment } from '@/app/lib/comments';
import { getSettings } from '@/app/lib/settings';

// コメント投稿（POST）
export async function POST(request: NextRequest) {
  console.log('コメント投稿API呼び出し');
  
  try {
    const { authorName, authorEmail, content, postSlug } = await request.json();
    
    console.log('投稿データ:', { authorName, authorEmail, content, postSlug });

    // バリデーション
    const validationError = validateRequired(
      { authorName, authorEmail, content, postSlug }, 
      ['authorName', 'authorEmail', 'content', 'postSlug']
    );
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // メールアドレスの簡単なバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return createErrorResponse('有効なメールアドレスを入力してください', 400);
    }

    // 設定を取得してコメント機能が有効かチェック
    const settings = await getSettings();
    
    if (!settings.allowComments) {
      return createErrorResponse('コメント機能は現在無効になっています', 403);
    }

    // データベースにコメントを保存
    const commentData = {
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      content: content.trim(),
      postSlug
    };

    // 設定に基づいて承認状態を決定
    const isApproved = !settings.requireApproval;
    const newComment = await createComment(commentData, isApproved);

    console.log('コメント作成成功:', newComment);
    
    const message = isApproved 
      ? 'コメントが正常に投稿されました' 
      : 'コメントが投稿されました。管理者の承認後に表示されます';
    
    return createSuccessResponse(
      { comment: newComment }, 
      message
    );
  } catch (error) {
    console.error('コメント投稿エラー:', error);
    return createErrorResponse('コメントの投稿中にエラーが発生しました', 500);
  }
}
