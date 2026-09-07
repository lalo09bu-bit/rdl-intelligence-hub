@echo off
:: ============================================================
:: RDL INTELLIGENCE HUB - PLATAFORMA CORPORATIVA NATIVA
:: ============================================================
title RDL Intelligence Hub
color 0A

:: Navegar dinamicamente a la carpeta del programa
cd /d "%~dp0"

:: Buscar ejecutable de Node.js (portable de bin\node.exe o sistema)
set "NODE_BIN=%~dp0bin\node.exe"
if not exist "%NODE_BIN%" set "NODE_BIN=node"

echo  [1/2] Iniciando servidor backend RDL en puerto 9060...
start "RDL_SERVER" /min cmd /c ""%NODE_BIN%" "%~dp0server\server.js" > "%~dp0server_output.log" 2>&1"

echo  [2/2] Verificando conexion activa en http://localhost:9060...

:: Esperar a que el servidor backend responda OK en el puerto 9060
powershell -Command "for ($i=0; $i -lt 15; $i++) { $r = Try { (Invoke-WebRequest -Uri 'http://localhost:9060/api/health' -TimeoutSec 1 -UseBasicParsing).StatusCode } Catch { 0 }; if ($r -eq 200) { break }; Start-Sleep -Milliseconds 500 }" >nul 2>&1

:: Lanzar la ventana en modo ejecutable nativo de escritorio
set "RDL_PROFILE=%LOCALAPPDATA%\RDL_Hub_Profile"
start msedge --app=http://localhost:9060 --user-data-dir="%RDL_PROFILE%" --window-size=1360,860 || start chrome --app=http://localhost:9060 --user-data-dir="%RDL_PROFILE%" || start http://localhost:9060

exit
