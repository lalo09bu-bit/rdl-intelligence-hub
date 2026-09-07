$vbsPath = "$env:LOCALAPPDATA\RDL Intelligence Hub\Iniciar RDL Intelligence Hub.vbs"
Write-Host "Iniciando VBScript en: $vbsPath"
Start-Process -FilePath "wscript.exe" -ArgumentList "`"$vbsPath`""
Start-Sleep -Seconds 4

$res = Invoke-WebRequest -Uri "http://localhost:9060/api/health" -UseBasicParsing
Write-Host "Status Code: " $res.StatusCode
Write-Host "Response: " $res.Content
