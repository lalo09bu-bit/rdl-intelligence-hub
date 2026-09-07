import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.join(__dirname, '..');
const outputInstallerDir = path.join(projectDir, 'OutputInstaller');
const targetExe = path.join(outputInstallerDir, 'RDL_Intelligence_Hub_Setup.exe');
const desktopExe = path.join(process.env.USERPROFILE, 'OneDrive - RECLUTAMIENTO E INTEGRACION DE TALENTO', 'Escritorio', 'RDL_Intelligence_Hub_Setup.exe');
const tempZip = path.join(outputInstallerDir, 'rdl_payload.zip');
const csharpFile = path.join(outputInstallerDir, 'InstallerSource.cs');
const pkgDir = path.join(outputInstallerDir, 'RDL_Intelligence_Hub_Package');

console.log('========================================================================');
console.log('📦 COMPILANDO INSTALADOR AUTÓNOMO DE 1 SOLO ARCHIVO .EXE DE RDL HUB');
console.log('========================================================================\n');

// 1. Crear el Zip comprimido del paquete de la app
console.log('⚡ [1/3] Comprimiendo la plataforma RDL en paquete ZIP...');
if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);

const psZipCmd = `powershell -Command "Compress-Archive -Path '${pkgDir.replace(/\\/g, '\\\\')}\\*' -DestinationPath '${tempZip.replace(/\\/g, '\\\\')}' -Force"`;
execSync(psZipCmd, { cwd: projectDir });

// 2. Leer los bytes del Zip y convertirlos a Base64 puro
console.log('🔐 [2/3] Generando payload Base64 seguro para integrarlo al binario C#...');
const zipBuffer = fs.readFileSync(tempZip);
const base64Payload = zipBuffer.toString('base64');

// 3. Generar el código fuente C# con el payload Base64 incrustado
console.log('⚙️ [3/3] Compilando instalador .EXE autónomo con csc.exe nativo de Windows...');

const csharpSource = `using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Threading;

namespace RDLInstaller {
    class Program {
        // Payload Base64 incrustado de la plataforma
        static string base64Payload = "${base64Payload}";

        static void Main(string[] args) {
            try {
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string installDir = Path.Combine(localAppData, "RDL Intelligence Hub");

                Console.Title = "Instalador RDL Intelligence Hub v1.0.0";
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("========================================================================");
                Console.WriteLine("        INSTALADOR OFICIAL DE WINDOWS - RDL INTELLIGENCE HUB");
                Console.WriteLine("        Reclutamiento e Integracion de Talento");
                Console.WriteLine("========================================================================");
                Console.WriteLine();
                Console.ResetColor();

                Console.WriteLine("[1/3] Preparando directorio de instalacion:");
                Console.WriteLine("      " + installDir);
                Console.WriteLine();

                if (!Directory.Exists(installDir)) {
                    Directory.CreateDirectory(installDir);
                }

                Console.WriteLine("[2/3] Extrayendo archivos y componentes del sistema...");
                byte[] zipBytes = Convert.FromBase64String(base64Payload);

                string tempZipPath = Path.Combine(Path.GetTempPath(), "rdl_extract_temp_" + Guid.NewGuid().ToString("N") + ".zip");
                File.WriteAllBytes(tempZipPath, zipBytes);

                if (File.Exists(tempZipPath)) {
                    using (ZipArchive archive = ZipFile.OpenRead(tempZipPath)) {
                        foreach (ZipArchiveEntry entry in archive.Entries) {
                            string destinationPath = Path.Combine(installDir, entry.FullName);
                            string dirPath = Path.GetDirectoryName(destinationPath);
                            
                            if (!string.IsNullOrEmpty(dirPath) && !Directory.Exists(dirPath)) {
                                Directory.CreateDirectory(dirPath);
                            }
                            if (!string.IsNullOrEmpty(entry.Name)) {
                                entry.ExtractToFile(destinationPath, true);
                            }
                        }
                    }
                    File.Delete(tempZipPath);
                }

                Console.WriteLine();
                Console.WriteLine("[3/3] Registrando acceso directo en el Escritorio con icono RDL...");

                string batLauncher = Path.Combine(installDir, "Iniciar RDL Intelligence Hub.bat");
                string logoIco = Path.Combine(installDir, "Logo RDL.ico");
                string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string shortcutPath = Path.Combine(desktopDir, "RDL Intelligence Hub.lnk");

                CreateShortcut(shortcutPath, batLauncher, installDir, logoIco);

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine();
                Console.WriteLine("========================================================================");
                Console.WriteLine(" ✅ INSTALACION COMPLETADA EXITOSAMENTE");
                Console.WriteLine(" Se creo el acceso directo en tu Escritorio con el logo oficial RDL.");
                Console.WriteLine("========================================================================");
                Console.ResetColor();

                Console.WriteLine();
                Console.WriteLine("Iniciando la aplicacion en 2 segundos...");
                Thread.Sleep(2000);

                if (File.Exists(batLauncher)) {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = batLauncher;
                    psi.WorkingDirectory = installDir;
                    psi.UseShellExecute = true;
                    Process.Start(psi);
                }
            } catch (Exception ex) {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("❌ Error durante la instalacion: " + ex.Message);
                Console.ResetColor();
                Console.WriteLine("Presiona cualquier tecla para salir...");
                Console.ReadKey();
            }
        }

        static void CreateShortcut(string shortcutPath, string targetPath, string workDir, string iconPath) {
            try {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                dynamic shell = Activator.CreateInstance(shellType);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetPath;
                shortcut.WorkingDirectory = workDir;
                shortcut.IconLocation = iconPath;
                shortcut.Description = "RDL Intelligence Hub - Plataforma Corporativa";
                shortcut.Save();
            } catch {}
        }
    }
}
`;

fs.writeFileSync(csharpFile, csharpSource);

// 4. Compilar con csc.exe nativo de Windows
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
if (fs.existsSync(targetExe)) fs.unlinkSync(targetExe);

const cscCmd = `"${cscPath}" /out:"${targetExe}" /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "${csharpFile}"`;
execSync(cscCmd, { cwd: outputInstallerDir });

// Copiar al Escritorio
fs.copyFileSync(targetExe, desktopExe);

const stat = fs.statSync(targetExe);

console.log('\n========================================================================');
console.log(`✅ ¡INSTALADOR .EXE 100% AUTÓNOMO CREADO SIN ERRORES!`);
console.log(`   -> ${targetExe}`);
console.log(`   -> ${desktopExe}`);
console.log(`   Tamaño del Instalador: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
console.log('========================================================================\n');

// Limpieza de temporales
if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
if (fs.existsSync(csharpFile)) fs.unlinkSync(csharpFile);
