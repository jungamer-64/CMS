#!/usr/bin/env tsx

import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function getAllApiFiles(dir: string): string[] {
  const files: string[] = [];
  
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
  
  return files;
}

function fixBracketErrors(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  // パターン1: NextResponse.json() の括弧の問題を修正
  const patterns = [
    {
      // パターン: ', 401);  → ', 401));
      from: /, (\d+)\);$/gm,
      to: ', $1));'
    },
    {
      // パターン: 'message');  → 'message'));
      from: /', (\d+)\);$/gm,
      to: "', $1));"
    },
    {
      // パターン: ');  → '));
      from: /'\);$/gm,
      to: "'));"
    },
    {
      // 複雑なパターン: createSuccessResponse の末尾
      from: /}, '[^']*'\);$/gm,
      to: (match: string) => match.replace(/\);$/, '));')
    }
  ];

  patterns.forEach(pattern => {
    if (typeof pattern.to === 'string') {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    } else {
      // 関数の場合
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });

  // より具体的な修正: NextResponse.json(createXxxResponse(...)); の形式に統一
  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    if (line.includes('return NextResponse.json(create') && 
        line.includes('Response(') && 
        !line.includes('));')) {
      
      // 行末が ); で終わっている場合、)); に変更
      if (line.trim().endsWith(');')) {
        return line.replace(/\);$/, '));');
      }
    }
    return line;
  });

  if (fixedLines.join('\n') !== content) {
    content = fixedLines.join('\n');
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content);
    console.log(`✅ 括弧エラー修正: ${filePath}`);
  }

  return modified;
}

async function main() {
  console.log('🚀 括弧エラー修正開始...\n');

  const apiDir = 'app/api';
  const apiFiles = getAllApiFiles(apiDir);

  console.log(`📁 対象APIファイル数: ${apiFiles.length}\n`);

  let totalFixed = 0;
  
  for (const file of apiFiles) {
    if (fixBracketErrors(file)) {
      totalFixed++;
    }
  }

  console.log(`\n🎉 修正完了! ${totalFixed}個のAPIファイルの括弧を修正しました。`);
}

if (require.main === module) {
  main().catch(console.error);
}
