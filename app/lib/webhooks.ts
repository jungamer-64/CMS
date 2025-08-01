export interface Webhook {
  id: string;
  url: string;
  event: 'post_created' | 'post_updated' | 'comment_created';
  enabled: boolean;
  createdAt: string;
}

// グローバルなwebhooks配列
const webhooksStore: Webhook[] = [];

// webhoosアクセス関数
export function getWebhooks(): Webhook[] {
  return webhooksStore;
}

export function addWebhook(webhook: Webhook): void {
  webhooksStore.push(webhook);
}

export function removeWebhook(id: string): boolean {
  const index = webhooksStore.findIndex(w => w.id === id);
  if (index !== -1) {
    webhooksStore.splice(index, 1);
    return true;
  }
  return false;
}
