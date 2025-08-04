# withApiAuth引数の型エラーを一括修正

$filesToFix = @(
    "app/api/admin/comments/[id]/route.ts",
    "app/api/admin/posts/[id]/route.ts", 
    "app/api/admin/posts/route.ts",
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
        
        # withApiAuth(async (request: NextRequest, context) => の型を修正
        $newContent = $content -replace "withApiAuth\(async \(request: NextRequest, context\) =>", "withApiAuth(async (request: NextRequest, authContext: AuthContext) =>"
        
        # AuthContextのインポートを追加（まだない場合）
        if ($content -match "withApiAuth" -and $content -notmatch "AuthContext") {
            $newContent = $newContent -replace "(import.*{.*withApiAuth)(.*}.*from '@/app/lib/auth-middleware')", "`$1, AuthContext`$2"
        }
        
        # context.userをauthContext.userに修正
        $newContent = $newContent -replace "context\.user", "authContext.user"
        
        Set-Content $fullPath $newContent -NoNewline
        Write-Host "Fixed withApiAuth arguments in: $file"
    }
}

Write-Host "withApiAuth argument fixes completed."
