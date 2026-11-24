@echo off
chcp 65001 > nul
cls
echo ============================================================
echo           📱 CHΔNCE — Lanzador Nativo de Expo Go
echo ============================================================
echo.
echo 1. Verificando motor de CHΔNCE en puerto 5173...
start /min "CHANCE Engine" cmd /c "cd /d C:\Users\Pablo\.gemini\antigravity\scratch\mia && npm.cmd run preview -- --host --port 5173"
timeout /t 2 > nul

echo.
echo 2. Iniciando Expo Metro en Red Local Wi-Fi (Sin requerir cuentas ni login)...
echo.
echo ============================================================
echo  📲 INSTRUCCIONES PARA TU IPHONE:
echo  1. Asegurate de que tu iPhone este conectado al mismo Wi-Fi.
echo  2. Abre la app 'Expo Go'.
echo  3. En la pestaña principal, en 'Development servers', pulsa sobre 'CHΔNCE'.
echo  4. O escanea el codigo QR que aparecera a continuacion.
echo  5. ¡Listo! Abre sin pedirte ningun usuario ni contraseña.
echo ============================================================
echo.

set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.15
cd /d "C:\Users\Pablo\.gemini\antigravity\scratch\mia-mobile"
call npx expo start --lan
pause
