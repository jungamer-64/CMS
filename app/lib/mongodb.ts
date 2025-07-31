import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

if (!uri) {
  throw new Error('MONGODB_URI環境変数が設定されていません');
}

if (!dbName) {
  throw new Error('MONGODB_DB環境変数が設定されていません');
}

let client: MongoClient;
const clientPromise: Promise<MongoClient> = (() => {
  if (process.env.NODE_ENV === 'development') {
    // 開発環境では、ホットリロード時にクライアントを再利用
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    // 本番環境では新しいクライアントを作成
    client = new MongoClient(uri);
    return client.connect();
  }
})();

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  COMMENTS: 'comments',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  API_KEYS: 'api_keys'
} as const;

export default clientPromise;
