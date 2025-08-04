const fs = require('fs');
const path = require('path');

// GitHub repository route.ts の構文エラーを修正するスクリプト
const filePath = 'app/api/github/repository/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 基本的な構文エラーパターンを修正
const fixes = [
  // 文字化けした文字列を修正
  /('無効なアクションでぁE)/g, "'無効なアクションです'",
  /('path, content, message は忁E��でぁE)/g, "'path, content, message は必須です'",
  /('path, message, sha は忁E��でぁE)/g, "'path, message, sha は必須です'",
  
  // 不正な括弧・カンマの修正
  /, }\)/g, " })",
  /, }\);/g, " });",
  /}],\s*}\)\s*;\s*$/gm, "}] }));",
  
  // 未終了の関数呼び出しを修正
  /htmlUrl: ([^,}]+), }\)/g, "htmlUrl: $1 })",
  /}, }\);/g, "} });",
  
  // その他の構文エラー
  /}\)\)\)\s*;/g, "})));",
];

// 修正を適用
for (let i = 0; i < fixes.length; i += 2) {
  const pattern = fixes[i];
  const replacement = fixes[i + 1];
  content = content.replace(pattern, replacement);
}

// 手動で特定の問題を修正
content = content.replace(
  /htmlUrl: content\.html_url, }\)/g,
  "htmlUrl: content.html_url }"
);

content = content.replace(
  /contents: dirContent\.map\(item => \(\{[^}]+}]\)\), }\)/g,
  "contents: dirContent.map(item => ({ name: item.name, type: item.type, path: item.path, htmlUrl: item.html_url })) }"
);

fs.writeFileSync(filePath, content);
console.log('✅ GitHub repository route.ts の構文エラーを修正しました');
