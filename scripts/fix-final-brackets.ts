#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';

const files = [
  'app/api/admin/api-keys/route.ts',
  'app/api/admin/comments/route.ts', 
  'app/api/admin/posts/route.ts',
  'app/api/github/repository/route.ts',
  'app/api/posts/public/route.ts'
];

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf8');
    const originalContent = content;
    
    // withApiAuth の最後に不正な }); がある場合の修正
    content = content.replace(/(\s+)}\);(\s*$)/gm, '$1});$2');
    
    // try-catch block の }); 修正
    content = content.replace(/(\s+)}\s*catch\s*\([^)]*\)\s*\{/g, '$1} catch (error) {');
    
    if (content !== originalContent) {
      writeFileSync(file, content);
      console.log(`修正: ${file}`);
    }
  } catch (error) {
    console.error(`エラー: ${file} - ${error}`);
  }
}

console.log('最終括弧修正完了');
