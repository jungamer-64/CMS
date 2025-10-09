'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdvancedI18n } from '@/app/lib/contexts/advanced-i18n-context';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { t } = useAdvancedI18n();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, displayName }),
      });
      const res = await response.json();
      if (response.ok && res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(res.error || t('errors.registrationFailed'));
      }
    } catch (err: unknown) {
      console.error('Registration error:', err instanceof Error ? err : String(err));
      setError(t('errors.registrationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
          <h2 className="text-xl font-bold mb-2">{t('auth.register.registrationComplete')}</h2>
          <p>{t('auth.register.redirectingToLogin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-center">{t('auth.register.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="username" className="block mb-2">{t('auth.register.username')}</label>
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
          <label htmlFor="email" className="block mb-2">{t('auth.register.email')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="displayName" className="block mb-2">{t('auth.register.displayName')}</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2">{t('auth.register.password')}</label>
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
          <p className="text-sm text-gray-600 mt-1">{t('auth.register.passwordRequirement')}</p>
        </div>
        <button 
          type="submit" 
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('auth.register.registering') : t('auth.register.register')}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link href="/auth/login" className="text-blue-500 hover:underline">
          {t('auth.register.hasAccount')}
        </Link>
      </div>
    </div>
  );
}
