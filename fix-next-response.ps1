# NextResponseインポート不足を一括修正

$filesToFix = @(
    "app/api/admin/comments/[id]/route.ts",
    "app/api/admin/comments/route.ts", 
    "app/api/admin/media/route.ts",
    "app/api/admin/posts/[id]/route.ts",
    "app/api/admin/posts/route.ts",
    "app/api/comments/[id]/route.ts",
    "app/api/posts/[slug]/route-new.ts",
    "app/api/test/route.ts",
    "app/api/users/[id]/profile/route.ts",
    "app/api/users/[id]/theme/route.ts",
    "app/api/webhooks/[id]/route.ts",
    "app/api/webhooks/route.ts"
)

foreach ($file in $filesToFix) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # NextRequestがあってNextResponseがない場合にNextResponseを追加
        if ($content -match "import.*NextRequest.*from 'next/server'" -and $content -notmatch "NextResponse") {
            $newContent = $content -replace "(import.*{.*NextRequest)(.*}.*from 'next/server')", "`$1, NextResponse`$2"
            Set-Content $fullPath $newContent -NoNewline
            Write-Host "Fixed NextResponse import in: $file"
        }
    }
}

Write-Host "NextResponse import fixes completed."
