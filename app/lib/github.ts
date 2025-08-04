/**
 * GitHub統合互換性ファイル
 * 
 * 既存のコンポーネントが参照しているGitHub関連の関数を提供し、
 * 新しいGitHubクライアントシステムへのブリッジとして機能します。
 */

// 新しいGitHubクライアントシステムから再エクスポート
export {
  GitHubClient,
  type GitHubRepository,
  type GitHubUser,
  type GitHubWebhookPayload
} from './api/integrations/github-client';

// ============================================================================
// 互換性のためのGitHub API関数
// ============================================================================

import { GitHubClient, type GitHubWebhookPayload } from './api/integrations/github-client';
import { env } from './core/config/environment';

/**
 * デフォルトGitHubクライアントインスタンス
 */
const githubClient = new GitHubClient({
  clientId: env.GITHUB_CLIENT_ID || '',
  clientSecret: env.GITHUB_CLIENT_SECRET || '',
  webhookSecret: env.GITHUB_WEBHOOK_SECRET || ''
});

/**
 * GitHubユーザー情報の取得（互換性のため）
 */
export async function getGitHubUser(accessToken: string) {
  return githubClient.getUser(accessToken);
}

/**
 * GitHubリポジトリ一覧の取得（互換性のため）
 */
export async function getGitHubRepositories(accessToken: string) {
  return githubClient.getRepositories(accessToken);
}

/**
 * GitHubリポジトリの詳細情報取得（互換性のため）
 */
export async function getGitHubRepository(accessToken: string, owner: string, repo: string) {
  return githubClient.getRepository(accessToken, owner, repo);
}

/**
 * GitHub Webhookの検証（互換性のため）
 */
export function verifyGitHubWebhook(payload: string, signature: string): boolean {
  return githubClient.verifyWebhook(payload, signature);
}

/**
 * GitHub Webhookペイロードの処理（互換性のため）
 */
export async function processGitHubWebhook(payload: GitHubWebhookPayload) {
  return githubClient.processWebhook(payload);
}

// ============================================================================
// 互換性のためのヘルパー関数
// ============================================================================

/**
 * GitHubのOAuth URLを生成（互換性のため）
 */
export function getGitHubOAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: 'user:email,repo',
    ...(state && { state })
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * GitHubアクセストークンの交換（互換性のため）
 */
export async function exchangeGitHubCode(code: string, redirectUri: string) {
  return githubClient.exchangeCodeForToken(code, redirectUri);
}

/**
 * GitHub APIエラーのハンドリング（互換性のため）
 */
export function handleGitHubError(error: unknown): { message: string; status?: number } {
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const errorWithStatus = error as { status: number; message?: string };
    return {
      message: errorWithStatus.message || 'GitHub API error',
      status: errorWithStatus.status
    };
  }
  
  return { message: 'Unknown GitHub error' };
}

/**
 * デフォルトエクスポート（互換性のため）
 */
export default githubClient;
