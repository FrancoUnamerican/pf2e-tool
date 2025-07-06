@echo off
REM Git Sync Script for SuperMegaPF2EApp (Windows)
REM This script helps automate common Git operations

setlocal enabledelayedexpansion

REM Check if we're in a git repository
if not exist ".git" (
    echo [ERROR] Not in a Git repository. Please run this script from your project root.
    exit /b 1
)

REM Parse command line arguments
set "COMMAND=%~1"
set "MESSAGE=%~2"

if "%COMMAND%"=="" set "COMMAND=help"

if "%COMMAND%"=="pull" goto :pull
if "%COMMAND%"=="push" goto :push
if "%COMMAND%"=="sync" goto :sync
if "%COMMAND%"=="status" goto :status
if "%COMMAND%"=="help" goto :help
if "%COMMAND%"=="--help" goto :help
if "%COMMAND%"=="-h" goto :help

echo [ERROR] Unknown command: %COMMAND%
echo.
goto :help

:pull
echo [INFO] Pulling latest changes from GitHub...
git fetch origin
git pull origin main
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Successfully pulled changes from GitHub.
) else (
    echo [ERROR] Failed to pull changes. Please resolve conflicts manually.
    exit /b 1
)
goto :end

:push
echo [INFO] Preparing to push changes to GitHub...

REM Check if there are any changes to commit
git status --porcelain > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] No changes to commit.
    goto :end
)

REM Show status
echo [INFO] Current repository status:
git status --short

REM Add all changes
echo [INFO] Adding all changes...
git add .

REM Commit with automatic message or custom message
if "%MESSAGE%"=="" (
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set "DATE=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIME=%%a:%%b"
    set "COMMIT_MSG=Auto-sync: !DATE! !TIME!"
) else (
    set "COMMIT_MSG=%MESSAGE%"
)

echo [INFO] Committing changes with message: '!COMMIT_MSG!'
git commit -m "!COMMIT_MSG!" -m "" -m "🤖 Generated with Claude Code" -m "" -m "Co-Authored-By: Claude <noreply@anthropic.com>"

if %ERRORLEVEL% EQU 0 (
    echo [INFO] Successfully committed changes.
    
    REM Push to GitHub
    echo [INFO] Pushing to GitHub...
    git push origin main
    
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Successfully pushed changes to GitHub!
    ) else (
        echo [ERROR] Failed to push changes to GitHub.
        exit /b 1
    )
) else (
    echo [ERROR] Failed to commit changes.
    exit /b 1
)
goto :end

:sync
echo [INFO] Syncing with GitHub (pull + push)...
call :pull
if %ERRORLEVEL% NEQ 0 exit /b 1
call :push
goto :end

:status
echo [INFO] Repository Status:
echo.
git status
echo.
echo [INFO] Recent commits:
git log --oneline -5
goto :end

:help
echo Git Sync Script for SuperMegaPF2EApp (Windows)
echo.
echo Usage: %~n0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   pull                     Pull latest changes from GitHub
echo   push [message]           Push changes to GitHub with optional commit message
echo   sync [message]           Pull then push changes (full sync)
echo   status                   Show repository status
echo   help                     Show this help message
echo.
echo Examples:
echo   %~n0 pull                  # Pull latest changes
echo   %~n0 push                  # Push with automatic commit message
echo   %~n0 push "Add new feature" # Push with custom commit message
echo   %~n0 sync                  # Full sync with automatic message
echo   %~n0 sync "Update UI"      # Full sync with custom message
goto :end

:end
endlocal