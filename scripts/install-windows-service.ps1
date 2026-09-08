# ==============================================================================
# RDL INTELLIGENCE HUB - SERVICIO 24/7 EN WINDOWS TASK SCHEDULER
# ==============================================================================
# Configura el arranque automático continuo del servidor en la VM de Azure
# para que no se apague al cerrar el Escritorio Remoto (RDP).
# ==============================================================================

$taskName = "RDL_Intelligence_Hub_Server"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$nodeExe = (Get-Command node.exe -ErrorAction SilentlyContinue).Source

if (-not $nodeExe) {
    Write-Host "❌ Node.js no encontrado. Por favor instala Node.js antes de continuar." -ForegroundColor Red
    exit 1
}

$serverJs = Join-Path $projectRoot "server\server.js"
$action = New-ScheduledTaskAction -Execute $nodeExe -Argument "`"$serverJs`"" -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit 0

# Desinstalar tarea previa si existiera
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Registrar tarea
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -User "NT AUTHORITY\SYSTEM" -RunLevel Highest | Out-Null

# Iniciar inmediatamente
Start-ScheduledTask -TaskName $taskName
Write-Host "✅ Servicio RDL Intelligence Hub registrado y en ejecución 24/7 en segundo plano." -ForegroundColor Green
Write-Host "   El servidor continuará activo incluso si cierras la sesión de Escritorio Remoto." -ForegroundColor White
