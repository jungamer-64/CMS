import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserById } from './users';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    const user = await getUserById(decoded.userId);

    return user;
  } catch (error) {
    console.error('認証エラー:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('認証が必要です');
  }
  return user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request);
  if (user.role !== 'admin') {
    throw new Error('管理者権限が必要です');
  }
  return user;
}
