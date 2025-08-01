@echo off
REM GMO CoreServer用デプロイスクリプト (Windows)
REM Usage: deploy-coreserver.bat

setlocal enabledelayedexpansion

set SERVER_NUMBER=v2008
set USERNAME=rebelor
set ENVIRONMENT=production
set SERVER_HOST=%SERVER_NUMBER%.coreserver.jp
set APP_NAME=jgm-blog

echo === GMO CoreServer デプロイ開始 ===
echo サーバー: %SERVER_HOST%
echo ユーザー: %USERNAME%
echo 環境: %ENVIRONMENT%

REM SSH鍵の確認
if not exist "%USERPROFILE%\.ssh\jgm_rsa" (
    echo エラー: SSH鍵が見つかりません
    echo %USERPROFILE%\.ssh\jgm_rsa が存在することを確認してください
    pause
    exit /b 1
)

REM サーバーの疎通確認
echo サーバーへの接続確認中...
ssh -i "%USERPROFILE%\.ssh\jgm_rsa" -o ConnectTimeout=10 %USERNAME%@%SERVER_HOST% "echo 'CoreServer SSH接続成功'"
if errorlevel 1 (
    echo エラー: CoreServerに接続できません
    echo 1. SSH鍵がCoreServerに登録されているか確認してください
    echo 2. ユーザー名とサーバー番号が正しいか確認してください
    pause
    exit /b 1
)

REM デプロイスクリプトのアップロード
echo デプロイスクリプトをアップロード中...
scp -i "%USERPROFILE%\.ssh\jgm_rsa" deploy\deploy-coreserver.sh %USERNAME%@%SERVER_HOST%:~/
if errorlevel 1 (
    echo エラー: ファイルのアップロードに失敗しました
    pause
    exit /b 1
)

REM 環境変数ファイルのアップロード（存在する場合）
if exist "deploy\.env.%ENVIRONMENT%" (
    echo 環境変数ファイルをアップロード中...
    scp -i "%USERPROFILE%\.ssh\jgm_rsa" deploy\.env.%ENVIRONMENT% %USERNAME%@%SERVER_HOST%:~/.env.%ENVIRONMENT%
) else (
    echo 警告: 環境変数ファイル deploy\.env.%ENVIRONMENT% が見つかりません
    echo deploy\.env.coreserver.template を参考に作成してください
)

REM Next.js設定ファイルのアップロード
if exist "deploy\next.config.coreserver.ts" (
    echo CoreServer用Next.js設定をアップロード中...
    scp -i "%USERPROFILE%\.ssh\jgm_rsa" deploy\next.config.coreserver.ts %USERNAME%@%SERVER_HOST%:~/next.config.ts.coreserver
)

REM アプリケーションのデプロイ
echo アプリケーションデプロイを実行中...
ssh -i "%USERPROFILE%\.ssh\jgm_rsa" %USERNAME%@%SERVER_HOST% "chmod +x deploy-coreserver.sh && ./deploy-coreserver.sh %ENVIRONMENT%"
if errorlevel 1 (
    echo エラー: デプロイに失敗しました
    pause
    exit /b 1
)

echo.
echo === CoreServerデプロイ完了 ===
echo サーバー管理画面: https://cp.coreserver.jp/
echo アプリケーションURL: https://jungamer.uk/%APP_NAME%
echo.
echo 次のステップ:
echo 1. CoreServer管理画面でドメイン設定を確認
echo 2. Node.jsプロセスの起動確認
echo 3. CloudflareでSSL設定が有効であることを確認
echo.
echo 便利なコマンド:
echo   ログ確認: ssh -i "%USERPROFILE%\.ssh\jgm_rsa" %USERNAME%@%SERVER_HOST% "tail -f logs/%APP_NAME%.log"
echo   プロセス確認: ssh -i "%USERPROFILE%\.ssh\jgm_rsa" %USERNAME%@%SERVER_HOST% "ps aux | grep node"

pause
