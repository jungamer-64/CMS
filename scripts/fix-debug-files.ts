#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';

const files = [
  'app/api/debug/check-user/route.ts', 
  'app/api/debug/fix-user-password/route.ts'
];

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  
  // 不正な二重括弧を修正
  content = content.replace(/\), \{ status: \d+ \}\)\);/g, (match) => {
    return match.replace(/\)\)\);$/, '));');
  });
  
  writeFileSync(file, content);
  console.log('修正:', file);
}

console.log('debug系ファイルの修正完了');
