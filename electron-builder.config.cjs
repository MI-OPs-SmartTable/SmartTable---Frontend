const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const backendPath = process.env.SMARTTABLE_BACKEND_PATH
  ? path.resolve(process.env.SMARTTABLE_BACKEND_PATH)
  : path.resolve(__dirname, '../SmartTable---Backend-nog');

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
      filter: ['**/*', '!tests/**', '!**/*.test.js'],
    },
    {
      from: 'dist',
      to: 'frontend',
    },
  ],
  asarUnpack: ['**/node_modules/better-sqlite3/**'],
  win: {
    target: ['nsis'],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    shortcutName: 'SmarTable',
  },
};
