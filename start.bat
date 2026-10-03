@echo off
title SHAISTINE PRIVE - Local Server
echo ============================================================
echo   SHAISTINE PRIVE - Haute Parfumerie Local Server
echo ============================================================
echo.
echo Starting local web server on port 8080...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8080
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Server stopped or encountered an error.
    pause
)
