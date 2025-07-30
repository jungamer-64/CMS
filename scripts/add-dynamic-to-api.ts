import fs from 'fs/promises';
import path from 'path';

async function addDynamicToApiRoutes() {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  
  async function processDir(dirPath: string) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await processDir(fullPath);
      } else if (entry.name === 'route.ts') {
        console.log(`Processing: ${fullPath}`);
        
        const content = await fs.readFile(fullPath, 'utf8');
        
        // すでに dynamic が設定されているかチェック
        if (content.includes('export const dynamic')) {
          console.log(`  ⏭️  Already has dynamic config`);
          continue;
        }
        
        // import文の後に dynamic 設定を追加
        const lines = content.split('\n');
        let insertIndex = -1;
        
        // 最後のimport文を見つける
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ') || lines[i].startsWith('import{')) {
            insertIndex = i + 1;
          }
        }
        
        if (insertIndex > -1) {
          lines.splice(insertIndex, 0, '', '// 動的レンダリングを強制', 'export const dynamic = \'force-dynamic\';');
          
          const newContent = lines.join('\n');
          await fs.writeFile(fullPath, newContent, 'utf8');
          console.log(`  ✅ Added dynamic config`);
        } else {
          console.log(`  ❌ Could not find insertion point`);
        }
      }
    }
  }
  
  await processDir(apiDir);
  console.log('\n✅ All API routes processed');
}

addDynamicToApiRoutes().catch(console.error);
