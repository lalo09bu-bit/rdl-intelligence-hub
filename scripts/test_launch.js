import { spawn } from 'child_process';
import path from 'path';

const appData = process.env.LOCALAPPDATA;
const appDir = path.join(appData, 'RDL Intelligence Hub');
const nodeBin = path.join(appDir, 'bin', 'node.exe');
const serverScript = path.join(appDir, 'server', 'server.js');

console.log('AppDir:', appDir);
console.log('NodeBin:', nodeBin);
console.log('ServerScript:', serverScript);

const child = spawn(nodeBin, [serverScript], {
    cwd: appDir,
    stdio: 'inherit'
});

child.on('error', (err) => {
    console.error('Child error:', err);
});
