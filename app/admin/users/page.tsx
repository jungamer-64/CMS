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

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        console.error('ユーザーデータ取得失敗:', response.status, errorData);
        setError(`ユーザーデータ取得エラー: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('ユーザーデータ取得例外:', error);
      setError('ユーザーデータの取得中にエラーが発生しました');
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

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('ロール変更エラー:', error);
      alert('ロール変更に失敗しました');
    }
  };

  if (isLoading || !user) {
    return (
      <AdminLayout title="ユーザー管理">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ユーザー管理">
      <div className="space-y-6">
        <div>
          <h1>ユーザー管理</h1>
          <p className="text-gray-600">システムに登録されているユーザーの管理</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">総ユーザー数</h3>
            <p className="text-2xl font-bold text-blue-900">
              {users.length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">管理者</h3>
            <p className="text-2xl font-bold text-green-900">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-800">一般ユーザー</h3>
            <p className="text-2xl font-bold text-gray-900">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              ユーザー一覧
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              ユーザーの詳細情報と権限管理
            </p>
          </div>
          {users.length === 0 ? (
            <p className="p-4 text-gray-500">ユーザーがいません</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((userData) => (
                <li key={userData.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {userData.displayName}
                        </h3>
                        <span className="ml-2 text-sm text-gray-500">
                          (@{userData.username})
                        </span>
                        {userData.role === 'admin' && (
                          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            管理者
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <p>メール: {userData.email}</p>
                        <p>登録日: {new Date(userData.createdAt).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {userData.role === 'user' ? (
                        <button
                          onClick={() => handleRoleChange(userData.id, 'admin')}
                          className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          管理者にする
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(userData.id, 'user')}
                          className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          一般ユーザーにする
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
