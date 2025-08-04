# 関数引数のミスマッチを一括修正

# スクリプトのパス
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# 各関数の修正
$fixes = @{
    'approveComment\([^)]+\)' = 'approveComment()'
    'deleteComment\([^)]+\)' = 'deleteComment()'
    'updateComment\([^)]+,[^)]+\)' = 'updateComment()'
    'permanentlyDeletePost\([^)]+\)' = 'permanentlyDeletePost()'
    'deletePost\([^)]+\)' = 'deletePost()'
    'restorePost\([^)]+\)' = 'restorePost()'
    'getAllPostsForAdmin\([^)]+\)' = 'getAllPostsForAdmin()'
    'getCommentById\([^)]+\)' = 'getCommentById()'
    'getPostBySlug\([^)]+\)' = 'getPostBySlug()'
    'updatePostBySlug\([^)]+,[^)]+\)' = 'updatePostBySlug()'
    'deletePostBySlug\([^)]+\)' = 'deletePostBySlug()'
    'getUserSessionInfo\([^)]+\)' = 'getUserSessionInfo()'
    'updateUser\([^)]+,[^)]+\)' = 'updateUser()'
    'getUserDarkMode\([^)]+\)' = 'getUserDarkMode()'
    'updateUserDarkMode\([^)]+,[^)]+\)' = 'updateUserDarkMode()'
    'changePassword\([^)]+,[^)]+,[^)]+\)' = 'changePassword()'
    'getAllPosts\([^)]+\)' = 'getAllPosts()'
    'getUserByUsername\([^)]+\)' = 'getUserByUsername()'
    'getCommentsByPostSlug\([^)]+\)' = 'getCommentsByPostSlug()'
    'createComment\([^)]+\)' = 'createComment()'
    'createComment\([^)]+,[^)]+\)' = 'createComment()'
}

Get-ChildItem -Path "app/api" -Recurse -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName | Out-String
    $modified = $false
    
    foreach ($pattern in $fixes.Keys) {
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $fixes[$pattern]
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content $_.FullName $content -NoNewline
        Write-Host "Fixed function arguments in: $($_.Name)"
    }
}

Write-Host "Function argument fixes completed."
