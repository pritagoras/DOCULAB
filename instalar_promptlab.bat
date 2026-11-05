@echo off
title Instalar Disenador de prompts - DOCULAB
echo.
echo  Instalador del Disenador de prompts v2 - DOCULAB
echo  -------------------------------------------------
echo  Este archivo debe estar junto a promptlab.css, promptlab.js
echo  y promptlab-catalog.js (en la misma carpeta o en una subcarpeta js).
echo.
set "REPO=%~1"
if "%REPO%"=="" set /p "REPO=Ruta de la carpeta del repo DOCULAB (Enter = carpeta actual): "
if defined REPO set "REPO=%REPO:"=%"
if defined REPO if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar_promptlab.ps1" -Repo "%REPO%"
if errorlevel 1 echo. & echo  Hubo un error. Revisa el mensaje de arriba.
echo.
pause
