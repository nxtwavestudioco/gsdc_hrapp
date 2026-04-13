@echo off
setlocal

pushd "%~dp0"
if errorlevel 1 (
  echo Failed to map the shared folder to a temporary drive.
  exit /b 1
)

call npm.cmd run dev
set "exit_code=%errorlevel%"

popd
exit /b %exit_code%