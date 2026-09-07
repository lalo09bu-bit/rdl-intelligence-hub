$desktopDir = [System.Environment]::GetFolderPath('Desktop')
$projectDir = Split-Path -Path $PSScriptRoot -Parent

$targetBat = Join-Path -Path $projectDir -ChildPath "Iniciar RDL Intelligence Hub.bat"
$iconIco = Join-Path -Path $projectDir -ChildPath "Logo RDL.ico"
$shortcutPath = Join-Path -Path $desktopDir -ChildPath "RDL Intelligence Hub.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $targetBat
$Shortcut.WorkingDirectory = $projectDir
$Shortcut.IconLocation = $iconIco
$Shortcut.Description = "RDL Intelligence Hub - Plataforma Corporativa"
$Shortcut.Save()

Write-Host "✅ Acceso Directo (.lnk) con Icono RDL.ico creado exitosamente en: $shortcutPath"
