/**
 * 投稿データモデル
 * LIB_COMMONIZATION_PLAN.md フェーズ5対応
 */

import type { Post, PostInput } from '../../core/types';

export class PostModel {
  static validate(input: Partial<PostInput>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // タイトル検証
    if (input.title !== undefined) {
      if (typeof input.title !== 'string') {
        errors.push('タイトルは文字列である必要があります');
      } else if (input.title.trim().length === 0) {
        errors.push('タイトルは必須です');
      } else if (input.title.length > 200) {
        errors.push('タイトルは200文字以内で入力してください');
      }
    }

    // コンテンツ検証
    if (input.content !== undefined) {
      if (typeof input.content !== 'string') {
        errors.push('コンテンツは文字列である必要があります');
      } else if (input.content.trim().length === 0) {
        errors.push('コンテンツは必須です');
      }
    }

    // スラッグ検証
    if (input.slug !== undefined) {
      if (typeof input.slug !== 'string') {
        errors.push('スラッグは文字列である必要があります');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(input.slug)) {
        errors.push('スラッグは英数字、ハイフン、アンダースコアのみ使用可能です');
      } else if (input.slug.length > 100) {
        errors.push('スラッグは100文字以内で入力してください');
      }
    }

    // 作者検証
    if (input.author !== undefined) {
      if (typeof input.author !== 'string') {
        errors.push('作者は文字列である必要があります');
      } else if (input.author.trim().length === 0) {
        errors.push('作者は必須です');
      } else if (input.author.length > 50) {
        errors.push('作者名は50文字以内で入力してください');
      }
    }

    // メディア検証
    if (input.media !== undefined) {
      if (!Array.isArray(input.media)) {
        errors.push('メディアは配列である必要があります');
      } else {
        input.media.forEach((item, index) => {
          if (typeof item !== 'string') {
            errors.push(`メディア[${index}]は文字列である必要があります`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitize(input: PostInput): PostInput {
    return {
      title: input.title?.trim() || '',
      content: input.content?.trim() || '',
      slug: input.slug?.trim().toLowerCase() || '',
      author: input.author?.trim() || '',
      media: input.media?.filter(item => typeof item === 'string' && item.trim().length > 0) || [],
    };
  }

  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // 英数字、スペース、ハイフン以外を削除
      .replace(/\s+/g, '-') // スペースをハイフンに
      .replace(/-+/g, '-') // 連続するハイフンを1つに
      .replace(/^-|-$/g, ''); // 先頭と末尾のハイフンを削除
  }

  static extractSummary(content: string, length: number = 200): string {
    // Markdownを簡単にクリーンアップ
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // ヘッダー記号を削除
      .replace(/\*\*(.*?)\*\*/g, '$1') // ボールド記号を削除
      .replace(/\*(.*?)\*/g, '$1') // イタリック記号を削除
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // リンクをテキストのみに
      .replace(/`(.*?)`/g, '$1') // インラインコード記号を削除
      .replace(/\n+/g, ' ') // 改行をスペースに
      .trim();

    if (cleanContent.length <= length) {
      return cleanContent;
    }

    return cleanContent.substring(0, length).trim() + '...';
  }

  static isPublished(post: Post): boolean {
    return !post.isDeleted;
  }

  static getDaysOld(post: Post): number {
    const now = new Date();
    const created = new Date(post.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
