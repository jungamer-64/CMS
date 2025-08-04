#!/usr/bin/env pwsh

# TypeScript インポートパス一括修正スクリプト
# LIB_COMMONIZATION_PLAN.md 対応

Write-Host "=== TypeScript インポートパス一括修正開始 ===" -ForegroundColor Green

# 修正対象のパターンと新しいパス
$importMappings = @{
    "@/app/lib/api-types" = "@/app/lib/core/types"
    "@/app/lib/types" = "@/app/lib/core/types"
    "@/app/lib/api-utils" = "@/app/lib/api/client"
    "@/app/lib/api-factory" = "@/app/lib/api/factory"
    "@/app/lib/auth-middleware" = "@/app/lib/auth/middleware"
    "@/app/lib/users" = "@/app/lib/data/repositories"
    "@/app/lib/posts" = "@/app/lib/data/repositories"
    "@/app/lib/comments" = "@/app/lib/data/repositories"
    "@/app/lib/settings" = "@/app/lib/data/repositories"
    "@/app/lib/mongodb" = "@/app/lib/data/connections"
    "@/app/lib/validation-schemas" = "@/app/lib/api/schemas"
}

# TypeScriptファイルを検索
$tsFiles = Get-ChildItem -Path "app" -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.Name -notlike "*.d.ts" }

$totalFiles = $tsFiles.Count
$modifiedFiles = 0

Write-Host "検索対象ファイル数: $totalFiles" -ForegroundColor Yellow

foreach ($file in $tsFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (!$content) { continue }
    
    $originalContent = $content
    $fileModified = $false
    
    foreach ($oldPath in $importMappings.Keys) {
        $newPath = $importMappings[$oldPath]
        
        # import文の置換
        $pattern = "from ['\`]$([regex]::Escape($oldPath))['\`]"
        $replacement = "from '$newPath'"
        
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $fileModified = $true
            Write-Host "  ✓ $($file.Name): $oldPath → $newPath" -ForegroundColor Cyan
        }
    }
    
    if ($fileModified) {
        try {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $modifiedFiles++
        } catch {
            Write-Host "  ✗ エラー: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== 修正完了 ===" -ForegroundColor Green
Write-Host "修正ファイル数: $modifiedFiles / $totalFiles" -ForegroundColor Yellow

# エラー数確認
Write-Host "`n=== TypeScript エラーチェック ===" -ForegroundColor Green
$output = pnpm type-check 2>&1
$errorCount = ($output | Where-Object { $_ -like "*error TS*" }).Count
Write-Host "現在のエラー数: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Yellow" })

if ($errorCount -gt 0) {
    Write-Host "`n主要なエラーパターン:" -ForegroundColor Yellow
    $output | Where-Object { $_ -like "*Cannot find module*" } | 
        ForEach-Object { $_ -replace ".*Cannot find module '([^']+)'.*", '$1' } | 
        Group-Object | Sort-Object Count -Descending | Select-Object -First 5 | 
        ForEach-Object { Write-Host "  $($_.Name): $($_.Count)個" }
}
