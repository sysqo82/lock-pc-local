@echo off
REM Start Lock PC Server with Docker (Windows batch version)

echo ================================================================
echo Starting Lock PC Server (Docker)
echo ================================================================
echo.

cd /d "%~dp0"

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Build and start containers
echo Building and starting containers...
docker-compose up -d --build

REM Wait for services to be ready
echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Check if containers are running
docker ps | findstr "lockpc-server" >nul
if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start!
    echo Check logs: docker-compose logs
    pause
    exit /b 1
)

echo.
echo ================================================================
echo Server is running!
echo ================================================================
echo.
echo Local Access:
echo   http://localhost:3000
echo.
echo Useful Commands:
echo   View logs:   docker-compose logs -f
echo   Stop server: docker-compose down
echo   Restart:     docker-compose restart
echo.
echo For remote access from Android app:
echo   1. Start tunnel: lt --port 3000 --subdomain lockpc
echo   2. Update Android app URL to tunnel address
echo.
echo ================================================================
echo.
pause
