@echo off
setlocal EnableDelayedExpansion

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

REM Check if node_modules exists
if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    call npm install
    if %errorlevel% NEQ 0 (
        echo.
        echo Failed to install dependencies.
        pause
        exit /b %errorlevel%
    )
)

echo Cleaning previous builds...
rmdir /s /q dist_electron 2>nul
rmdir /s /q dist 2>nul
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
echo Copying installer to download_installer folder...
if not exist "download_installer" mkdir "download_installer"

REM Find the generated .exe in the dist_electron directory and copy it
set "FOUND_EXE=0"
for %%f in (dist_electron\*.exe) do (
    echo Found installer: %%~nxf
    copy /Y "%%f" "download_installer\" >nul
    set "FOUND_EXE=1"
)

if "!FOUND_EXE!"=="0" (
    echo.
    echo WARNING: No .exe installer found in the 'dist_electron' directory.
    echo Please check the build output above.
) else (
    echo.
    echo Installer successfully copied to download_installer folder.
)

echo.
echo ==========================================
echo         BUILD SUCCESSFUL
echo ==========================================
echo.
pause
