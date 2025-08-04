/**
 * コメントモデル
 * 
 * コメントエンティティのビジネスロジック、バリデーション、
 * ユーティリティメソッドを提供します。
 */

import type { Comment, CommentInput } from '../../core/types';
import { isValidEmail } from '../../core/utils';

/**
 * コメントモデルクラス
 */
export class CommentModel {
  /**
   * コメント入力データのバリデーション
   */
  static validateInput(input: Partial<CommentInput>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 投稿スラグバリデーション
    if (!input.postSlug || input.postSlug.trim().length === 0) {
      errors.push('投稿スラグは必須です');
    }

    // 作成者名バリデーション
    if (!input.authorName || input.authorName.trim().length === 0) {
      errors.push('作成者名は必須です');
    } else if (input.authorName.length > 50) {
      errors.push('作成者名は50文字以下である必要があります');
    }

    // メールアドレスバリデーション
    if (!input.authorEmail || input.authorEmail.trim().length === 0) {
      errors.push('メールアドレスは必須です');
    } else if (!isValidEmail(input.authorEmail)) {
      errors.push('有効なメールアドレスを入力してください');
    }

    // コンテンツバリデーション
    if (!input.content || input.content.trim().length === 0) {
      errors.push('コメント内容は必須です');
    } else if (input.content.length > 1000) {
      errors.push('コメントは1000文字以下である必要があります');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * コメントが削除済みかどうかを判定
   */
  static isDeleted(comment: Comment): boolean {
    return comment.isDeleted === true;
  }

  /**
   * コメントの表示用コンテンツを取得（HTMLサニタイズ済み）
   */
  static getDisplayContent(comment: Comment): string {
    if (this.isDeleted(comment)) {
      return '[このコメントは削除されました]';
    }
    
    // 基本的なHTMLエスケープ
    return comment.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * コメントの短縮表示用コンテンツを取得
   */
  static getPreview(comment: Comment, maxLength: number = 100): string {
    const content = this.getDisplayContent(comment);
    
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength) + '...';
  }

  /**
   * コメントの作成日時を日本語形式で取得
   */
  static getFormattedDate(comment: Comment): string {
    return comment.createdAt.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * コメントが最近のものかどうかを判定（24時間以内）
   */
  static isRecent(comment: Comment): boolean {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return comment.createdAt > oneDayAgo;
  }

  /**
   * コメントの作成者情報を匿名化
   */
  static anonymize(comment: Comment): Comment {
    return {
      ...comment,
      authorName: '匿名ユーザー',
      authorEmail: 'anonymous@example.com',
    };
  }
}
