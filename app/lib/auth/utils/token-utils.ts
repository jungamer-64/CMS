/**
 * トークン処理ユーティリティ
 * 
 * JWT、セッショントークンなどの
 * 処理ユーティリティを提供
 */

import { randomBytes, createHash } from 'crypto';

/**
 * セキュアなランダム文字列を生成
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * トークンをハッシュ化
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * トークンの有効期限を計算
 */
export function calculateTokenExpiry(hoursFromNow: number = 24): Date {
  const now = new Date();
  now.setHours(now.getHours() + hoursFromNow);
  return now;
}

/**
 * トークンが期限切れかチェック
 */
export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}
