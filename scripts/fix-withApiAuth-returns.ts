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

function fixApiHandlerReturns(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  // パターン1: createSuccessResponse/createErrorResponse を NextResponse.json でラップ
  const successPattern = /return\s+createSuccessResponse\(/g;
  const errorPattern = /return\s+createErrorResponse\(/g;

  if (content.match(successPattern)) {
    content = content.replace(successPattern, 'return NextResponse.json(createSuccessResponse(');
    modified = true;
  }

  if (content.match(errorPattern)) {
    content = content.replace(errorPattern, 'return NextResponse.json(createErrorResponse(');
    modified = true;
  }

  // 対応する括弧を追加する必要がある場合の処理
  if (modified) {
    // 各行の最後の ); を )); に置換（ただし既に )); の場合は除く）
    const lines = content.split('\n');
    content = lines.map(line => {
      if (line.includes('return NextResponse.json(createSuccessResponse(') || 
          line.includes('return NextResponse.json(createErrorResponse(')) {
        // この行で始まる関数呼び出しの終了を探す
        if (line.trim().endsWith(');') && !line.trim().endsWith('));')) {
          return line.replace(/\);$/, '));');
        }
      }
      return line;
    }).join('\n');
  }

  // NextResponse のインポートが存在するかチェック
  if (modified && !content.includes('NextResponse')) {
    // NextRequest, NextResponse のインポートを追加
    if (content.includes("from 'next/server'")) {
      content = content.replace(
        /import\s*{([^}]*)}\s*from\s*['"]next\/server['"];?/,
        (match, imports) => {
          if (!imports.includes('NextResponse')) {
            return match.replace(imports, `${imports.trim()}, NextResponse`);
          }
          return match;
        }
      );
    } else {
      // 新しいインポートを追加
      content = `import { NextResponse } from 'next/server';\n${content}`;
    }
    
    console.log(`✅ NextResponse インポート追加: ${filePath}`);
  }

  if (modified) {
    writeFileSync(filePath, content);
    console.log(`✅ API戻り値修正: ${filePath}`);
  }

  return modified;
}

async function main() {
  console.log('🚀 withApiAuth戻り値型修正開始...\n');

  const apiDir = 'app/api';
  const apiFiles = getAllApiFiles(apiDir);

  console.log(`📁 対象APIファイル数: ${apiFiles.length}\n`);

  let totalFixed = 0;
  
  for (const file of apiFiles) {
    if (fixApiHandlerReturns(file)) {
      totalFixed++;
    }
  }

  console.log(`\n🎉 修正完了! ${totalFixed}個のAPIファイルを修正しました。`);
  
  // TypeScript コンパイルチェック
  console.log('\n🔍 TypeScript コンパイルチェック実行中...');
  const { execSync } = require('child_process');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript コンパイル成功!');
  } catch (error) {
    console.log('⚠️ まだエラーが残っています。続行して他の修正を行います。');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
