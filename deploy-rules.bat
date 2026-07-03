@echo off
REM Deploy Firestore security rules for the Store project (webauth-aded6).
REM NOTE: keep this file ASCII-only. Chinese characters break cmd.exe.
cd /d "%~dp0"
echo Deploying Firestore rules to webauth-aded6...
firebase deploy --only firestore:rules
echo.
echo Done.
pause
