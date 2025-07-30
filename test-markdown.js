const { marked } = require('marked');

// テスト用マークダウンテキスト
const testMarkdown = `# 大見出し（H1）

## 中見出し（H2）

### 小見出し（H3）

これは段落テキストです。

**太字テキスト**と*斜体テキスト*のテストです。

- リスト項目1
- リスト項目2
- リスト項目3
`;

console.log('入力マークダウン:');
console.log(testMarkdown);
console.log('\n変換後HTML:');
console.log(marked.parse(testMarkdown));
