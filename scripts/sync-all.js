import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const pkgDir = path.join(rootDir, 'OutputInstaller', 'RDL_Intelligence_Hub_Package');
const appDataDir = path.join(process.env.LOCALAPPDATA, 'RDL Intelligence Hub');

console.log('Sincronizando archivos del proyecto a OutputInstaller y AppData...');

// Directorios y archivos a sincronizar
const targets = [
    { src: 'dist', isDir: true },
    { src: 'public', isDir: true },
    { src: 'server', isDir: true },
    { src: '.env', isDir: false },
    { src: 'rdl_intelligence_hub.db', isDir: false },
    { src: 'Iniciar RDL Intelligence Hub.vbs', isDir: false },
    { src: 'Iniciar RDL Intelligence Hub.bat', isDir: false }
];

targets.forEach(item => {
    const srcPath = path.join(rootDir, item.src);
    const pkgDest = path.join(pkgDir, item.src);
    const appDataDest = path.join(appDataDir, item.src);

    if (fs.existsSync(srcPath)) {
        // Copiar a OutputInstaller Package
        if (item.isDir) {
            fs.cpSync(srcPath, pkgDest, { recursive: true, force: true });
        } else {
            fs.copyFileSync(srcPath, pkgDest);
        }

        // Copiar a AppData (Instalación local)
        if (fs.existsSync(appDataDir)) {
            if (item.isDir) {
                fs.cpSync(srcPath, appDataDest, { recursive: true, force: true });
            } else {
                fs.copyFileSync(srcPath, appDataDest);
            }
        }
    }
});

console.log('✅ ¡Sincronización a OutputInstaller y AppData completada!');
