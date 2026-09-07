import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.join(__dirname, '..');
const desktopDir = path.join(process.env.USERPROFILE, 'OneDrive - RECLUTAMIENTO E INTEGRACION DE TALENTO', 'Escritorio');

const targetBat = path.join(projectDir, 'Iniciar RDL Intelligence Hub.bat');
const iconIco = path.join(projectDir, 'Logo RDL.ico');
const shortcutPath = path.join(desktopDir, 'RDL Intelligence Hub.lnk');

const vbsScript = `
Set WshShell = CreateObject("WScript.Shell")
Set shortcut = WshShell.CreateShortcut("${shortcutPath.replace(/\\/g, '\\\\')}")
shortcut.TargetPath = "${targetBat.replace(/\\/g, '\\\\')}"
shortcut.WorkingDirectory = "${projectDir.replace(/\\/g, '\\\\')}"
shortcut.IconLocation = "${iconIco.replace(/\\/g, '\\\\')}"
shortcut.Description = "RDL Intelligence Hub - Plataforma Corporativa"
shortcut.Save
`;

const tempVbs = path.join(projectDir, 'create_shortcut_temp.vbs');
fs.writeFileSync(tempVbs, vbsScript);

try {
    execSync(`cscript //Nologo "${tempVbs}"`);
    console.log(`✅ Acceso Directo con Icono RDL creado exitosamente en el Escritorio:\n   -> ${shortcutPath}`);
} catch (err) {
    console.error('Error al crear acceso directo:', err);
} finally {
    if (fs.existsSync(tempVbs)) fs.unlinkSync(tempVbs);
}
