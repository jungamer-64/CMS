import { MongoClient, Db } from 'mongodb';

// ============================================================================
// MongoDB接続管理（統一パターン）
// ============================================================================

interface ConnectionState {
  client: MongoClient | null;
  db: Db | null;
  isConnected: boolean;
  lastConnected: Date | null;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: ConnectionState = {
    client: null,
    db: null,
    isConnected: false,
    lastConnected: null
  };

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<Db> {
    if (this.connection.isConnected && this.connection.db) {
      return this.connection.db;
    }

    try {
      const uri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || 'test-website';

      if (!uri) {
        throw new Error('MONGODB_URI環境変数が設定されていません');
      }

      console.log('🔌 MongoDBに接続中...');
      
      this.connection.client = new MongoClient(uri);
      await this.connection.client.connect();
      this.connection.db = this.connection.client.db(dbName);
      this.connection.isConnected = true;
      this.connection.lastConnected = new Date();

      console.log(`✅ MongoDB接続成功: ${dbName}`);
      return this.connection.db;
      
    } catch (error) {
      console.error('❌ MongoDB接続エラー:', error);
      throw new Error(`データベース接続に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection.client) {
      await this.connection.client.close();
      this.connection = {
        client: null,
        db: null,
        isConnected: false,
        lastConnected: null
      };
      console.log('🔌 MongoDB接続を切断しました');
    }
  }

  getDb(): Db {
    if (!this.connection.isConnected || !this.connection.db) {
      throw new Error('データベースに接続されていません');
    }
    return this.connection.db;
  }

  isConnected(): boolean {
    return this.connection.isConnected;
  }

  getConnectionInfo() {
    return {
      isConnected: this.connection.isConnected,
      lastConnected: this.connection.lastConnected,
      dbName: this.connection.db?.databaseName
    };
  }
}

// シングルトンインスタンス
export const dbManager = DatabaseManager.getInstance();

// 便利な関数
export const connectToDatabase = () => dbManager.connect();
export const getDatabase = () => dbManager.getDb();
export const disconnectFromDatabase = () => dbManager.disconnect();

export default dbManager;
