@echo off
REM 簡単デプロイスクリプト - rebelor@v2008.coreserver.jp用

echo ===== jgm-blog CoreServer簡単デプロイ =====
echo サーバー: v2008.coreserver.jp
echo ユーザー: rebelor
echo アプリケーション: jgm-blog
echo.

REM SSH鍵の確認
if not exist "%USERPROFILE%\.ssh\jgm_rsa" (
    echo エラー: SSH鍵が見つかりません
    echo %USERPROFILE%\.ssh\jgm_rsa が存在することを確認してください
    pause
    exit /b 1
)

REM 環境変数ファイルの確認
if not exist "deploy\.env.production" (
    echo 警告: 環境変数ファイルが見つかりません
    echo deploy\.env.coreserver.template をコピーして deploy\.env.production を作成してください
    set /p CONTINUE="続行しますか？ (y/N): "
    if /i not "%CONTINUE%"=="y" exit /b 1
)

echo 接続テスト中...
ssh -i "%USERPROFILE%\.ssh\jgm_rsa" -o ConnectTimeout=10 rebelor@v2008.coreserver.jp "echo 'SSH接続成功'"
if errorlevel 1 (
    echo エラー: SSH接続に失敗しました
    echo 1. SSH鍵がCoreServerに登録されているか確認してください
    echo 2. CoreServerでSSH接続が有効化されているか確認してください
    pause
    exit /b 1
)

echo.
echo デプロイを開始します...
call deploy\deploy-coreserver.bat

echo.
echo ===== デプロイ完了 =====
echo 次のステップ:
echo 1. CoreServer管理画面でドメイン設定を確認
echo 2. SSH接続してNode.jsプロセスを起動
echo    ssh -i "%USERPROFILE%\.ssh\jgm_rsa" rebelor@v2008.coreserver.jp
echo    cd public_html/jgm-blog
echo    nohup node server.js ^> jgm-blog.log 2^>^&1 ^&
echo 3. ブラウザでアプリケーションにアクセス

pause
