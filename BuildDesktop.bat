@echo off
setlocal DisableDelayedExpansion

REM Check for Administrator privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Requesting Administrator privileges to compile app...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "cmd.exe", "/c ""%~s0""", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    pushd "%CD%"
    CD /D "%~dp0"

echo ==========================================
echo       FEDER DESKTOP BUILDER
echo ==========================================
echo.
echo Cleaning previous builds...
rmdir /s /q dist_electron 2>nul
echo.
echo Starting build process...
call npm run electron:build

if %errorlevel% NEQ 0 (
    echo.
    echo ==========================================
    echo         BUILD FAILED
    echo ==========================================
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo         BUILD SUCCESSFUL
echo ==========================================
echo.
pause
