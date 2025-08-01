@echo off
REM Windows用SSH鍵権限設定スクリプト

echo === SSH鍵の権限設定 ===

REM SSH鍵ファイルの権限設定（Windowsの場合）
echo SSH鍵ファイルの権限を設定中...

REM 鍵ファイルの所有者のみ読み取り可能に設定
icacls "%USERPROFILE%\.ssh\jgm_rsa" /inheritance:r
icacls "%USERPROFILE%\.ssh\jgm_rsa" /grant:r "%USERNAME%":R

echo SSH鍵の権限設定完了

echo === SSH接続テスト ===
echo 以下のコマンドでサーバーに接続をテストしてください：
echo ssh -i "%USERPROFILE%\.ssh\jgm_rsa" rebelor@v2008.coreserver.jp

echo === 公開鍵の内容 ===
echo サーバーの ~/.ssh/authorized_keys に以下の公開鍵を追加してください：
echo.

REM 対応する公開鍵ファイルがあるかチェック
if exist "%USERPROFILE%\.ssh\jgm_rsa.pub" (
    type "%USERPROFILE%\.ssh\jgm_rsa.pub"
) else (
    echo 公開鍵ファイル（jgm_rsa.pub）が見つかりません。
    echo 以下のコマンドで公開鍵を生成してください：
    echo ssh-keygen -y -f "%USERPROFILE%\.ssh\jgm_rsa" ^> "%USERPROFILE%\.ssh\jgm_rsa.pub"
)

pause
