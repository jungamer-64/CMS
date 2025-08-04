/**
 * GitHub統合クライアント
 * LIB_COMMONIZATION_PLAN.md フェーズ2対応
 */

import crypto from 'crypto';

// ============================================================================
// 型定義
// ============================================================================

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

export interface GitHubWebhookPayload {
  action?: string;
  repository?: GitHubRepository;
  sender?: GitHubUser;
  [key: string]: unknown;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string; };
    message: string;
  };
  html_url: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface GitHubClientConfig {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
}

// ============================================================================
// GitHubクライアント
// ============================================================================

export class GitHubClient {
  private readonly config: GitHubClientConfig;
  private readonly baseUrl = 'https://api.github.com';

  constructor(config: GitHubClientConfig) {
    this.config = config;
  }

  /**
   * GitHub APIリクエストの実行
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'NextJS-App',
      ...(options.headers as Record<string, string> || {})
    };

    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * ユーザー情報の取得
   */
  async getUser(accessToken: string): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user', {}, accessToken);
  }

  /**
   * リポジトリ一覧の取得
   */
  async getRepositories(accessToken: string): Promise<GitHubRepository[]> {
    return this.makeRequest<GitHubRepository[]>('/user/repos', {}, accessToken);
  }

  /**
   * 特定のリポジトリ情報の取得
   */
  async getRepository(accessToken: string, owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`, {}, accessToken);
  }

  /**
   * コミット一覧の取得
   */
  async getCommits(accessToken: string, owner: string, repo: string): Promise<GitHubCommit[]> {
    return this.makeRequest<GitHubCommit[]>(`/repos/${owner}/${repo}/commits`, {}, accessToken);
  }

  /**
   * ファイル内容の取得
   */
  async getContent(accessToken: string, owner: string, repo: string, path: string): Promise<GitHubContent> {
    return this.makeRequest<GitHubContent>(`/repos/${owner}/${repo}/contents/${path}`, {}, accessToken);
  }

  /**
   * アクセストークンの交換
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; token_type: string; scope: string }> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Webhookの検証
   */
  verifyWebhook(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    const actualSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(actualSignature, 'hex')
    );
  }

  /**
   * Webhookペイロードの処理
   */
  async processWebhook(payload: GitHubWebhookPayload): Promise<{ success: boolean; message: string }> {
    try {
      // ここでWebhookペイロードに基づいて処理を実行
      // 例：プッシュイベント、プルリクエストイベントなど
      
      if (payload.action === 'push') {
        // プッシュイベントの処理
        return { success: true, message: 'Push event processed' };
      }
      
      if (payload.action === 'pull_request') {
        // プルリクエストイベントの処理
        return { success: true, message: 'Pull request event processed' };
      }
      
      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
