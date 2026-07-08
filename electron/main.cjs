const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = Number(process.env.PORT || 8080);
const FRONTEND_PORT = Number(process.env.VITE_PORT || 5173);
const isDev = !app.isPackaged && process.env.SMARTTABLE_DEV === '1';

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;

function resolveBackendRoot() {
  if (process.env.SMARTTABLE_BACKEND_PATH) {
    return path.resolve(process.env.SMARTTABLE_BACKEND_PATH);
  }

  // Legacy fallback kept for old local setups.
  return path.resolve(__dirname, '../../SmartTable---Backend');
}

function getBackendRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend');
  }

  const backendRoot = resolveBackendRoot();
  if (!fs.existsSync(backendRoot)) {
    const recommendedPath = path.resolve(__dirname, '../../SmartTable---Backend');
    throw new Error(
      `No se encontró el backend en: ${backendRoot}. Configura SMARTTABLE_BACKEND_PATH en .env (ejemplo recomendado: ${recommendedPath})`
    );
  }

  return backendRoot;
}

function getFrontendDist() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend');
  }

  return null;
}

function getAppIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend', 'logo.png');
  }

  return path.join(__dirname, '..', 'public', 'logo.png');
}

function getDatabasePath() {
  return path.join(app.getPath('userData'), 'pos.db');
}

function getUserDataPaths() {
  const userData = app.getPath('userData');

  return {
    userData,
    configPath: path.join(userData, 'backup-config.json'),
    backupDir: path.join(userData, 'backups'),
    credentialsPath: path.join(userData, 'credentials', 'google-service-account.json'),
  };
}

function buildBackendEnv() {
  const backendRoot = getBackendRoot();
  const frontendDist = getFrontendDist();
  const { configPath, backupDir, credentialsPath } = getUserDataPaths();
  const env = {
    ...process.env,
    PORT: String(PORT),
    DB_PATH: getDatabasePath(),
    CONFIG_PATH: configPath,
    BACKUP_LOCAL_DIR: backupDir,
    GOOGLE_DRIVE_CREDENTIALS_PATH: credentialsPath,
    environment: 'PRODUCTION',
    SMARTTABLE_AUTO_SEED: '1',
    JWT_SECRET_PRODUCTION: process.env.JWT_SECRET_PRODUCTION || 'smarttable-desktop-secret-change-me',
    CORS_ORIGIN: isDev
      ? 'http://localhost:5173,http://localhost:8080'
      : `http://127.0.0.1:${PORT}`,
  };

  if (frontendDist && fs.existsSync(frontendDist)) {
    env.FRONTEND_DIST = frontendDist;
  }

  const envFile = path.join(backendRoot, '.env');
  if (fs.existsSync(envFile)) {
    env.DOTENV_CONFIG_PATH = envFile;
  }

  return env;
}

function getNodeExecutable() {
  if (isDev) {
    return process.platform === 'win32' ? 'node.exe' : 'node';
  }

  return process.execPath;
}

function startBackendProcess() {
  const backendRoot = getBackendRoot();
  const scriptPath = path.join(backendRoot, 'api/index.js');
  const env = buildBackendEnv();

  if (!isDev) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  backendProcess = spawn(getNodeExecutable(), [scriptPath], {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });

  backendProcess.on('exit', (code) => {
    backendProcess = null;
    if (code && code !== 0) {
      console.error(`Backend finalizó con código ${code}`);
    }
  });
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });

    request.on('error', () => resolve(false));
    request.setTimeout(2000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, label, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await checkUrl(url)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`${label} no respondió a tiempo (${url})`);
}

function waitForBackend() {
  return waitForServer(
    `http://127.0.0.1:${PORT}/api/auth/usuarios`,
    `Backend (puerto ${PORT})`
  );
}

function waitForFrontend() {
  return waitForServer(
    `http://localhost:${FRONTEND_PORT}`,
    `Frontend (puerto ${FRONTEND_PORT})`
  );
}

function startFrontendProcess() {
  const frontendRoot = path.join(__dirname, '..');
  const viteBin = path.join(frontendRoot, 'node_modules', 'vite', 'bin', 'vite.js');

  frontendProcess = spawn(getNodeExecutable(), [viteBin], {
    cwd: frontendRoot,
    env: { ...process.env, VITE_PORT: String(FRONTEND_PORT) },
    stdio: 'inherit',
    windowsHide: true,
  });

  frontendProcess.on('exit', (code) => {
    frontendProcess = null;
    if (code && code !== 0) {
      console.error(`Frontend (Vite) finalizó con código ${code}`);
    }
  });
}

function stopFrontendProcess() {
  if (!frontendProcess) {
    return;
  }

  frontendProcess.kill();
  frontendProcess = null;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 720,
    minHeight: 520,
    title: 'SmarTable',
    icon: getAppIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = isDev ? 'http://localhost:5173' : `http://127.0.0.1:${PORT}`;

  mainWindow.loadURL(startUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function stopBackendProcess() {
  if (!backendProcess) {
    return;
  }

  backendProcess.kill();
  backendProcess = null;
}

app.whenReady().then(async () => {
  const { backupDir, credentialsPath } = getUserDataPaths();
  fs.mkdirSync(path.dirname(getDatabasePath()), { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });

  try {
    startBackendProcess();
    await waitForBackend();

    if (isDev) {
      startFrontendProcess();
      await waitForFrontend();
    }

    createMainWindow();
  } catch (error) {
    console.error('No se pudo iniciar SmarTable:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopFrontendProcess();
  stopBackendProcess();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopFrontendProcess();
  stopBackendProcess();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
