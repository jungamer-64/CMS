# 文字エンコーディングエラーを修正

$files = @(
    "app/api/admin/comments/route.ts",
    "app/api/admin/posts/route.ts", 
    "app/api/comments/route.ts",
    "app/api/test/route.ts",
    "app/api/webhooks/route.ts"
)

$fixes = @{
    'でぁE' = 'です'
    'ぁE' = 'い'
    'チE��' = 'テスト'
    'チE�E' = 'データ'
    'E��E��限' = '管理者権'
    'E��で' = 'です'
    'E��が忁E��で' = 'が必要で'
    'スラチE��' = 'スラッグ'
    'コメント機�E' = 'コメント機能'
    'E��ぁE' = 'です'
    'なぁE' = 'なし'
    'チEPI' = 'テストAPI'
    'E忁E��' = 'は必須'
    'JONチE�E' = 'JSONデータ'
}

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Encoding UTF8 | Out-String
        
        foreach ($pattern in $fixes.Keys) {
            $content = $content -replace [regex]::Escape($pattern), $fixes[$pattern]
        }
        
        # 追加の一般的な修正
        $content = $content -replace "', 400\)\);", "', 400));"
        $content = $content -replace "', 403\)\);", "', 403));"
        $content = $content -replace "', 500\)\);", "', 500));"
        
        Set-Content $fullPath $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed encoding issues in: $file"
    }
}

Write-Host "Encoding fixes completed."
