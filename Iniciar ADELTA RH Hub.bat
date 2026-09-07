@echo off
:: ============================================================
:: ADELTA RH Intelligence Hub - Lanzador de 1 Clic
:: ============================================================
title ADELTA RH Intelligence Hub - Módulo Cliente
color 0B

echo ========================================================================
echo               ADELTA RH Intelligence Hub - Módulo Cliente
echo ========================================================================
echo.
echo  Iniciando el servidor de backend (Node.js + Socket.io + SQLite)...
echo.

cd /d "%~dp0"

:: Iniciar servidor Node en segundo plano
start "ADELTA_RH_SERVER" /min cmd /c "pnpm run start"

echo  Esperando activacion en puerto 9060...
ping 127.0.0.1 -n 3 >nul

echo  Abriendo interfaz de usuario en http://localhost:9060 ...
start http://localhost:9060

echo.
echo ========================================================================
echo  ✅ ADELTA RH Client Hub esta activo.
echo  Esta ventana se cerrara automaticamente en 5 segundos.
echo ========================================================================
echo.
ping 127.0.0.1 -n 5 >nul
exit
