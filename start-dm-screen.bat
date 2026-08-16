@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Stormwreck DM Screen

echo.
echo  Stormwreck DM Screen
echo  --------------------
echo.

call :find_node
if not defined NODE (
  echo Could not find Node.js.
  echo Install the LTS build from https://nodejs.org and re-run this launcher.
  echo.
  pause
  exit /b 1
)

echo Using Node: %NODE%
echo.

REM Already running? Open the library and exit.
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' -UseBasicParsing -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Server already running — opening http://127.0.0.1:3000/
  start "" "http://127.0.0.1:3000/"
  echo.
  pause
  exit /b 0
)

echo Starting server on http://127.0.0.1:3000/
echo Keep this window open while you play. Close it or press Ctrl+C to stop.
echo.

REM Open the browser shortly after the process starts.
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:3000/"

"%NODE%" "server\index.js"
set "EXITCODE=%ERRORLEVEL%"

if not "%EXITCODE%"=="0" (
  echo.
  echo Server stopped with error code %EXITCODE%.
  pause
)

exit /b %EXITCODE%

:find_node
set "NODE="
where node >nul 2>&1
if %ERRORLEVEL%==0 (
  for /f "delims=" %%I in ('where node 2^>nul') do (
    set "NODE=%%I"
    goto :eof
  )
)
if exist "%ProgramFiles%\nodejs\node.exe" (
  set "NODE=%ProgramFiles%\nodejs\node.exe"
  goto :eof
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
  set "NODE=%ProgramFiles(x86)%\nodejs\node.exe"
  goto :eof
)
if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
  set "NODE=%LOCALAPPDATA%\Programs\node\node.exe"
  goto :eof
)
if exist "%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe" (
  set "NODE=%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe"
  goto :eof
)
goto :eof
