@echo off
chcp 65001 >nul
title Presentación Clasificador COI
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js. Agregalo a PATH para iniciar la presentacion.
  pause
  exit /b 1
)
node "%~dp0server.mjs" --abrir
if errorlevel 1 pause
