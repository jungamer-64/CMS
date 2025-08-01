# GMO CoreServer用デプロイスクリプト (PowerShell)
# Usage: .\deploy\deploy-coreserver.ps1

param(
    [string]$Environment = "production",
    [SecureString]$Passphrase
)

$SERVER_NUMBER = "v2008"
$USERNAME = "rebelor"
$SERVER_HOST = "$SERVER_NUMBER.coreserver.jp"
$APP_NAME = "jgm-blog"
$SSH_KEY = "$env:USERPROFILE\.ssh\jgm_rsa"

Write-Host "=== GMO CoreServer デプロイ開始 ===" -ForegroundColor Green
Write-Host "サーバー: $SERVER_HOST"
Write-Host "ユーザー: $USERNAME"
Write-Host "環境: $Environment"

# SSH鍵の確認
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "エラー: SSH鍵が見つかりません" -ForegroundColor Red
    Write-Host "$SSH_KEY が存在することを確認してください"
    exit 1
}

# パスフレーズの設定（変数から取得）
if (-not $Passphrase) {
    if ($global:passphrase) {
        $Passphrase = $global:passphrase
        Write-Host "Using saved passphrase" -ForegroundColor Yellow
    } else {
        Write-Host "SSH key passphrase not set" -ForegroundColor Red
        Write-Host "Please save passphrase to variable first:"
        Write-Host '$passphrase = Read-Host "Enter SSH key passphrase" -AsSecureString'
        exit 1
    }
}

# パスフレーズを平文に変換（一時的に使用）
$plainPassphrase = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Passphrase))

# SSH Agent setup
try {
    Write-Host "Setting up SSH Agent..." -ForegroundColor Yellow
    Write-Host "Server connection test..." -ForegroundColor Yellow
    
} catch {
    Write-Host "SSH Agent setup error: $($_.Exception.Message)" -ForegroundColor Red
}

# デプロイファイルのアップロード関数
function Send-File {
    param($LocalPath, $RemotePath)
    
    Write-Host "Uploading file: $LocalPath -> $RemotePath" -ForegroundColor Yellow
    
    # scpコマンドでファイルアップロード
    $scpCommand = "scp -i `"$SSH_KEY`" `"$LocalPath`" $USERNAME@${SERVER_HOST}:$RemotePath"
    
    # パスフレーズを含むコマンド実行
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "scp"
    $pinfo.Arguments = "-i `"$SSH_KEY`" `"$LocalPath`" $USERNAME@${SERVER_HOST}:$RemotePath"
    $pinfo.UseShellExecute = $false
    $pinfo.RedirectStandardInput = $true
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $pinfo
    $process.Start()
    
    # パスフレーズを入力
    $process.StandardInput.WriteLine($plainPassphrase)
    $process.WaitForExit()
    
    if ($process.ExitCode -ne 0) {
        Write-Host "File upload failed: $($process.StandardError.ReadToEnd())" -ForegroundColor Red
        return $false
    }
    return $true
}

# SSH実行関数
function Invoke-SSH {
    param($Command)
    
    Write-Host "Executing SSH command: $Command" -ForegroundColor Yellow
    
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "ssh"
    $pinfo.Arguments = "-i `"$SSH_KEY`" $USERNAME@$SERVER_HOST `"$Command`""
    $pinfo.UseShellExecute = $false
    $pinfo.RedirectStandardInput = $true
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $pinfo
    $process.Start()
    
    # パスフレーズを入力
    $process.StandardInput.WriteLine($plainPassphrase)
    $output = $process.StandardOutput.ReadToEnd()
    $errorOutput = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    
    if ($process.ExitCode -ne 0) {
        Write-Host "SSH command execution failed: $errorOutput" -ForegroundColor Red
        return $false
    }
    
    Write-Host $output
    return $true
}

# メインデプロイ処理
try {
    # Upload deploy script
    if (-not (Send-File "deploy\deploy-coreserver.sh" "~/deploy-coreserver.sh")) {
        throw "Deploy script upload failed"
    }
    
    # Upload environment file (if exists)
    $envFile = "deploy\.env.$Environment"
    if (Test-Path $envFile) {
        if (-not (Send-File $envFile "~/.env.$Environment")) {
            Write-Host "Warning: Environment file upload failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Warning: Environment file $envFile not found" -ForegroundColor Yellow
    }
    
    # Upload Next.js config file
    if (Test-Path "deploy\next.config.coreserver.ts") {
        if (-not (Send-File "deploy\next.config.coreserver.ts" "~/next.config.ts.coreserver")) {
            Write-Host "Warning: Next.js config file upload failed" -ForegroundColor Yellow
        }
    }
    
    # Execute deploy script
    if (-not (Invoke-SSH "chmod +x deploy-coreserver.sh && ./deploy-coreserver.sh $Environment")) {
        throw "Deploy script execution failed"
    }
    
    Write-Host "`n=== CoreServer Deploy Complete ===" -ForegroundColor Green
    Write-Host "Server Admin Panel: https://cp.coreserver.jp/"
    Write-Host "Application URL: https://jungamer.uk/$APP_NAME"
    Write-Host "`nNext Steps:"
    Write-Host "1. Check domain settings in CoreServer admin panel"
    Write-Host "2. Verify Node.js process startup"
    Write-Host "3. Confirm SSL settings are enabled in Cloudflare"
    
} catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clear passphrase for security
    if ($plainPassphrase) {
        $plainPassphrase = $null
    }
}
