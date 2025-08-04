#!/usr/bin/env node

/**
 * データベース接続テストスクリプト
 * MongoDB接続と基本操作をテストします
 */

import dotenv from 'dotenv';
import { dbManager, connectToDatabase } from '../app/lib/database/connection.js';
import { createUserModel } from '../app/lib/database/models/user.js';
import { createSettingsModel } from '../app/lib/database/models/settings.js';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🧪 データベース接続テスト開始\n');

  try {
    // 1. データベース接続テスト
    console.log('1️⃣ MongoDB接続テスト...');
    const db = await connectToDatabase();
    console.log(`✅ 接続成功: ${db.databaseName}\n`);

    // 2. ユーザーモデルテスト
    console.log('2️⃣ ユーザーモデルテスト...');
    const userModel = await createUserModel();
    console.log('✅ ユーザーモデル初期化完了\n');

    // 3. 設定モデルテスト
    console.log('3️⃣ 設定モデルテスト...');
    const settingsModel = await createSettingsModel();
    console.log('✅ 設定モデル初期化完了\n');

    // 4. 基本操作テスト
    console.log('4️⃣ 基本操作テスト...');
    
    // 設定の初期化テスト
    const settings = await settingsModel.getSystemSettings();
    if (!settings) {
      console.log('📝 デフォルト設定を作成中...');
      await settingsModel.initializeDefaults('test-admin');
      console.log('✅ デフォルト設定作成完了');
    } else {
      console.log('✅ 既存設定を確認済み');
    }

    // ユーザー数の確認
    const userCount = await userModel.count();
    console.log(`👥 現在のユーザー数: ${userCount}`);

    console.log('\n🎉 全てのテストが成功しました！');
    console.log('\n📊 接続情報:');
    console.log(JSON.stringify(dbManager.getConnectionInfo(), null, 2));

  } catch (error) {
    console.error('\n❌ テスト失敗:', error);
    process.exit(1);
  } finally {
    // 接続を切断
    await dbManager.disconnect();
    console.log('\n🔌 データベース接続を切断しました');
  }
}

// テスト実行
testDatabaseConnection().catch(console.error);
