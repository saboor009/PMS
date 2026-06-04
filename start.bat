@echo off
echo Starting Metadesk Global...
start "Metadesk Backend" cmd /k "cd /d "%~dp0metadesk-backend" && npm run dev"
timeout /t 2 /nobreak >nul
start "Metadesk Frontend" cmd /k "cd /d "%~dp0metadesk-frontend" && npm run dev"
timeout /t 4 /nobreak >nul
start http://localhost:5173
echo Both servers started!
