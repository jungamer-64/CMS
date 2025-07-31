'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth';
import AdminLayout from '@/app/lib/AdminLayout';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
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

const UserCard = ({ userData, onRoleChange }: { 
  userData: User; 
  onRoleChange: (userId: string, newRole: string) => void; 
}) => (
  <li className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {userData.displayName}
          </h3>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            (@{userData.username})
          </span>
          {userData.role === 'admin' && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
              管理者
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          <p>メール: {userData.email}</p>
          <p>登録日: {new Date(userData.createdAt).toLocaleDateString('ja-JP')}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        {userData.role === 'user' ? (
          <button
            onClick={() => onRoleChange(userData.id, 'admin')}
            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            管理者にする
          </button>
        ) : (
          <button
            onClick={() => onRoleChange(userData.id, 'user')}
            className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            一般ユーザーにする
          </button>
        )}
      </div>
    </div>
  </li>
);

const UsersList = ({ users, onRoleChange }: { 
  users: User[]; 
  onRoleChange: (userId: string, newRole: string) => void; 
}) => (
  <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
        ユーザー一覧
      </h3>
      <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
        ユーザーの詳細情報と権限管理
      </p>
    </div>
    {users.length === 0 ? (
      <p className="p-4 text-gray-500 dark:text-gray-400 text-center">ユーザーがいません</p>
    ) : (
      <ul>
        {users.map((userData) => (
          <UserCard 
            key={userData.id} 
            userData={userData} 
            onRoleChange={onRoleChange} 
          />
        ))}
      </ul>
    )}
  </div>
);

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザーデータの取得に失敗しました');
      }
      const data = await response.json();
      // 新しいレスポンス形式に対応
      const usersData = data.success ? data.data.users : (data.users || data);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('ユーザーデータ取得エラー:', error);
      setError(error instanceof Error ? error.message : 'ユーザーデータの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'ロール変更に失敗しました');
      }
      
      await fetchUsers();
    } catch (error) {
      console.error('ロール変更エラー:', error);
      alert(error instanceof Error ? error.message : 'ロール変更に失敗しました');
    }
  };

  if (isLoading || !user) {
    return (
      <AdminLayout title="ユーザー管理">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <AdminLayout title="ユーザー管理">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ユーザー管理</h1>
          <p className="text-gray-600 dark:text-gray-400">システムに登録されているユーザーの管理</p>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard 
            title="総ユーザー数" 
            value={users.length} 
            bgColor="bg-slate-50" 
            textColor="text-slate-800" 
          />
          <StatsCard 
            title="管理者" 
            value={adminCount} 
            bgColor="bg-green-50" 
            textColor="text-green-800" 
          />
          <StatsCard 
            title="一般ユーザー" 
            value={userCount} 
            bgColor="bg-gray-50" 
            textColor="text-gray-800" 
          />
        </div>

        <UsersList users={users} onRoleChange={handleRoleChange} />
      </div>
    </AdminLayout>
  );
}
