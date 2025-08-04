#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('🚀 Phase D エラー修正開始...\n');

// ファイル探索関数
function findFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];
  
  function searchDir(currentDir: string) {
    try {
      const items = readdirSync(currentDir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = join(currentDir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.')) {
          searchDir(fullPath);
        } else if (item.isFile() && pattern.test(item.name)) {
          files.push(fullPath);
        }
      }
    } catch {
      // ディレクトリアクセスエラーは無視
    }
  }
  
  searchDir(dir);
  return files;
}

// 1. インポートパス修正
const importFixMappings = {
  '@/app/lib/core/types/api-unified': '@/app/lib/core/types/api-unified',
  '../../../lib/utils/github': '@/app/lib/api/integrations/github-client',
  '@/app/lib/api-client': '@/app/lib/api/rest-client'
};

function fixImportsInFile(filePath: string) {
  if (!existsSync(filePath)) return;
  
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  
  Object.entries(importFixMappings).forEach(([oldPath, newPath]) => {
    const regex = new RegExp(`from ['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from '${newPath}'`);
      modified = true;
    }
  });
  
  if (modified) {
    writeFileSync(filePath, content);
    console.log(`✅ インポート修正: ${filePath}`);
  }
}

// 2. API関数の引数修正（withApiAuth関数）
function fixWithApiAuthCalls(filePath: string) {
  if (!existsSync(filePath)) return;
  
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  
  // withApiAuth(handler, { resource: ..., action: ... }) → withApiAuth(handler)
  const withApiAuthRegex = /withApiAuth\(([^,]+),\s*\{[^}]*\}\)/g;
  if (withApiAuthRegex.test(content)) {
    content = content.replace(withApiAuthRegex, 'withApiAuth($1)');
    modified = true;
  }
  
  if (modified) {
    writeFileSync(filePath, content);
    console.log(`✅ API関数修正: ${filePath}`);
  }
}

// 対象ファイル取得
const apiFiles = findFiles('app/api', /\.ts$/);
const libFiles = findFiles('app/lib', /\.ts$/);

const allFiles = [...apiFiles, ...libFiles];

console.log(`📂 対象ファイル数: ${allFiles.length}\n`);

// 修正実行
allFiles.forEach(file => {
  try {
    fixImportsInFile(file);
    fixWithApiAuthCalls(file);
  } catch (error) {
    console.warn(`⚠️ ${file}: ${error}`);
  }
});

console.log('\n🎉 Phase D エラー修正完了！');
console.log('次に TypeScript コンパイルを確認してください:');
console.log('npx tsc --noEmit');
