@echo off
REM Stop Lock PC Server

echo Stopping Lock PC Server...
cd /d "%~dp0"
docker-compose down

echo.
echo Server stopped.
echo.
echo To remove all data (including database):
echo   docker-compose down -v
echo.
pause
