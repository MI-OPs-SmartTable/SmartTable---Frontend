const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const backendRoot = process.env.SMARTTABLE_BACKEND_PATH
  ? path.resolve(process.env.SMARTTABLE_BACKEND_PATH)
  : path.resolve(__dirname, '../../SmartTable---Backend-nog');

if (!fs.existsSync(backendRoot)) {
  console.warn(`Backend no encontrado en: ${backendRoot}`);
  process.exitCode = 1;
  process.exit(1);
}

try {
  execSync(
    `npx @electron/rebuild -f -w better-sqlite3 --module-dir "${backendRoot}"`,
    { stdio: 'inherit', shell: true }
  );
} catch {
  console.warn('No se pudo recompilar better-sqlite3 para Electron. Cierra el backend e intenta de nuevo.');
  process.exitCode = 1;
}
