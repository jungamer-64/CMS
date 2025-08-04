"use client";

import { useEffect, useState } from "react";
import AdminLayout from '@/app/lib/ui/components/layouts/AdminLayout';
import type { Webhook } from '../admin-types';

export default function WebhookAdminPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [url, setUrl] = useState<string>("");
  const [event, setEvent] = useState<Webhook["event"]>("post_created");
  const [enabled, setEnabled] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/webhooks")
      .then((res) => res.json())
      .then((data) => setWebhooks(data.webhooks || []))
      .catch(() => setError("Webhookの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("本当に削除しますか？")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError("");
    if (!url.trim()) {
      setFormError("Webhook URLを入力してください");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, event, enabled }),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setUrl("");
        setEvent("post_created");
        setEnabled(true);
        // 最新一覧取得
        fetch("/api/webhooks")
          .then((res) => res.json())
          .then((data) => setWebhooks(data.webhooks || []));
      } else {
        setFormError("Webhookの発行に失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Webhook管理">
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Webhook管理</h1>
          <button
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            onClick={() => setShowCreateForm(true)}
          >Webhookを新規発行</button>
        </div>
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Webhook URL <span className="text-red-500">*</span></label>
                <input
                  type="url"
                  id="webhookUrl"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  required
                  placeholder="https://example.com/webhook"
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="webhookEvent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">イベント種別</label>
                <select
                  id="webhookEvent"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={event}
                  onChange={e => setEvent(e.target.value as Webhook["event"])}
                  disabled={submitting}
                >
                  <option value="post_created">投稿作成</option>
                  <option value="post_updated">投稿更新</option>
                  <option value="comment_created">コメント作成</option>
                </select>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                    className="mr-2"
                    disabled={submitting}
                  />
                  <span>有効</span>
                </label>
              </div>
              {formError && <div className="text-red-500 text-sm text-center">{formError}</div>}
              <div className="flex space-x-4 justify-end">
                <button
                  type="button"
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-gray-800"
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                >キャンセル</button>
                <button
                  type="submit"
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={submitting}
                >{submitting ? '発行中...' : '発行'}</button>
              </div>
            </form>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {(() => {
            if (loading) {
              return <div className="text-center text-gray-500 dark:text-gray-400">読み込み中...</div>;
            } else if (error) {
              return <div className="text-center text-red-500">{error}</div>;
            } else if (webhooks.length === 0) {
              return <div className="text-center text-gray-500 dark:text-gray-400">Webhookはまだ登録されていません</div>;
            } else {
              return (
                <div className="overflow-x-auto">
                  <table className="w-full border rounded-lg overflow-hidden">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">URL</th>
                        <th className="px-4 py-2 text-left">イベント</th>
                        <th className="px-4 py-2 text-center">有効</th>
                        <th className="px-4 py-2 text-center">作成日</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhooks.map((w) => (
                        <tr key={w.id} className="border-t">
                          <td className="break-all px-4 py-2">{w.url}</td>
                          <td className="px-4 py-2">{w.event}</td>
                          <td className="px-4 py-2 text-center">{w.enabled ? "○" : "×"}</td>
                          <td className="px-4 py-2 text-center">{new Date(w.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              className="text-red-500 hover:underline"
                              onClick={() => handleDelete(w.id)}
                            >削除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </AdminLayout>
  );
}
