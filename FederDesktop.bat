@echo off
echo Starting Feder Desktop...

REM Check if the unpacked executable exists (from a partial or full build)
if exist "dist_electron\win-unpacked\Feder.exe" (
    echo Launching Production Build...
    start "" "dist_electron\win-unpacked\Feder.exe"
) else (
    echo Production build not found. Starting in Development Mode...
    echo (Note: Close the terminal to stop the app)
    npm run electron:dev
)
