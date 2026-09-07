import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'OutputInstaller', 'RDL_Intelligence_Hub_Package');
const destDir = path.join(process.env.LOCALAPPDATA, 'RDL Intelligence Hub');

console.log('Copiando desde:', srcDir);
console.log('Copiando hacia:', destDir);

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.cpSync(srcDir, destDir, { recursive: true, force: true });
console.log('✅ ¡Copia completa a AppData finalizada con éxito!');
