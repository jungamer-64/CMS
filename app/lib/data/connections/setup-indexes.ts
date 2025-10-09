/**
 * データベースインデックス設定
 * LIB_COMMONIZATION_PLAN.md フェーズ5対応
 *
 * 既存のsetup-indexes.tsから移行・拡張
 */

import type { CreateIndexesOptions } from 'mongodb';
import { COLLECTIONS, getDatabase } from './mongodb';

// インデックス定義型
interface IndexDefinition {
  collection: string;
  indexes: Array<{
    key: Record<string, 1 | -1 | 'text'>;
    options?: CreateIndexesOptions;
  }>;
}

// インデックス設定
const INDEX_DEFINITIONS: IndexDefinition[] = [
  // ユーザーコレクション
  {
    collection: COLLECTIONS.USERS,
    indexes: [
      {
        key: { username: 1 },
        options: { unique: true, name: 'username_unique' }
      },
      {
        key: { email: 1 },
        options: { unique: true, name: 'email_unique' }
      },
      {
        key: { id: 1 },
        options: { unique: true, name: 'id_unique' }
      },
      {
        key: { role: 1 },
        options: { name: 'role_index' }
      },
      {
        key: { createdAt: -1 },
        options: { name: 'created_at_desc' }
      },
      {
        key: { isActive: 1 },
        options: { name: 'is_active_index' }
      }
    ]
  },

  // 投稿コレクション
  {
    collection: COLLECTIONS.POSTS,
    indexes: [
      {
        key: { slug: 1 },
        options: { unique: true, name: 'slug_unique' }
      },
      {
        key: { id: 1 },
        options: { unique: true, name: 'id_unique' }
      },
      {
        key: { author: 1 },
        options: { name: 'author_index' }
      },
      {
        key: { createdAt: -1 },
        options: { name: 'created_at_desc' }
      },
      {
        key: { updatedAt: -1 },
        options: { name: 'updated_at_desc' }
      },
      {
        key: { isDeleted: 1 },
        options: { name: 'is_deleted_index' }
      },
      {
        key: { title: 'text', content: 'text' },
        options: {
          name: 'title_content_text',
          weights: { title: 10, content: 1 }
        }
      },
      {
        key: { 'media': 1 },
        options: { name: 'media_index', sparse: true }
      }
    ]
  },

  // コメントコレクション
  {
    collection: COLLECTIONS.COMMENTS,
    indexes: [
      {
        key: { id: 1 },
        options: { unique: true, name: 'id_unique' }
      },
      {
        key: { postSlug: 1 },
        options: { name: 'post_slug_index' }
      },
      {
        key: { authorEmail: 1 },
        options: { name: 'author_email_index' }
      },
      {
        key: { createdAt: -1 },
        options: { name: 'created_at_desc' }
      },
      {
        key: { isDeleted: 1 },
        options: { name: 'is_deleted_index' }
      },
      {
        key: { postSlug: 1, createdAt: 1 },
        options: { name: 'post_slug_created_at' }
      }
    ]
  },

  // APIキーコレクション
  {
    collection: COLLECTIONS.API_KEYS,
    indexes: [
      {
        key: { id: 1 },
        options: { unique: true, name: 'id_unique' }
      },
      {
        key: { keyId: 1 },
        options: { unique: true, name: 'key_id_unique' }
      },
      {
        key: { userId: 1 },
        options: { name: 'user_id_index' }
      },
      {
        key: { isActive: 1 },
        options: { name: 'is_active_index' }
      },
      {
        key: { expiresAt: 1 },
        options: {
          name: 'expires_at_index',
          expireAfterSeconds: 0 // TTLインデックス
        }
      }
    ]
  },

  // パスワードリセットトークンコレクション
  {
    collection: COLLECTIONS.PASSWORD_RESET_TOKENS,
    indexes: [
      {
        key: { token: 1 },
        options: { unique: true, name: 'token_unique' }
      },
      {
        key: { email: 1 },
        options: { name: 'email_index' }
      },
      {
        key: { expiresAt: 1 },
        options: {
          name: 'expires_at_ttl',
          expireAfterSeconds: 0 // TTLインデックス
        }
      }
    ]
  }
];

// 単一インデックスの作成
async function createIndexForCollection(definition: IndexDefinition): Promise<void> {
  try {
    const db = await getDatabase();
    const collection = db.collection(definition.collection);

    for (const index of definition.indexes) {
      try {
        await collection.createIndex(index.key, index.options);
        console.log(`✅ Created index ${index.options?.name || 'unnamed'} for ${definition.collection}`);
      } catch (err: unknown) {
        // インデックスが既に存在する場合のエラーを無視
        if (err instanceof Error && err.message.includes('already exists')) {
          console.log(`ℹ️  Index ${index.options?.name || 'unnamed'} already exists for ${definition.collection}`);
        } else {
          console.error('❌ Failed to create index %s for %s:', index.options?.name || 'unnamed', definition.collection, err instanceof Error ? err : String(err));
          throw err;
        }
      }
    }
  } catch (err: unknown) {
    console.error('❌ Failed to setup indexes for %s:', definition.collection, err instanceof Error ? err : String(err));
    throw err;
  }
}

// 全インデックスの作成
export async function setupAllIndexes(): Promise<void> {
  console.log('🔧 Setting up database indexes...');

  try {
    await Promise.all(
      INDEX_DEFINITIONS.map(definition => createIndexForCollection(definition))
    );
    console.log('✅ All database indexes have been set up successfully');
  } catch (err: unknown) {
    console.error('❌ Failed to setup database indexes:', err instanceof Error ? err : String(err));
    throw err;
  }
}

// 特定コレクションのインデックス作成
export async function setupIndexesForCollection(collectionName: string): Promise<void> {
  const definition = INDEX_DEFINITIONS.find(def => def.collection === collectionName);

  if (!definition) {
    throw new Error(`No index definition found for collection: ${collectionName}`);
  }

  await createIndexForCollection(definition);
}

// インデックス情報の取得
export async function getIndexInfo(collectionName?: string) {
  try {
    const db = await getDatabase();

    if (collectionName) {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      return {
        success: true,
        data: { [collectionName]: indexes }
      };
    } else {
      const collections = Object.values(COLLECTIONS);
      const indexInfo: Record<string, unknown[]> = {};

      for (const collName of collections) {
        try {
          const collection = db.collection(collName);
          indexInfo[collName] = await collection.indexes();
        } catch {
          indexInfo[collName] = [];
        }
      }

      return {
        success: true,
        data: indexInfo
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get index information'
    };
  }
}

// インデックスの削除（開発用）
export async function dropAllIndexes(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot drop indexes in production environment');
  }

  console.log('🗑️  Dropping all custom indexes...');

  try {
    const db = await getDatabase();
    const collections = Object.values(COLLECTIONS);

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        await collection.dropIndexes();
        console.log(`✅ Dropped indexes for ${collectionName}`);
      } catch {
        console.log(`ℹ️  No indexes to drop for ${collectionName}`);
      }
    }

    console.log('✅ All custom indexes have been dropped');
  } catch (err: unknown) {
    console.error('❌ Failed to drop indexes:', err instanceof Error ? err : String(err));
    throw err;
  }
}
