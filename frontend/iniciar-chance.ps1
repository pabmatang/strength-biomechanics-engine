# CHΔNCE - Lanzador Móvil para iPhone y Android
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       🚀 CHΔNCE — Lanzador de App para iPhone / Android     " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location "C:\Users\Pablo\.gemini\antigravity\scratch\mia"

# Liberar puerto 5173 si estaba ocupado por dev server previo
$existing = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($existing) {
    Write-Host "Liberando puerto 5173..." -ForegroundColor Gray
    foreach ($p in $existing) {
        if ($p -gt 0) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }
    }
}

Write-Host "`n1. Compilando aplicación en modo producción (dist)..." -ForegroundColor White
npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error durante la compilación." -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Obteniendo tu IP pública para el túnel..." -ForegroundColor White
$ip = ""
try {
    $ip = (Invoke-RestMethod -Uri "https://loca.lt/mytunnelpassword" -TimeoutSec 5).Trim()
    Write-Host "   -> Tu contraseña de túnel es: " -NoNewline -ForegroundColor White
    Write-Host "$ip" -ForegroundColor Green
    Set-Clipboard -Value $ip
    Write-Host "   (¡Copiada automáticamente al portapapeles!)" -ForegroundColor Cyan
} catch {
    Write-Host "   No se pudo autodetectar la IP. Consulta tu IP en https://loca.lt/mytunnelpassword" -ForegroundColor Yellow
}

Write-Host "`n3. Levantando servidor estático de producción en puerto 5173..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm.cmd run preview -- --host --port 5173" -WindowStyle Minimized
Start-Sleep -Seconds 2

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " 📲 CÓMO INSTALAR EN TU IPHONE (Sin Safari / App completa):" -ForegroundColor Yellow
Write-Host " 1. Abre https://chance-fitness.loca.lt en Safari de tu iPhone." -ForegroundColor White
Write-Host " 2. En la pantalla de bienvenida de Localtunnel, pega tu IP: $ip" -ForegroundColor White
Write-Host " 3. Toca 'Click to Submit' (la app cargará completa y sin pantalla blanca)." -ForegroundColor White
Write-Host " 4. Pulsa el botón COMPARTIR de Safari (icono de cuadrado con flecha ↑)." -ForegroundColor White
Write-Host " 5. Selecciona 'Añadir a pantalla de inicio' (Add to Home Screen)." -ForegroundColor White
Write-Host " 6. ¡Listo! Se instalará en el escritorio de tu iPhone con su icono propio" -ForegroundColor Green
Write-Host "    azul 'CHΔNCE', pantalla completa y SIN barra de navegación web." -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan

npx.cmd localtunnel --port 5173 --subdomain chance-fitness
