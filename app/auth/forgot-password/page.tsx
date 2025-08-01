'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const res = await response.json();
      if (response.ok && res.success) {
        setMessage(res.message || 'パスワードリセットメールを送信しました');
        if (res.resetLink) {
          setResetLink(res.resetLink);
        }
      } else {
        setError(res.error || 'パスワードリセット要求に失敗しました');
      }
    } catch (error) {
      console.error('パスワードリセット要求エラー:', error);
      setError('パスワードリセット要求に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-center">パスワードを忘れた場合</h1>
      
      {message ? (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
          
          {resetLink && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <p className="font-semibold mb-2">開発環境用リセットリンク:</p>
              <Link 
                href={resetLink} 
                className="text-blue-600 hover:underline break-all"
              >
                {resetLink}
              </Link>
            </div>
          )}
          
          <div className="text-center">
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              ログインページに戻る
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-gray-600 mb-4">
            登録されているメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block mb-2">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
              placeholder="example@email.com"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? '送信中...' : 'リセットリンクを送信'}
          </button>
        </form>
      )}
      
      <div className="mt-6 text-center space-y-2">
        <Link href="/auth/login" className="block text-blue-500 hover:underline">
          ログインページに戻る
        </Link>
        <Link href="/auth/register" className="block text-blue-500 hover:underline">
          新規アカウント作成
        </Link>
      </div>
    </div>
  );
}
