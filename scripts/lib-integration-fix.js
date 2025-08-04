const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 ライブラリ統合の追加作業を実行します...\n');

// ファイルを再帰的に検索する関数
function findFiles(dir, pattern) {
  const results = [];
  
  function walk(currentPath) {
    try {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith(pattern)) {
          results.push(fullPath.replace(/\\/g, '/'));
        }
      }
    } catch (err) {
      // ディレクトリアクセスエラーを無視
    }
  }
  
  walk(dir);
  return results;
}

// Phase 1: 削除されたモジュール参照の修正
console.log('📋 Phase 1: 削除されたモジュール参照の修正');

const replacements = {
  '@/app/lib/types': '@/app/lib/core/types/api-unified',
  '@/app/lib/posts': '@/app/lib/api/data/posts',
  '@/app/lib/users': '@/app/lib/api/data/users', 
  '@/app/lib/comments': '@/app/lib/api/data/comments'
};

// TypeScript/TSXファイルを検索
const files = [
  ...findFiles('app', '.ts'),
  ...findFiles('app', '.tsx'),
  ...findFiles('scripts', '.ts')
];

let fileCount = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // 削除されたモジュールの参照を修正
  for (const [oldPath, newPath] of Object.entries(replacements)) {
    const importRegex = new RegExp(`from ['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (importRegex.test(content)) {
      content = content.replace(importRegex, `from '${newPath}'`);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    fileCount++;
    console.log(`✅ 修正: ${file}`);
  }
}

console.log(`📊 ${fileCount} ファイルのインポートパスを修正しました\n`);

// Phase 2: withApiAuth関数の引数修正  
console.log('📋 Phase 2: withApiAuth関数の引数修正');

const apiFiles = findFiles('app/api', '.ts');
let apiFixCount = 0;

for (const file of apiFiles) {
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // withApiAuth(handler, { resource, action }) → withApiAuth(handler)
  content = content.replace(
    /withApiAuth\(\s*([^,]+),\s*\{\s*resource:\s*[^,}]+(?:,\s*action:\s*[^}]+)?\s*\}\s*\)/g, 
    'withApiAuth($1)'
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    apiFixCount++;
    console.log(`✅ 修正: ${file}`);
  }
}

console.log(`📊 ${apiFixCount} APIファイルのwithApiAuth引数を修正しました\n`);

// Phase 3: 必要なスタブファイルの作成
console.log('📋 Phase 3: 必要なスタブファイルの作成');

const stubFiles = [
  {
    path: 'app/lib/api/data/posts.ts',
    content: `// スタブファイル - posts機能
export * from '../rest-client';
export type { Post, PostInput, PostListParams } from '../../core/types/api-unified';
`
  },
  {
    path: 'app/lib/api/data/users.ts',
    content: `// スタブファイル - users機能  
export * from '../rest-client';
export type { User, UserInput, UserListParams } from '../../core/types/api-unified';
`
  },
  {
    path: 'app/lib/api/data/comments.ts',
    content: `// スタブファイル - comments機能
export * from '../rest-client';
export type { Comment, CommentInput, CommentListParams } from '../../core/types/api-unified';
`
  }
];

for (const stub of stubFiles) {
  if (!fs.existsSync(stub.path)) {
    const dir = path.dirname(stub.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stub.path, stub.content);
    console.log(`✅ 作成: ${stub.path}`);
  }
}

console.log('\n🎉 追加作業完了！');
console.log('\n📋 次のステップ:');
console.log('1. npm run type-check で型チェック実行');
console.log('2. 残りエラーの個別修正');
console.log('3. 最終統合の完了');
