// 環境変数確認用の簡単なスクリプト
/* eslint-env node */
/* global console, process */

function sanitizeForLog(value) {
    try {
        if (value === undefined || value === null) return '未設定';
        const s = typeof value === 'string' ? value : JSON.stringify(value);
        // 改行をスペースに置換
        const noNewline = s.replace(/\r\n|\r|\n/g, ' ');
        // 0-31 と 127 の制御文字をスペースに置換
        const cleaned = Array.from(noNewline)
            .map((ch) => {
                const code = ch.charCodeAt(0);
                return (code >= 0 && code <= 31) || code === 127 ? ' ' : ch;
            })
            .join('');
        return cleaned.slice(0, 300);
    } catch (e) {
        return String(value);
    }
}

console.log('🔍 環境変数チェック:');
console.log('MONGODB_URI: ' + sanitizeForLog(process.env.MONGODB_URI ? '設定済み' : '未設定'));
console.log('MONGODB_DB: ' + sanitizeForLog(process.env.MONGODB_DB ? '設定済み' : '未設定'));
console.log('JWT_SECRET: ' + sanitizeForLog(process.env.JWT_SECRET ? '設定済み' : '未設定'));
console.log('NODE_ENV: ' + sanitizeForLog(process.env.NODE_ENV));
// 環境変数確認用の簡単なスクリプト
/* eslint-env node */
/* global console, process */


function sanitizeForLog(value) {
    if (value == null) return '未設定';
    return String(value).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/[\r\n]+/g, ' ').slice(0, 300);
}

function sanitizeForLog(value) {
    try {
        if (value === undefined || value === null) return '' + value;
        const s = typeof value === 'string' ? value : JSON.stringify(value);
        // CR/LF を取り除き、長すぎるログは切り詰める
        return s.replace(/[\u0000-\u001F\r\n]+/g, ' ').substring(0, 300);
    } catch (e) {
        return String(value);
    }
}

console.log(sanitizeForLog('🔍 環境変数チェック:'));
console.log('MONGODB_URI: ' + sanitizeForLog(process.env.MONGODB_URI ? '設定済み' : '未設定'));
console.log('MONGODB_DB: ' + sanitizeForLog(process.env.MONGODB_DB ? '設定済み' : '未設定'));
console.log('JWT_SECRET: ' + sanitizeForLog(process.env.JWT_SECRET ? '設定済み' : '未設定'));
console.log('NODE_ENV: ' + sanitizeForLog(process.env.NODE_ENV));
