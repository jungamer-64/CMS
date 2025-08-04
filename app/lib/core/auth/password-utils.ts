/**
 * パスワード関連ユーティリティ
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import bcrypt from 'bcryptjs';

/**
 * パスワードをハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * パスワードを比較
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * ソルトを生成
 */
export async function generateSalt(rounds = 12): Promise<string> {
  return bcrypt.genSalt(rounds);
}
