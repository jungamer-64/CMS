'use client';

import { useAdvancedI18n } from '../lib/contexts/advanced-i18n-context';

export default function About() {
  const { t } = useAdvancedI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* ヘッダーセクション */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-6">
            {t('common.about.pageTitle')}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t('common.about.description')}
          </p>
        </div>

        {/* ミッションセクション */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 mb-12 border border-slate-100 dark:border-slate-700">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {t('common.about.mission.title')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed text-center">
            {t('common.about.mission.content')}
          </p>
        </div>

        {/* 機能セクション */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 mb-12 border border-slate-100 dark:border-slate-700">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            {t('common.about.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {t('common.about.features.modernTech')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Next.js, TypeScript, MongoDB
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {t('common.about.features.responsive')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Tailwind CSS
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {t('common.about.features.multilingual')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                16+ languages
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl">
              <div className="text-3xl mb-4">🌙</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {t('common.about.features.darkMode')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                システム設定対応
              </p>
            </div>
          </div>
        </div>

        {/* 開発チームセクション */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            {t('common.about.team.title')}
          </h2>
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">D</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {t('common.about.team.developer')}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Modern web development enthusiast
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('common.about.team.contact')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}