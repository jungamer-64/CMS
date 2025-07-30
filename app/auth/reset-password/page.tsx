'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('無効なリセットリンクです');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('トークンが見つかりません');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(data.error || 'パスワードリセットに失敗しました');
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      setError('パスワードリセットに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (message) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
          <h2 className="text-xl font-bold mb-2">パスワードリセット完了！</h2>
          <p>{message}</p>
          <p className="mt-2">ログインページに移動します...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-center">パスワードリセット</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="password" className="block mb-2">新しいパスワード</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={6}
            disabled={isSubmitting}
          />
          <p className="text-sm text-gray-600 mt-1">6文字以上で入力してください</p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block mb-2">パスワード確認</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={6}
            disabled={isSubmitting}
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isSubmitting || !token}
        >
          {isSubmitting ? 'リセット中...' : 'パスワードをリセット'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <Link href="/auth/login" className="text-blue-500 hover:underline">
          ログインページに戻る
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">読み込み中...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
