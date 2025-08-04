// 基本スキーマ（zodなしバージョン）
export interface UserCreateRequest {
  email: string;
  username: string;
  password: string;
}

export interface PostCreateRequest {
  title: string;
  content: string;
  slug: string;
}

// バリデーション関数
export function validateUserCreate(data: unknown): data is UserCreateRequest {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.email === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.password === 'string' &&
    obj.email.includes('@') &&
    obj.username.length >= 3 &&
    obj.password.length >= 8
  );
}

export function validatePostCreate(data: unknown): data is PostCreateRequest {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.title === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.slug === 'string' &&
    obj.title.length > 0 &&
    obj.content.length > 0 &&
    /^[a-z0-9-]+$/.test(obj.slug)
  );
}
