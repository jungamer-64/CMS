/**
 * ユーザーモデル
 * 
 * ユーザーエンティティのビジネスロジック、バリデーション、
 * ユーティリティメソッドを提供します。
 */

import type { User, UserInput, UserUpdateInput } from '../../core/types';
import { isUserRole, isValidEmail } from '../../core/utils';

/**
 * ユーザーモデルクラス
 */
export class UserModel {
  /**
   * ユーザー入力データのバリデーション
   */
  static validateInput(input: Partial<UserInput>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // ユーザー名バリデーション
    if (input.username !== undefined) {
      if (!input.username || input.username.trim().length === 0) {
        errors.push('ユーザー名は必須です');
      } else if (input.username.length < 3) {
        errors.push('ユーザー名は3文字以上である必要があります');
      } else if (input.username.length > 30) {
        errors.push('ユーザー名は30文字以下である必要があります');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(input.username)) {
        errors.push('ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です');
      }
    }

    // メールアドレスバリデーション
    if (input.email !== undefined) {
      if (!input.email || input.email.trim().length === 0) {
        errors.push('メールアドレスは必須です');
      } else if (!isValidEmail(input.email)) {
        errors.push('有効なメールアドレスを入力してください');
      }
    }

    // パスワードバリデーション
    if (input.password !== undefined) {
      if (!input.password || input.password.length === 0) {
        errors.push('パスワードは必須です');
      } else if (input.password.length < 8) {
        errors.push('パスワードは8文字以上である必要があります');
      } else if (input.password.length > 128) {
        errors.push('パスワードは128文字以下である必要があります');
      }
    }

    // 表示名バリデーション
    if (input.displayName !== undefined) {
      if (!input.displayName || input.displayName.trim().length === 0) {
        errors.push('表示名は必須です');
      } else if (input.displayName.length > 50) {
        errors.push('表示名は50文字以下である必要があります');
      }
    }

    // ロールバリデーション
    if (input.role !== undefined && !isUserRole(input.role)) {
      errors.push('有効なユーザーロールを指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * ユーザー更新データのバリデーション
   */
  static validateUpdateInput(input: Partial<UserUpdateInput>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 更新用の緩いバリデーション
    if (input.username !== undefined && input.username.trim().length === 0) {
      errors.push('ユーザー名を空にすることはできません');
    }

    if (input.email !== undefined && input.email.trim().length === 0) {
      errors.push('メールアドレスを空にすることはできません');
    }

    if (input.displayName !== undefined && input.displayName.trim().length === 0) {
      errors.push('表示名を空にすることはできません');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * センシティブ情報を除去したユーザーデータを取得
   */
  static toSafeUser(user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * ユーザーが管理者かどうかを判定
   */
  static isAdmin(user: User): boolean {
    return user.role === 'admin';
  }

  /**
   * ユーザーがアクティブかどうかを判定
   */
  static isActive(_user: User): boolean {
    // 将来的にisActiveフィールドが追加された場合に対応
    return true; // 現在は全ユーザーがアクティブ
  }

  /**
   * ユーザーの表示用フルネームを生成
   */
  static getDisplayName(user: User): string {
    return user.displayName || user.username;
  }
}
