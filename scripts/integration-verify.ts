#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const checks = [
  {
    name: 'TypeScript コンパイル',
    command: 'npx tsc --noEmit',
  },
  {
    name: 'ESLint チェック',
    command: 'npx eslint app/lib --ext .ts,.tsx',
  },
  {
    name: '削除予定ファイルの確認',
    check: () => {
      const deletedFiles = [
        'app/lib/utils/env.ts',
        'app/lib/utils/github.ts',
        'app/lib/user-hooks.ts',
        'app/lib/useCurrentPath.ts'
      ];
      
      const existing = deletedFiles.filter(file => existsSync(file));
      if (existing.length > 0) {
        throw new Error(`削除されていないファイル: ${existing.join(', ')}`);
      }
      return '✅ 全ファイル削除完了';
    }
  },
  {
    name: '新規ファイルの存在確認',
    check: () => {
      const newFiles = [
        'app/lib/core/types/api-unified.ts',
        'app/lib/core/validation/schemas.ts',
        'app/lib/api/rest-client.ts',
        'app/lib/ui/hooks/auth-hooks.ts',
        'app/lib/ui/hooks/navigation-hooks.ts'
      ];
      
      const missing = newFiles.filter(file => !existsSync(file));
      if (missing.length > 0) {
        throw new Error(`作成されていないファイル: ${missing.join(', ')}`);
      }
      return '✅ 全新規ファイル作成完了';
    }
  }
];

console.log('🚀 統合検証開始...\n');

for (const check of checks) {
  try {
    console.log(`📋 ${check.name}...`);
    
    if (check.command) {
      execSync(check.command, { stdio: 'pipe' });
      console.log('✅ 成功\n');
    } else if (check.check) {
      const result = check.check();
      console.log(result + '\n');
    }
  } catch (error) {
    console.error(`❌ ${check.name} 失敗:`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

console.log('🎉 すべての検証が完了しました！');
