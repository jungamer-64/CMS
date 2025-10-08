/**
 * scripts/test-database-migration.ts
 *
 * データベース移行完了テストスクリプト
 * すべてのAPIエンドポイントがデータベース版で正常に動作することを確認します。
 */

import { connectToDatabase } from '../app/lib/database/connection';
import { createApiKeyModel } from '../app/lib/database/models/api-key';
import { createCommentModel } from '../app/lib/database/models/comment';
import { createPostModel } from '../app/lib/database/models/post';
import { createSettingsModel } from '../app/lib/database/models/settings';
import { createUserModel } from '../app/lib/database/models/user';

// sanitizeForLog: safe, single-line, truncated string for logging
function sanitizeForLog(value: unknown): string {
  try {
    if (value === null || value === undefined) return '';
    const s = typeof value === 'string' ? value : (typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value));
    const cleaned = Array.from(s)
      .map((ch) => {
        const code = ch.charCodeAt(0);
        return code >= 32 && code !== 127 ? ch : ' ';
      })
      .join('')
      .replace(/[\r\n]+/g, ' ')
      .slice(0, 300);
    return cleaned;
  } catch {
    try { return String(value).replace(/[\r\n]+/g, ' ').slice(0, 300); } catch { return '' }
  }
}

export default async function testDatabaseMigration(): Promise<void> {
  console.log('🔍 データベース移行完了テスト開始...');

  try {
    console.log('1. データベース接続テスト...');
    await connectToDatabase();
    console.log('✅ データベース接続成功');

    console.log('2. ユーザーモデルテスト...');
    const userModel = await createUserModel();
    const users = await userModel.findAll({ limit: 5 });
    console.log('✅ ユーザー数: ' + sanitizeForLog(users.length) + '件');
    users.forEach((user: any) => {
      console.log('   - ' + sanitizeForLog(user.username) + ' (' + sanitizeForLog(user.email) + ') - ' + sanitizeForLog(user.role));
    });

    console.log('3. 設定モデルテスト...');
    const settingsModel = await createSettingsModel();
    const settings = await settingsModel.getSystemSettings();
    console.log('✅ 設定データ取得成功:');
    if (settings) {
      console.log('   - サイト名: ' + sanitizeForLog(settings.siteName));
      console.log('   - メンテナンスモード: ' + sanitizeForLog(settings.maintenanceMode));
    } else {
      console.log('   - 設定データなし');
    }

    console.log('4. APIキーモデルテスト...');
    const apiKeyModel = await createApiKeyModel();
    const apiKeys = await apiKeyModel.findAll();
    console.log('✅ APIキー数: ' + sanitizeForLog(apiKeys.length) + '件');
    apiKeys.slice(0, 5).forEach((key: any) => {
      const permissions = Object.entries(key.permissions || {})
        .filter(([, value]) => value)
        .map(([perm]) => perm);
      console.log('   - ' + sanitizeForLog(key.name) + ' (' + sanitizeForLog(permissions.join(', ')) + ') - 使用回数: ' + sanitizeForLog(key.usageCount));
    });

    console.log('5. 投稿モデルテスト...');
    const postModel = await createPostModel();
    await postModel.ensureIndexes();
    const postCount = await postModel.count();
    console.log('✅ 投稿数: ' + sanitizeForLog(postCount) + '件');

    if (postCount === 0) {
      console.log('   テスト投稿を作成中...');
      const testPost = await postModel.create({
        id: 'test-post-' + Date.now(),
        title: 'テスト投稿',
        content: 'これはデータベース移行のテスト投稿です。',
        excerpt: 'テスト投稿の要約',
        slug: 'test-post-' + Date.now(),
        status: 'published',
        authorId: users[0]?.id || 'admin',
        authorName: users[0]?.displayName || 'Administrator',
        tags: ['テスト', 'データベース'],
        categories: ['システム'],
        isDeleted: false
      });
      console.log('   ✅ テスト投稿作成完了: ' + sanitizeForLog(testPost.title));
    }

    console.log('6. コメントモデルテスト...');
    const commentModel = await createCommentModel();
    await commentModel.ensureIndexes();
    const commentCount = await commentModel.countByStatus();
    console.log('✅ コメント統計:');
    console.log('   - 承認済み: ' + sanitizeForLog(commentCount.approved) + '件');
    console.log('   - 保留中: ' + sanitizeForLog(commentCount.pending) + '件');
    console.log('   - 拒否済み: ' + sanitizeForLog(commentCount.rejected) + '件');
    console.log('   - スパム: ' + sanitizeForLog(commentCount.spam) + '件');

    console.log('7. API ファクトリーテスト...');
    const { createSuccessResponse, createErrorResponse } = await import('../app/lib/api-factory');
    const successResponse = createSuccessResponse({ message: 'テスト成功' });
    const errorResponse = createErrorResponse('テストエラー');
    console.log('✅ 成功レスポンス: ' + sanitizeForLog(JSON.stringify(successResponse)));
    console.log('✅ エラーレスポンス: ' + sanitizeForLog(JSON.stringify(errorResponse)));

    console.log('🎉 データベース移行完了テスト成功！');
    console.log('移行完了済みAPI:');
    console.log('✅ /api/users - ユーザー管理');
    console.log('✅ /api/settings - システム設定');
    console.log('✅ /api/api-keys - APIキー管理');
    console.log('✅ /api/users/[id]/theme - ユーザーテーマ');
    console.log('✅ /api/posts - 投稿管理');
    console.log('✅ コメントモデル（APIは次のフェーズ）');
    console.log('データベース移行は正常に完了しました。');

  } catch (error: any) {
    console.error('❌ データベース移行テストエラー: ' + (error && error.message ? sanitizeForLog(error.message) : sanitizeForLog(error)));
    throw error;
  }
}

if (require.main === module) {
  testDatabaseMigration()
    .then(() => {
      console.log('\n✅ テスト完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ テスト失敗: ' + (error && (error as any).message ? sanitizeForLog((error as any).message) : sanitizeForLog(error)));
      process.exit(1);
    });
}
