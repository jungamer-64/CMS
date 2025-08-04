#!/usr/bin/env tsx

import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function getAllApiFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllApiFiles(fullPath));
      } else if (item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // ディレクトリが存在しない場合は無視
  }
  
  return files;
}

function fixAllBracketErrors(): void {
  console.log('🚀 すべての括弧エラー一括修正開始...');
  
  const apiFiles = getAllApiFiles('app/api');
  let totalFixed = 0;
  
  for (const filePath of apiFiles) {
    try {
      let content = readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // 基本的な括弧修正パターン
      const fixes = [
        // パターン1: 不正な二重右括弧の修正 )); → );
        { pattern: /\)\);([;\s]*(?:\r?\n|$))/g, replacement: ');$1' },
        
        // パターン2: 関数呼び出しの不正括弧 func(args))); → func(args);
        { pattern: /(\w+\([^)]*\))\)\);/g, replacement: '$1;' },
        
        // パターン3: 文字列+関数の不正括弧 'text')); → 'text');
        { pattern: /(['"]\s*)\)\);/g, replacement: '$1);' },
        
        // パターン4: split関数の修正
        { pattern: /\.split\(([^)]+)\)\);/g, replacement: '.split($1);' },
        
        // パターン5: join関数の修正
        { pattern: /\.join\(([^)]+)\)\);/g, replacement: '.join($1);' },
        
        // パターン6: get/set/delete関数の修正
        { pattern: /\.(get|set|delete)\(([^)]+)\)\);/g, replacement: '.$1($2);' },
        
        // パターン7: console.logの修正
        { pattern: /console\.log\(([^)]+)\)\);/g, replacement: 'console.log($1);' },
        
        // パターン8: import文の修正
        { pattern: /import\(([^)]+)\)\);/g, replacement: 'import($1);' },
        
        // パターン9: revalidateTag/Pathの修正
        { pattern: /(revalidateTag|revalidatePath)\(([^)]+)\)\);/g, replacement: '$1($2);' },
        
        // パターン10: 不正な括弧のパターン検出と修正 )]); → ));
        { pattern: /\]\)\);/g, replacement: ']);' },
        
        // パターン11: return文の修正
        { pattern: /return\s+([^;]+)\)\);([;\s]*)/g, replacement: 'return $1);$2' }
      ];
      
      // 各修正パターンを適用
      for (const { pattern, replacement } of fixes) {
        content = content.replace(pattern, replacement);
      }
      
      // try-catch構文の修正
      content = content.replace(/(\s+)\}\s+catch\s*\(\s*error\s*\)\s*\{/g, '$1} catch (error) {');
      
      // 変更があった場合のみファイルを更新
      if (content !== originalContent) {
        writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 修正完了: ${filePath.replace(/\\/g, '/')}`);
        totalFixed++;
      }
      
    } catch (error) {
      console.error(`❌ エラー: ${filePath} - ${error}`);
    }
  }
  
  console.log(`🎉 一括修正完了! ${totalFixed}個のファイルを修正しました。`);
}

if (require.main === module) {
  fixAllBracketErrors();
}
