/**
 * GitHub API クライアント
 * Fine-grained Personal Access Token を使用したGitHub APIとの連携
 */

import { env } from './env';

// GitHub API のレスポンス型定義
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
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

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubFileCreateResponse {
  content: GitHubContent;
  commit: {
    sha: string;
    node_id: string;
    url: string;
    html_url: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
}

export interface GitHubRateLimit {
  resources: {
    core: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
    graphql: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
  };
  rate: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

export class GitHubClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly owner: string;
  private readonly repo: string;

  constructor() {
    if (!env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN環境変数が設定されていません');
    }

    this.baseUrl = env.GITHUB_API_URL;
    this.token = env.GITHUB_TOKEN;
    this.owner = env.GITHUB_OWNER;
    this.repo = env.GITHUB_REPO;
  }

  /**
   * GitHub API リクエストのヘッダーを生成
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
  }

  /**
   * GitHub API リクエストを実行
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `GitHub API エラー: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch {
        errorMessage += ` - ${errorText}`;
      }

      throw new GitHubApiError(errorMessage, response.status, errorText);
    }

    return response.json();
  }

  /**
   * リポジトリ情報を取得
   */
  async getRepository(): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(`/repos/${this.owner}/${this.repo}`);
  }

  /**
   * ブランチ一覧を取得
   */
  async getBranches(): Promise<GitHubBranch[]> {
    return this.request<GitHubBranch[]>(`/repos/${this.owner}/${this.repo}/branches`);
  }

  /**
   * 最新のコミット一覧を取得
   */
  async getCommits(branch = 'master', per_page = 10): Promise<GitHubCommit[]> {
    const params = new URLSearchParams({
      sha: branch,
      per_page: per_page.toString(),
    });
    
    return this.request<GitHubCommit[]>(
      `/repos/${this.owner}/${this.repo}/commits?${params}`
    );
  }

  /**
   * ファイル内容を取得
   */
  async getFileContent(path: string, branch = 'master'): Promise<GitHubContent> {
    const params = new URLSearchParams({ ref: branch });
    
    return this.request<GitHubContent>(
      `/repos/${this.owner}/${this.repo}/contents/${path}?${params}`
    );
  }

  /**
   * ディレクトリ内容を取得
   */
  async getDirectoryContent(path = '', branch = 'master'): Promise<GitHubContent[]> {
    const params = new URLSearchParams({ ref: branch });
    
    return this.request<GitHubContent[]>(
      `/repos/${this.owner}/${this.repo}/contents/${path}?${params}`
    );
  }

  /**
   * ファイルを作成または更新
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch = 'master',
    sha?: string
  ): Promise<GitHubFileCreateResponse> {
    const body = {
      message,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch,
      ...(sha && { sha }),
    };

    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * ファイルを削除
   */
  async deleteFile(
    path: string,
    message: string,
    sha: string,
    branch = 'master'
  ): Promise<GitHubFileCreateResponse> {
    const body = {
      message,
      sha,
      branch,
    };

    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify(body),
    });
  }

  /**
   * 認証状態を確認
   */
  async checkAuth(): Promise<{ authenticated: boolean; scopes: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const scopes = response.headers.get('X-OAuth-Scopes') || '';
        return {
          authenticated: true,
          scopes: scopes.split(',').map(s => s.trim()).filter(Boolean),
        };
      } else {
        return { authenticated: false, scopes: [] };
      }
    } catch (error) {
      console.error('GitHub auth check failed:', error);
      return { authenticated: false, scopes: [] };
    }
  }

  /**
   * レート制限情報を取得
   */
  async getRateLimit(): Promise<GitHubRateLimit> {
    return this.request('/rate_limit');
  }
}

// シングルトンインスタンス
let githubClient: GitHubClient | null = null;

/**
 * GitHub クライアントのインスタンスを取得
 */
export function getGitHubClient(): GitHubClient {
  githubClient ??= new GitHubClient();
  return githubClient;
}

/**
 * GitHub token の有効性を検証
 */
export async function validateGitHubToken(): Promise<boolean> {
  try {
    const client = getGitHubClient();
    const auth = await client.checkAuth();
    return auth.authenticated;
  } catch (error) {
    console.error('GitHub token validation failed:', error);
    return false;
  }
}
