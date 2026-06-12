@echo off
chcp 65001 >nul
cd /d "%~dp0docs"
echo.
echo  露米甜點本地伺服器
echo  網址：http://localhost:8000
echo  按 Ctrl+C 可停止
echo.
start http://localhost:8000
python -m http.server 8000
pause
