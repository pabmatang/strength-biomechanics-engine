@echo off
chcp 65001 > nul
cls
echo ============================================================
echo           🚀 CHΔNCE — Lanzador de App para iPhone / Android
echo ============================================================
echo.
cd /d "C:\Users\Pablo\.gemini\antigravity\scratch\mia"

echo Liberando puerto 5173 previo...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo 1. Compilando la app en modo produccion optimizado...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la compilacion.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Obteniendo tu IP publica para el tunel...
powershell -Command "$ip = (Invoke-RestMethod https://loca.lt/mytunnelpassword).Trim(); Write-Host '   -> Tu contrasena de tunel es: ' -NoNewline; Write-Host $ip -ForegroundColor Green; Set-Clipboard -Value $ip; Write-Host '   (Copiada automaticamente al portapapeles!)' -ForegroundColor Cyan"

echo.
echo 3. Levantando servidor estatico en puerto 5173...
start /min "CHANCE Server" cmd /c "npm.cmd run preview -- --host --port 5173"
timeout /t 2 > nul

echo.
echo ============================================================
echo  📲 INSTRUCCIONES PARA INSTALAR EN TU IPHONE:
echo  1. Abre https://chance-fitness.loca.lt en Safari de tu iPhone.
echo  2. Pega tu IP si Localtunnel te pide la contrasena y dale a Submit.
echo  3. En Safari, pulsa el boton COMPARTIR (icono de cuadrado con flecha hacia arriba).
echo  4. Selecciona 'Anadir a pantalla de inicio'.
echo  5. Tendras la app CHΔNCE instalada en tu iPhone a pantalla completa sin Safari.
echo ============================================================
echo.

npx localtunnel --port 5173 --subdomain chance-fitness
