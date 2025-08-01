// 共通型: Webhook
export type WebhookEvent = "post_created" | "post_updated" | "comment_created";
export interface Webhook {
  id: string;
  url: string;
  event: WebhookEvent;
  enabled: boolean;
  createdAt: string;
}


// 共通フォーム状態
export interface FormState {
  submitting: boolean;
  error: string;
}

// 汎用ID型
export type EntityId = string;

// 必要に応じて他のadmin共通型もここに追加できます
