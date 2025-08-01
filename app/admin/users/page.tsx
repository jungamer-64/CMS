
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/lib/auth';
import AdminLayout from '@/app/lib/AdminLayout';
import type { ApiResponse } from '@/app/lib/api-types';
import type { User as UserType } from '@/app/lib/types';

type UserRole = UserType['role'];
type User = Omit<UserType, 'passwordHash' | 'updatedAt' | '_id' | 'darkMode'> & { createdAt: string };




const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500" />
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
    {message}
  </div>
);

const StatsCard = ({ title, value, bgColor, textColor }: {
  title: string;
  value: number;
  bgColor: string;
  textColor: string;
}) => (
  <div className={`${bgColor} dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700`}>
    <h3 className={`text-sm font-medium ${textColor} dark:text-gray-300`}>{title}</h3>
    <p className={`text-2xl font-bold ${textColor} dark:text-white`}>{value}</p>
  </div>
);

const UserCard = ({ user, onRoleChange }: {
  user: User;
  onRoleChange: (userId: string, newRole: UserRole) => void;
}) => (
  <li className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.displayName}</h3>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(@{user.username})</span>
          {user.role === 'admin' && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">管理者</span>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          <p>メール: {user.email}</p>
          <p>登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
          className={user.role === 'admin'
            ? 'bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors'
            : 'bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-colors'}
        >
          {user.role === 'admin' ? '一般ユーザーにする' : '管理者にする'}
        </button>
      </div>
    </div>
  </li>
);

const UsersList = ({ users, onRoleChange }: {
  users: User[];
  onRoleChange: (userId: string, newRole: UserRole) => void;
}) => (
  <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">ユーザー一覧</h3>
      <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">ユーザーの詳細情報と権限管理</p>
    </div>
    {users.length === 0 ? (
      <p className="p-4 text-gray-500 dark:text-gray-400 text-center">ユーザーがいません</p>
    ) : (
      <ul>
        {users.map((user) => (
          <UserCard key={user.id} user={user} onRoleChange={onRoleChange} />
        ))}
      </ul>
    )}
  </div>
);


export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ユーザー一覧取得
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data: ApiResponse<{ users: User[] }> = await response.json();
      if (!response.ok || !data.success || !data.data?.users) {
        const errorMsg = !data.success && 'error' in data ? data.error : 'ユーザーデータの取得に失敗しました';
        throw new Error(errorMsg);
      }
      setUsers(data.data.users);
    } catch (error: unknown) {
      setUsers([]);
      setError(error instanceof Error ? error.message : 'ユーザーデータの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers();
  }, [user?.role, fetchUsers]);

  // 権限変更
  const handleRoleChange = useCallback(
    async (userId: string, newRole: UserRole) => {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role: newRole }),
        });
        const data: ApiResponse<null> = await response.json();
        if (!response.ok || !data.success) {
          const errorMsg = !data.success && 'error' in data ? data.error : 'ロール変更に失敗しました';
          throw new Error(errorMsg);
        }
        await fetchUsers();
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'ロール変更に失敗しました');
      }
    },
    [fetchUsers]
  );

  // 統計値はuseMemoで高速化
  const [adminCount, userCount] = useMemo(() => {
    let admin = 0, userN = 0;
    users.forEach(u => (u.role === 'admin' ? admin++ : userN++));
    return [admin, userN];
  }, [users]);

  if (isLoading || !user) {
    return (
      <AdminLayout title="ユーザー管理">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ユーザー管理">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ユーザー管理</h1>
          <p className="text-gray-600 dark:text-gray-400">システムに登録されているユーザーの管理</p>
        </div>
        {error && <ErrorMessage message={error} />}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="総ユーザー数" value={users.length} bgColor="bg-slate-50" textColor="text-slate-800" />
          <StatsCard title="管理者" value={adminCount} bgColor="bg-green-50" textColor="text-green-800" />
          <StatsCard title="一般ユーザー" value={userCount} bgColor="bg-gray-50" textColor="text-gray-800" />
        </div>
        <UsersList users={users} onRoleChange={handleRoleChange} />
      </div>
    </AdminLayout>
  );
}
