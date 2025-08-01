@echo off
REM Windows用リモートデプロイスクリプト
REM Usage: deploy-remote.bat production your-server.com ubuntu

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
set SERVER_HOST=%2
set SERVER_USER=%3

if "%ENVIRONMENT%"=="" set ENVIRONMENT=production
if "%SERVER_HOST%"=="" set SERVER_HOST=your-server.com
if "%SERVER_USER%"=="" set SERVER_USER=ubuntu

set APP_NAME=test-website

echo === リモートデプロイ開始 ===
echo 環境: %ENVIRONMENT%
echo サーバー: %SERVER_HOST%
echo ユーザー: %SERVER_USER%

REM SSHキーの確認
if not exist "%USERPROFILE%\.ssh\id_rsa" (
    echo エラー: SSHキーが見つかりません
    echo ssh-keygen -t rsa -b 4096 -C "your-email@example.com" でキーを生成してください
    pause
    exit /b 1
)

REM サーバーの疎通確認
echo サーバーへの接続確認中...
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_HOST% "echo 'SSH接続成功'"
if errorlevel 1 (
    echo エラー: サーバーに接続できません
    pause
    exit /b 1
)

REM デプロイスクリプトのアップロード
echo デプロイスクリプトをアップロード中...
scp deploy\*.sh %SERVER_USER%@%SERVER_HOST%:/tmp/
if errorlevel 1 (
    echo エラー: ファイルのアップロードに失敗しました
    pause
    exit /b 1
)

REM 環境変数ファイルのアップロード
if exist "deploy\.env.%ENVIRONMENT%" (
    echo 環境変数ファイルをアップロード中...
    ssh %SERVER_USER%@%SERVER_HOST% "sudo mkdir -p /etc/%APP_NAME%"
    scp deploy\.env.%ENVIRONMENT% %SERVER_USER%@%SERVER_HOST%:/tmp/
    ssh %SERVER_USER%@%SERVER_HOST% "sudo mv /tmp/.env.%ENVIRONMENT% /etc/%APP_NAME%/"
) else (
    echo 警告: 環境変数ファイル deploy\.env.%ENVIRONMENT% が見つかりません
)

REM 初回セットアップの確認
set /p SETUP="初回セットアップを実行しますか？ (y/N): "
if /i "%SETUP%"=="y" (
    echo サーバーセットアップを実行中...
    ssh %SERVER_USER%@%SERVER_HOST% "chmod +x /tmp/server-setup.sh && sudo /tmp/server-setup.sh"
)

REM アプリケーションのデプロイ
echo アプリケーションデプロイを実行中...
ssh %SERVER_USER%@%SERVER_HOST% "chmod +x /tmp/deploy.sh && /tmp/deploy.sh %ENVIRONMENT%"
if errorlevel 1 (
    echo エラー: デプロイに失敗しました
    pause
    exit /b 1
)

REM デプロイ後の確認
echo デプロイ状況を確認中...
ssh %SERVER_USER%@%SERVER_HOST% "pm2 status && pm2 logs %APP_NAME% --lines 10"

echo.
echo === デプロイ完了 ===
echo アプリケーションURL: https://%SERVER_HOST%
echo 管理画面: https://%SERVER_HOST%/admin
echo.
echo 便利なコマンド:
echo   ログ確認: ssh %SERVER_USER%@%SERVER_HOST% "pm2 logs %APP_NAME%"
echo   再起動: ssh %SERVER_USER%@%SERVER_HOST% "pm2 restart %APP_NAME%"
echo   停止: ssh %SERVER_USER%@%SERVER_HOST% "pm2 stop %APP_NAME%"

pause
