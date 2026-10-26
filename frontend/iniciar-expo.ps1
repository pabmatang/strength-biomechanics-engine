# CHΔNCE - Lanzador Nativo Expo Go para iPhone (Sin Login)
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     📱 CHΔNCE — Lanzador Nativo de Expo Go (Sin Login)     " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "`n1. Verificando motor de CHΔNCE en puerto 5173..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d C:\Users\Pablo\.gemini\antigravity\scratch\mia && npm.cmd run preview -- --host --port 5173" -WindowStyle Minimized
Start-Sleep -Seconds 2

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " 📲 INSTRUCCIONES PARA TU IPHONE (Sin cuentas de Expo):" -ForegroundColor Yellow
Write-Host " 1. Asegúrate de que tu iPhone esté en el mismo Wi-Fi que el PC." -ForegroundColor White
Write-Host " 2. Abre la app Expo Go en tu iPhone." -ForegroundColor White
Write-Host " 3. En la pantalla principal verás 'CHΔNCE' en 'Development servers' (toca sobre él)," -ForegroundColor Green
Write-Host "    o escanea el código QR que aparecerá abajo." -ForegroundColor Green
Write-Host " 4. También puedes abrir Safari y escribir:" -ForegroundColor White
Write-Host "    exp://192.168.1.15:8081" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.15"
Set-Location "C:\Users\Pablo\.gemini\antigravity\scratch\mia-mobile"
npx.cmd expo start --lan
