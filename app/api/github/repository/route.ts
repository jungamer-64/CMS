/**
 * GitHub API エンドポイント
 * リポジトリ情報、コミット履歴、ファイル操作などのAPIを提供
 */

import { NextRequest } from 'next/server';
import { getGitHubClient, GitHubApiError } from '../../../lib/github';
import { createApiSuccess, createApiError } from '../../../lib/api-types';

// GitHub関連の型定義
interface GitHubFileContent {
  path: string;
  content: string;
  message: string;
  branch?: string;
  sha?: string;
}

interface GitHubFileDelete {
  path: string;
  message: string;
  sha: string;
  branch?: string;
}

/**
 * GET /api/github/repository
 * リポジトリ情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const client = getGitHubClient();

    switch (action) {
      case 'info': {
        // リポジトリ基本情報
        const repoInfo = await client.getRepository();
        return Response.json(createApiSuccess({
          name: repoInfo.name,
          fullName: repoInfo.full_name,
          description: repoInfo.description,
          isPrivate: repoInfo.private,
          htmlUrl: repoInfo.html_url,
          defaultBranch: repoInfo.default_branch,
          createdAt: repoInfo.created_at,
          updatedAt: repoInfo.updated_at,
          pushedAt: repoInfo.pushed_at,
        }));
      }

      case 'branches': {
        // ブランチ一覧
        const branches = await client.getBranches();
        return Response.json(createApiSuccess(branches.map(branch => ({
          name: branch.name,
          sha: branch.commit.sha,
          protected: branch.protected,
        }))));
      }

      case 'commits': {
        // コミット履歴
        const branch = searchParams.get('branch') || 'master';
        const perPage = parseInt(searchParams.get('per_page') || '10', 10);
        const commits = await client.getCommits(branch, perPage);
        
        return Response.json(createApiSuccess(commits.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: {
            name: commit.commit.author.name,
            email: commit.commit.author.email,
            date: commit.commit.author.date,
          },
          htmlUrl: commit.html_url,
        }))));
      }

      case 'content': {
        // ファイル/ディレクトリ内容
        const path = searchParams.get('path') || '';
        const contentBranch = searchParams.get('branch') || 'master';
        
        try {
          const content = await client.getFileContent(path, contentBranch);
          
          if (content.type === 'file') {
            // ファイルの場合、内容をデコード
            const fileContent = content.content 
              ? Buffer.from(content.content, 'base64').toString('utf-8')
              : '';
            
            return Response.json(createApiSuccess({
              type: 'file' as const,
              name: content.name,
              path: content.path,
              size: content.size,
              content: fileContent,
              sha: content.sha,
              htmlUrl: content.html_url,
            }));
          } else {
            // ディレクトリの場合は内容一覧を取得
            const dirContent = await client.getDirectoryContent(path, contentBranch);
            return Response.json(createApiSuccess({
              type: 'directory' as const,
              path: path,
              contents: dirContent.map(item => ({
                name: item.name,
                path: item.path,
                type: item.type,
                size: item.size,
                sha: item.sha,
                htmlUrl: item.html_url,
              })),
            }));
          }
        } catch (error) {
          if (error instanceof GitHubApiError && error.status === 404) {
            return Response.json(createApiError(`パス '${path}' が見つかりません`), { status: 404 });
          }
          throw error;
        }
      }

      case 'auth-status': {
        // 認証状態確認
        const authStatus = await client.checkAuth();
        return Response.json(createApiSuccess(authStatus));
      }

      case 'rate-limit': {
        // レート制限確認
        const rateLimit = await client.getRateLimit();
        return Response.json(createApiSuccess(rateLimit));
      }

      default:
        return Response.json(createApiError('無効なアクションです'), { status: 400 });
    }
  } catch (error) {
    console.error('GitHub API error:', error);
    return Response.json(createApiError('GitHub APIエラーが発生しました'), { status: 500 });
  }
}

/**
 * PUT /api/github/repository
 * ファイルの作成・更新
 */
export async function PUT(request: NextRequest) {
  try {
    const body: GitHubFileContent = await request.json();
    const { path, content, message, branch = 'master', sha } = body;

    if (!path || !content || !message) {
      return Response.json(createApiError('path, content, message は必須項目です'), { status: 400 });
    }

    const client = getGitHubClient();
    const result = await client.createOrUpdateFile(path, content, message, branch, sha);

    return Response.json(createApiSuccess({
      sha: result.commit.sha,
      message: result.commit.message,
      author: result.commit.author,
      htmlUrl: result.commit.html_url,
      content: {
        name: result.content.name,
        path: result.content.path,
        sha: result.content.sha,
        size: result.content.size,
        htmlUrl: result.content.html_url,
      },
    }));
  } catch (error) {
    console.error('GitHub PUT error:', error);
    return Response.json(createApiError('ファイルの作成・更新に失敗しました'), { status: 500 });
  }
}

/**
 * DELETE /api/github/repository
 * ファイルの削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const body: GitHubFileDelete = await request.json();
    const { path, message, sha, branch = 'master' } = body;

    if (!path || !message || !sha) {
      return Response.json(createApiError('path, message, sha は必須項目です'), { status: 400 });
    }

    const client = getGitHubClient();
    const result = await client.deleteFile(path, message, sha, branch);

    return Response.json(createApiSuccess({
      sha: result.commit.sha,
      message: result.commit.message,
      author: result.commit.author,
      htmlUrl: result.commit.html_url,
    }));
  } catch (error) {
    console.error('GitHub DELETE error:', error);
    return Response.json(createApiError('ファイルの削除に失敗しました'), { status: 500 });
  }
}
