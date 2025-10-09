#!/usr/bin/env node

/**
 * 監視エンドポイントテストスクリプト
 * 
 * ヘルスチェックとメトリクスエンドポイントの動作を検証します。
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const METRICS_TOKEN = process.env.METRICS_TOKEN;

console.log('🔍 監視エンドポイントテスト開始...\n');
console.log(`Base URL: ${BASE_URL}\n`);

/**
 * ヘルスチェックエンドポイントのテスト
 */
async function testHealthEndpoint() {
  console.log('📊 ヘルスチェックエンドポイントをテスト中...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    console.log(`  ステータスコード: ${response.status}`);
    console.log(`  システムステータス: ${data.status}`);
    console.log(`  アップタイム: ${data.uptime}秒`);
    console.log(`  データベース: ${data.checks?.database?.status || 'N/A'} (レイテンシー: ${data.checks?.database?.latency || 'N/A'}ms)`);
    console.log(`  メモリ: ${data.checks?.memory?.status || 'N/A'} (使用率: ${data.checks?.memory?.percentage || 'N/A'}%)`);
    
    if (response.status === 200 && data.status === 'healthy') {
      console.log('  ✅ ヘルスチェック: 正常\n');
      return true;
    } else {
      console.log('  ⚠️  ヘルスチェック: 問題あり\n');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ エラー: ${error.message}\n`);
    return false;
  }
}

/**
 * メトリクスエンドポイントのテスト
 */
async function testMetricsEndpoint() {
  console.log('📈 メトリクスエンドポイントをテスト中...');
  
  try {
    const headers = {};
    if (METRICS_TOKEN && process.env.NODE_ENV === 'production') {
      headers['Authorization'] = `Bearer ${METRICS_TOKEN}`;
    }
    
    const response = await fetch(`${BASE_URL}/api/metrics`, { headers });
    
    if (response.status === 401) {
      console.log('  ⚠️  認証が必要です（本番環境）');
      console.log('  💡 METRICS_TOKEN環境変数を設定してください\n');
      return false;
    }
    
    const data = await response.json();
    
    console.log(`  ステータスコード: ${response.status}`);
    console.log(`  アップタイム: ${data.system?.uptime || 'N/A'}秒`);
    console.log(`  メモリ使用量: ${data.system?.memory?.heapUsed || 'N/A'}MB / ${data.system?.memory?.heapTotal || 'N/A'}MB`);
    console.log(`  CPU使用率: User ${data.system?.cpu?.user || 'N/A'}ms, System ${data.system?.cpu?.system || 'N/A'}ms`);
    console.log(`  プロセスID: ${data.process?.pid || 'N/A'}`);
    console.log(`  Node.jsバージョン: ${data.process?.nodeVersion || 'N/A'}`);
    
    if (response.status === 200) {
      console.log('  ✅ メトリクス収集: 正常\n');
      return true;
    } else {
      console.log('  ⚠️  メトリクス収集: 問題あり\n');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ エラー: ${error.message}\n`);
    return false;
  }
}

/**
 * メインテスト実行
 */
async function runTests() {
  const results = {
    health: false,
    metrics: false,
  };
  
  results.health = await testHealthEndpoint();
  results.metrics = await testMetricsEndpoint();
  
  console.log('📋 テスト結果サマリー');
  console.log('─────────────────────');
  console.log(`ヘルスチェック: ${results.health ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`メトリクス収集: ${results.metrics ? '✅ 成功' : '❌ 失敗'}`);
  console.log('─────────────────────\n');
  
  const allPassed = results.health && results.metrics;
  
  if (allPassed) {
    console.log('🎉 すべてのテストが成功しました！');
    process.exit(0);
  } else {
    console.log('⚠️  一部のテストが失敗しました。');
    console.log('💡 開発サーバーが起動していることを確認してください。');
    process.exit(1);
  }
}

// テスト実行
runTests().catch((error) => {
  console.error('❌ テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});
