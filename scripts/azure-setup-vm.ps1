# ==============================================================================
# RDL INTELLIGENCE HUB - CONFIGURACIÓN AUTOMÁTICA EN AZURE VM (WINDOWS)
# ==============================================================================
# 1. Abre el puerto 9060 en Windows Defender Firewall (Entrada TCP)
# 2. Comprueba Node.js y paquetes del servidor
# 3. Detecta las IPs de conexión para compartir el enlace
# ==============================================================================

# Validar permisos de administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "❌ ATENCIÓN: Se requieren permisos de Administrador para configurar el Firewall." -ForegroundColor Red
    Write-Host "   Por favor haz clic derecho sobre este script y selecciona 'Ejecutar con PowerShell como Administrador'." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Clear-Host
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🚀 RDL INTELLIGENCE HUB - CONFIGURACIÓN PARA MÁQUINA VIRTUAL AZURE" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Crear regla de Firewall en Windows
$RuleName = "RDL Intelligence Hub (Puerto 9060)"
$existing = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue

if ($existing) {
    Write-Host "✅ Regla de Firewall de Windows ya configurada para puerto 9060." -ForegroundColor Green
} else {
    Write-Host "🔧 Configurando regla en Windows Defender Firewall para puerto 9060..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName $RuleName `
                        -Direction Inbound `
                        -LocalPort 9060 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any `
                        -Description "Acceso corporativo y móvil a RDL Intelligence Hub" | Out-Null
    Write-Host "✅ Regla de Firewall de Windows creada correctamente." -ForegroundColor Green
}

# 2. Verificar Node.js
Write-Host ""
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVer = & node -v
    Write-Host "✅ Node.js instalado: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Node.js no encontrado en PATH. Asegúrate de instalar Node.js v18+ en la VM." -ForegroundColor Red
}

# 3. Detectar IPs
Write-Host ""
Write-Host "🌐 Detectando direcciones de red..." -ForegroundColor Cyan
$privateIPs = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" }).IPAddress
Write-Host "📍 IP Privada de la VM: $($privateIPs -join ', ')" -ForegroundColor White

try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 4).Trim()
    Write-Host "🌍 IP Pública de Azure: $publicIP" -ForegroundColor Green
} catch {
    $publicIP = "<IP_PUBLICA_AZURE>"
    Write-Host "ℹ️ Consulta la IP Pública en el portal de Azure." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "🎉 FIREWALL DE WINDOWS LISTO" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PASO FINAL INDISPENSABLE EN AZURE PORTAL:" -ForegroundColor Yellow
Write-Host "Para que otras computadoras y celulares puedan conectarse por Internet:" -ForegroundColor White
Write-Host "1. En portal.azure.com entra a tu Máquina Virtual." -ForegroundColor White
Write-Host "2. En el menú de la izquierda ve a: Networking (Redes)." -ForegroundColor White
Write-Host "3. Haz clic en 'Add inbound port rule' (Agregar regla de puerto de entrada):" -ForegroundColor White
Write-Host "   - Destination port ranges: 9060" -ForegroundColor Cyan
Write-Host "   - Protocol: TCP" -ForegroundColor Cyan
Write-Host "   - Action: Allow" -ForegroundColor Cyan
Write-Host "   - Priority: 300" -ForegroundColor Cyan
Write-Host "   - Name: Allow_RDL_Hub_9060" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 ENLACE PARA OTRAS COMPUTADORAS Y TELÉFONOS:" -ForegroundColor Yellow
Write-Host "   👉 http://$publicIP:9060" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
pause
