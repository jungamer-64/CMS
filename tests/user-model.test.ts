/**
 * UserModel ユニットテスト
 * 
 * リファクタリング後のバリデーション関数の動作を検証します。
 */

import { describe, expect, it } from 'vitest';
import { UserModel } from '../app/lib/data/models/user-model';
import type { UserInput, UserUpdateInput } from '../app/lib/core/types';

describe('UserModel - validateInput', () => {
  describe('ユーザー名のバリデーション', () => {
    it('有効なユーザー名を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'validuser123',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('3文字の最小長を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'abc',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('30文字の最大長を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'a'.repeat(30),
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('空のユーザー名を拒否', () => {
      const input: Partial<UserInput> = {
        username: '',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ユーザー名は必須です');
    });

    it('空白のみのユーザー名を拒否', () => {
      const input: Partial<UserInput> = {
        username: '   ',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ユーザー名は必須です');
    });

    it('3文字未満のユーザー名を拒否', () => {
      const input: Partial<UserInput> = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ユーザー名は3文字以上である必要があります');
    });

    it('30文字を超えるユーザー名を拒否', () => {
      const input: Partial<UserInput> = {
        username: 'a'.repeat(31),
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ユーザー名は30文字以下である必要があります');
    });

    it('無効な文字を含むユーザー名を拒否', () => {
      const invalidUsernames = [
        'user name',    // スペース
        'user@name',    // @記号
        'user.name',    // ドット
        'user#name',    // ハッシュ
        'ユーザー名',    // 日本語
      ];

      invalidUsernames.forEach((username) => {
        const input: Partial<UserInput> = {
          username,
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test',
        };
        const result = UserModel.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です');
      });
    });

    it('ハイフンとアンダースコアを含むユーザー名を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'user_name-123',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });
  });

  describe('メールアドレスのバリデーション', () => {
    it('有効なメールアドレスを受け入れる', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.jp',
        'user+tag@example.com',
        'user_name@example.com',
      ];

      validEmails.forEach((email) => {
        const input: Partial<UserInput> = {
          username: 'testuser',
          email,
          password: 'password123',
          displayName: 'Test',
        };
        const result = UserModel.validateInput(input);
        expect(result.isValid).toBe(true);
      });
    });

    it('空のメールアドレスを拒否', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: '',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('メールアドレスは必須です');
    });

    it('無効なメールアドレスを拒否', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'no@domain@double.com',
        'spaces in@email.com',
      ];

      invalidEmails.forEach((email) => {
        const input: Partial<UserInput> = {
          username: 'testuser',
          email,
          password: 'password123',
          displayName: 'Test',
        };
        const result = UserModel.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('有効なメールアドレスを入力してください');
      });
    });
  });

  describe('パスワードのバリデーション', () => {
    it('有効なパスワードを受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'validpass123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('8文字の最小長を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345678',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('128文字の最大長を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'a'.repeat(128),
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('空のパスワードを拒否', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: '',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは必須です');
    });

    it('8文字未満のパスワードを拒否', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: '1234567',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは8文字以上である必要があります');
    });

    it('128文字を超えるパスワードを拒否', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'a'.repeat(129),
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは128文字以下である必要があります');
    });
  });

  describe('表示名のバリデーション', () => {
    it('有効な表示名を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('日本語の表示名を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'テストユーザー',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('50文字の最大長を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'a'.repeat(50),
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('空の表示名を拒否', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: '',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('表示名は必須です');
    });

    it('空白のみの表示名を拒否', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: '   ',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('表示名は必須です');
    });

    it('50文字を超える表示名を拒否', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'a'.repeat(51),
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('表示名は50文字以下である必要があります');
    });
  });

  describe('ロールのバリデーション', () => {
    it('有効なロール (admin) を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
        role: 'admin',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('有効なロール (user) を受け入れる', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
        role: 'user',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('ロールが未指定の場合は成功', () => {
      const input: Partial<UserInput> = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(true);
    });

    it('無効なロールを拒否', () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
        role: 'superadmin',
      } as unknown as Partial<UserInput>;
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('有効なユーザーロールを指定してください');
    });
  });

  describe('複数エラーの同時検出', () => {
    it('すべてのフィールドが無効な場合、すべてのエラーを返す', () => {
      const input = {
        username: 'ab',                    // 短すぎる
        email: 'invalid-email',            // 無効なメール
        password: '123',                   // 短すぎる
        displayName: '',                   // 空
        role: 'invalid',                   // 無効なロール
      } as unknown as Partial<UserInput>;
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
    });

    it('一部のフィールドが無効な場合、該当エラーのみ返す', () => {
      const input: Partial<UserInput> = {
        username: 'ab',                    // 短すぎる
        email: 'valid@example.com',        // 有効
        password: 'validpassword',         // 有効
        displayName: 'Valid Name',         // 有効
      };
      const result = UserModel.validateInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('ユーザー名は3文字以上');
    });
  });

  describe('オプションフィールドの処理', () => {
    it('未定義のフィールドはスキップされる', () => {
      const input: Partial<UserInput> = {
        username: undefined,
        email: undefined,
        password: undefined,
        displayName: undefined,
        role: undefined,
      };
      const result = UserModel.validateInput(input);
      // undefinedの場合はバリデーションスキップ（エラーなし）
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('UserModel - validateUpdateInput', () => {
  it('部分的な更新を許可する', () => {
    const input: Partial<UserUpdateInput> = {
      displayName: 'Updated Name',
    };
    const result = UserModel.validateUpdateInput(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('空の更新オブジェクトを許可する', () => {
    const input: Partial<UserUpdateInput> = {};
    const result = UserModel.validateUpdateInput(input);
    expect(result.isValid).toBe(true);
  });

  it('有効な部分更新を受け入れる', () => {
    const input: Partial<UserUpdateInput> = {
      username: 'newusername',
      email: 'newemail@example.com',
    };
    const result = UserModel.validateUpdateInput(input);
    expect(result.isValid).toBe(true);
  });

  it('空文字列への更新を拒否', () => {
    const input: Partial<UserUpdateInput> = {
      username: '',
    };
    const result = UserModel.validateUpdateInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('ユーザー名を空にすることはできません');
  });
});
