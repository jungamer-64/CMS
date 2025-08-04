/**
 * 権限処理ユーティリティ
 */

import type { UserRole } from '../../core/types';

/**
 * ユーザーが管理者権限を持つかチェック
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * ユーザーが一般ユーザー権限を持つかチェック
 */
export function isUser(role: UserRole): boolean {
  return role === 'user';
}

/**
 * ユーザーが指定されたリソースにアクセス可能かチェック
 */
export function canAccessResource(
  userRole: UserRole,
  resourceType: 'admin' | 'user' | 'public'
): boolean {
  switch (resourceType) {
    case 'public':
      return true;
    case 'user':
      return userRole === 'user' || userRole === 'admin';
    case 'admin':
      return userRole === 'admin';
    default:
      return false;
  }
}

/**
 * ユーザーが他のユーザーのリソースを編集可能かチェック
 */
export function canEditUserResource(
  currentUserRole: UserRole,
  targetUserId: string,
  currentUserId: string
): boolean {
  // 管理者は全て編集可能
  if (currentUserRole === 'admin') {
    return true;
  }
  
  // 一般ユーザーは自分のリソースのみ編集可能
  return targetUserId === currentUserId;
}
