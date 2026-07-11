const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const backendPath = process.env.SMARTTABLE_BACKEND_PATH
  ? path.resolve(process.env.SMARTTABLE_BACKEND_PATH)
  : path.resolve(__dirname, '../SmartTable---Backend');

if (!fs.existsSync(backendPath)) {
  throw new Error(
    `Backend no encontrado en: ${backendPath}. Configura SMARTTABLE_BACKEND_PATH en .env`
  );
}

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.smarttable.pos',
  productName: 'SmarTable',
  directories: {
    output: 'release',
  },
  files: [
    'electron/**/*',
    'scripts/**/*',
    'package.json',
  ],
  extraResources: [
    {
      from: backendPath,
      to: 'backend',
      filter: [
        '**/*',
        '!tests/**',
        '!**/*.test.js',
        // No empaquetar .env de desarrollo del PC que hace el build.
        '!.env',
        '!.env.*',
      ],
    },
    {
      from: 'dist',
      to: 'frontend',
    },
  ],
  asarUnpack: ['**/node_modules/better-sqlite3/**'],
  win: {
    target: ['nsis'],
    // Evita descargar/extraer winCodeSign (falla en Windows sin privilegio de symlinks
    // por archivos .dylib de macOS que no necesitamos en un build sin firma de código).
    signAndEditExecutable: false,
  },
  forceCodeSigning: false,
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    shortcutName: 'SmarTable',
  },
};
