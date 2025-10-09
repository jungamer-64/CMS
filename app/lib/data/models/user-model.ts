/**
 * ユーザーモデル
 * 
 * ユーザーエンティティのビジネスロジック、バリデーション、
 * ユーティリティメソッドを提供します。
 */

import type { User, UserInput, UserUpdateInput } from '../../core/types';
import { isUserRole, isValidEmail } from '../../core/utils';

/**
 * バリデーション結果型
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * ユーザーモデルクラス
 */
export class UserModel {
  /**
   * ユーザー名のバリデーション
   */
  private static validateUsername(username: string | undefined): string[] {
    const errors: string[] = [];
    
    if (username === undefined) {
      return errors;
    }

    if (!username || username.trim().length === 0) {
      errors.push('ユーザー名は必須です');
    } else if (username.length < 3) {
      errors.push('ユーザー名は3文字以上である必要があります');
    } else if (username.length > 30) {
      errors.push('ユーザー名は30文字以下である必要があります');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です');
    }

    return errors;
  }

  /**
   * メールアドレスのバリデーション
   */
  private static validateEmail(email: string | undefined): string[] {
    const errors: string[] = [];
    
    if (email === undefined) {
      return errors;
    }

    if (!email || email.trim().length === 0) {
      errors.push('メールアドレスは必須です');
    } else if (!isValidEmail(email)) {
      errors.push('有効なメールアドレスを入力してください');
    }

    return errors;
  }

  /**
   * パスワードのバリデーション
   */
  private static validatePassword(password: string | undefined): string[] {
    const errors: string[] = [];
    
    if (password === undefined) {
      return errors;
    }

    if (!password || password.length === 0) {
      errors.push('パスワードは必須です');
    } else if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります');
    } else if (password.length > 128) {
      errors.push('パスワードは128文字以下である必要があります');
    }

    return errors;
  }

  /**
   * 表示名のバリデーション
   */
  private static validateDisplayName(displayName: string | undefined): string[] {
    const errors: string[] = [];
    
    if (displayName === undefined) {
      return errors;
    }

    if (!displayName || displayName.trim().length === 0) {
      errors.push('表示名は必須です');
    } else if (displayName.length > 50) {
      errors.push('表示名は50文字以下である必要があります');
    }

    return errors;
  }

  /**
   * ロールのバリデーション
   */
  private static validateRole(role: string | undefined): string[] {
    const errors: string[] = [];
    
    if (role !== undefined && !isUserRole(role)) {
      errors.push('有効なユーザーロールを指定してください');
    }

    return errors;
  }

  /**
   * ユーザー入力データのバリデーション
   */
  static validateInput(input: Partial<UserInput>): ValidationResult {
    const errors: string[] = [
      ...this.validateUsername(input.username),
      ...this.validateEmail(input.email),
      ...this.validatePassword(input.password),
      ...this.validateDisplayName(input.displayName),
      ...this.validateRole(input.role),
    ];

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
  static isActive(): boolean {
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
