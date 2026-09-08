@echo off
title RDL Intelligence Hub - Servidor 24/7 Azure VM
echo ========================================================
echo  RDL INTELLIGENCE HUB (SERVIDOR 24/7 EN AZURE)
echo ========================================================
cd /d "%~dp0.."
node server/server.js
pause
