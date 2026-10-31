@echo off
setlocal
cd /d "%~dp0"
title DOCULAB - Inicio local
where py >nul 2>nul
if errorlevel 1 (
  echo No se encontro Python. Instala Python 3.10 o superior y activa "Add Python to PATH".
  pause
  exit /b 1
)
if not exist "local_server\.venv\Scripts\python.exe" (
  echo Preparando el entorno de DOCULAB...
  py -3 -m venv local_server\.venv
  if errorlevel 1 goto error
  local_server\.venv\Scripts\python.exe -m pip install --upgrade pip
  local_server\.venv\Scripts\python.exe -m pip install -r local_server\requirements.txt
  if errorlevel 1 goto error
)
echo Iniciando servidor de IA local...
start "DOCULAB - IA local" cmd /k "cd /d ""%~dp0local_server"" && ..\.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8000"
echo Iniciando aplicacion web...
start "DOCULAB - Aplicacion" cmd /k "cd /d ""%~dp0"" && py -m http.server 8080"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/"
echo.
echo DOCULAB esta iniciando. No cierres las dos ventanas de consola.
echo Para detenerlo, cierra ambas ventanas.
exit /b 0
:error
echo.
echo No se pudo preparar DOCULAB. Revisa la instalacion de Python y tu conexion a Internet.
pause
exit /b 1
