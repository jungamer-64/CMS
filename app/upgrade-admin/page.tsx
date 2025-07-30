'use client';

import { useState } from 'react';

export default function UpgradeAdmin() {
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/upgrade-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, secret }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`成功: ${data.message}`);
      } else {
        setResult(`エラー: ${data.error}`);
      }
    } catch (error) {
      setResult(`エラー: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">管理者アップグレード</h1>
      
      <form onSubmit={handleUpgrade} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            ユーザー名
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
            シークレットキー
          </label>
          <input
            type="password"
            id="secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="admin-upgrade-secret-123"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? '処理中...' : '管理者にアップグレード'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded-md ${
          result.startsWith('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {result}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>注意:</strong> これは開発用の機能です。</p>
        <p>シークレットキー: <code>admin-upgrade-secret-123</code></p>
      </div>
    </div>
  );
}
