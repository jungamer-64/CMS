'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/ui/contexts/auth-context';
import { useAdvancedI18n } from '@/app/lib/contexts/advanced-i18n-context';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useAdvancedI18n();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login({ username, password });
      // ログイン成功後、ユーザー情報が更新されるのを待ってリダイレクト
      router.push('/admin'); // 一旦管理者ダッシュボードに固定
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-center">{t('auth.login.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="username" className="block mb-2">{t('auth.login.username')}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2">{t('auth.login.password')}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('auth.login.signingIn') : t('auth.login.signIn')}
        </button>
      </form>
      <div className="mt-4 text-center space-y-2">
        <Link href="/auth/forgot-password" className="block text-blue-500 hover:underline">
          {t('auth.login.forgotPassword')}
        </Link>
        <Link href="/auth/register" className="block text-blue-500 hover:underline">
          {t('auth.login.noAccount')}
        </Link>
      </div>
    </div>
  );
}
