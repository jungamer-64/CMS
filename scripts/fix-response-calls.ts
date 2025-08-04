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

function fixResponseCalls(): void {
  console.log('🚀 createResponse関数呼び出しの修正開始...');
  
  const apiFiles = getAllApiFiles('app/api');
  let totalFixed = 0;
  
  for (const filePath of apiFiles) {
    try {
      let content = readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // パターン1: NextResponse.json(createErrorResponse('text', code); の修正
      // 不完全な括弧を検出して修正
      content = content.replace(
        /NextResponse\.json\(create(Success|Error)Response\(([^)]+(?:\([^)]*\))*[^)]*)\);/g,
        'NextResponse.json(create$1Response($2));'
      );
      
      // パターン2: より細かい修正 - 文字列リテラル内の問題を回避
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // NextResponse.json(createErrorResponse で始まる行を検出
        if (line.includes('NextResponse.json(createErrorResponse(') ||
            line.includes('NextResponse.json(createSuccessResponse(')) {
          
          // 行末が ); で終わっている場合、)); に修正
          if (line.trim().endsWith(');') && !line.trim().endsWith('));')) {
            line = line.replace(/\);(\s*)$/, '));$1');
            lines[i] = line;
          }
          
          // buffer.from(await file.arrayBuffer(); のような特殊ケース
          if (line.includes('arrayBuffer();')) {
            line = line.replace('arrayBuffer();', 'arrayBuffer());');
            lines[i] = line;
          }
        }
        
        // Response.json(createApiSuccess(data); のような類似パターン
        if (line.includes('Response.json(createApiSuccess(')) {
          if (line.trim().endsWith(');') && !line.trim().endsWith('));')) {
            line = line.replace(/\);(\s*)$/, '));$1');
            lines[i] = line;
          }
        }
        
        // sort関数などの特殊ケース
        if (line.includes('.sort(') && line.trim().endsWith(');')) {
          if (!line.includes('));')) {
            line = line.replace(/\);(\s*)$/, ');$1');
            lines[i] = line;
          }
        }
      }
      
      content = lines.join('\n');
      
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
  
  console.log(`🎉 修正完了! ${totalFixed}個のファイルを修正しました。`);
}

if (require.main === module) {
  fixResponseCalls();
}
