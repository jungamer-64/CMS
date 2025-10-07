/**
 * 管理者ユーザー初期化スクリプト
 * 
 * 使用方法:
 * pnpm tsx scripts/init-admin-user.ts
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// 環境変数を読み込む
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || 'test-website';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

async function initAdminUser() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI環境変数が設定されていません');
        process.exit(1);
    }

    console.log('🔌 MongoDBに接続中...');
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ MongoDB接続成功');

        const db = client.db(MONGODB_DB);
        const usersCollection = db.collection('users');

        // 既存の管理者ユーザーを確認
        const existingAdmin = await usersCollection.findOne({ username: ADMIN_USERNAME });

        if (existingAdmin) {
            console.log('⚠️  管理者ユーザーが既に存在します');
            console.log('🔄 パスワードを更新します...');

            // パスワードをハッシュ化
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

            // パスワードのみ更新
            await usersCollection.updateOne(
                { username: ADMIN_USERNAME },
                {
                    $set: {
                        passwordHash,
                        updatedAt: new Date()
                    }
                }
            );

            console.log('✅ 管理者パスワードを更新しました');
            console.log('');
            console.log('📝 ログイン情報:');
            console.log(`   ユーザー名: ${ADMIN_USERNAME}`);
            console.log(`   パスワード: ${ADMIN_PASSWORD}`);
            console.log(`   メール: ${existingAdmin.email}`);
        } else {
            console.log('👤 管理者ユーザーを作成中...');

            // パスワードをハッシュ化
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

            // 管理者ユーザーを作成
            const adminUser = {
                id: crypto.randomUUID(),
                username: ADMIN_USERNAME,
                email: ADMIN_EMAIL,
                displayName: '管理者',
                passwordHash,
                role: 'admin' as const,
                isActive: true,
                darkMode: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await usersCollection.insertOne(adminUser);

            console.log('✅ 管理者ユーザーを作成しました');
            console.log('');
            console.log('📝 ログイン情報:');
            console.log(`   ユーザー名: ${ADMIN_USERNAME}`);
            console.log(`   パスワード: ${ADMIN_PASSWORD}`);
            console.log(`   メール: ${ADMIN_EMAIL}`);
        }

        console.log('');
        console.log('🎉 初期化完了！');
    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 MongoDB接続を閉じました');
    }
}

// スクリプト実行
initAdminUser();
