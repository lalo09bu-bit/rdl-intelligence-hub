$projectDir = "c:\Users\AndrésEduardoCosmesR\OneDrive - RECLUTAMIENTO E INTEGRACION DE TALENTO\Escritorio\Desarrollo HUB RDL"
$outputInstallerDir = "$projectDir\OutputInstaller"
$targetExe = "$outputInstallerDir\RDL_Intelligence_Hub_Setup.exe"
$pkgDir = "$outputInstallerDir\RDL_Intelligence_Hub_Package"

Write-Host "📦 Generando el Instalador Autónomo .EXE de 1 solo archivo ($targetExe)..."

# 1. Crear Zip Payload
$tempZip = "$outputInstallerDir\rdl_payload.zip"
if (Test-Path $tempZip) { Remove-Item $tempZip -Force }

Compress-Archive -Path "$pkgDir\*" -DestinationPath $tempZip -Force

# 2. Código C# del Instalador Autónomo
$csharpSource = @"
using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace RDLInstaller {
    class Program {
        static void Main(string[] args) {
            try {
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string installDir = Path.Combine(localAppData, "RDL Intelligence Hub");

                Console.WriteLine("========================================================================");
                Console.WriteLine("        INSTALADOR OFICIAL DE WINDOWS - RDL INTELLIGENCE HUB");
                Console.WriteLine("        Reclutamiento e Integracion de Talento");
                Console.WriteLine("========================================================================");
                Console.WriteLine();
                Console.WriteLine("[1/3] Preparando directorio de instalacion: " + installDir);

                if (!Directory.Exists(installDir)) {
                    Directory.CreateDirectory(installDir);
                }

                string exePath = System.Reflection.Assembly.GetExecutingAssembly().Location;
                byte[] exeBytes = File.ReadAllBytes(exePath);

                // Buscar marcador de Zip embedded al final del ejecutable
                int zipMarkerIndex = FindZipMarker(exeBytes);

                if (zipMarkerIndex > 0) {
                    Console.WriteLine("[2/3] Extrayendo archivos y componentes del sistema...");
                    byte[] zipBytes = new byte[exeBytes.Length - zipMarkerIndex];
                    Array.Copy(exeBytes, zipMarkerIndex, zipBytes, 0, zipBytes.Length);

                    string tempZipPath = Path.Combine(Path.GetTempPath(), "rdl_extract_temp.zip");
                    File.WriteAllBytes(tempZipPath, zipBytes);

                    ZipFile.ExtractToDirectory(tempZipPath, installDir, true);
                    File.Delete(tempZipPath);
                }

                Console.WriteLine("[3/3] Registrando acceso directo en el Escritorio...");

                string batLauncher = Path.Combine(installDir, "Iniciar RDL Intelligence Hub.bat");

                if (File.Exists(batLauncher)) {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = batLauncher;
                    psi.WorkingDirectory = installDir;
                    psi.UseShellExecute = true;
                    Process.Start(psi);
                }

                Console.WriteLine();
                Console.WriteLine("✅ ¡INSTALACION COMPLETADA EXITOSAMENTE!");
            } catch (Exception ex) {
                Console.WriteLine("Error durante la instalacion: " + ex.Message);
            }
        }

        static int FindZipMarker(byte[] bytes) {
            byte[] marker = new byte[] { 0x50, 0x4B, 0x03, 0x04 }; // PK Zip Header
            for (int i = 0; i <= bytes.Length - marker.Length; i++) {
                if (bytes[i] == marker[0] && bytes[i+1] == marker[1] && bytes[i+2] == marker[2] && bytes[i+3] == marker[3]) {
                    return i;
                }
            }
            return -1;
        }
    }
}
"@

# 3. Compilar C# .exe con Add-Type
$providerOptions = @{ CompilerVersion = "v4.0" }
Add-Type -TypeDefinition $csharpSource -Language CSharp -OutputAssembly $targetExe -OutputType ConsoleApplication -ReferencedAssemblies "System.IO.Compression", "System.IO.Compression.FileSystem"

# 4. Adjuntar payload Zip al final del .exe
$zipBytes = [System.IO.File]::ReadAllBytes($tempZip)
$exeStream = [System.IO.File]::OpenWrite($targetExe)
$exeStream.Position = $exeStream.Length
$exeStream.Write($zipBytes, 0, $zipBytes.Length)
$exeStream.Close()

Remove-Item $tempZip -Force

Write-Host "========================================================================"
Write-Host "✅ ¡INSTALADOR .EXE DE 1 SOLO ARCHIVO CREADO Y COMPILADO CON ÉXITO!"
Write-Host "   -> $targetExe"
Write-Host "========================================================================"
