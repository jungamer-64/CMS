"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminLayout from '@/app/lib/AdminLayout';

export default function WebhookNewPage() {
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("post_created");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) {
      setError("Webhook URLを入力してください");
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
        router.push("/admin/webhooks");
      } else {
        setError("Webhookの発行に失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Webhook新規発行">
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg p-6 text-white mb-6">
          <h1 className="text-2xl font-bold mb-2">Webhook新規発行</h1>
          <p className="text-slate-100">外部サービス連携用のWebhookを発行します。</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={e => setEvent(e.target.value)}
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
                有効
              </label>
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <div className="flex space-x-4 justify-end">
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-gray-800"
                onClick={() => router.push("/admin/webhooks")}
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
      </div>
    </AdminLayout>
  );
}
