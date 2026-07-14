const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');
const { CloudflareTunnelManager } = require('./cloudflareTunnel.cjs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = Number(process.env.PORT || 8080);
const FRONTEND_PORT = Number(process.env.VITE_PORT || 5173);
const isDev = !app.isPackaged && process.env.SMARTTABLE_DEV === '1';
const tunnelEnabled = process.env.SMARTTABLE_CLOUDFLARE_TUNNEL !== '0';

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;
let allowQuit = false;
let backendEarlyExit = null;
let logStream = null;
/** @type {import('./cloudflareTunnel.cjs').CloudflareTunnelManager | null} */
let tunnelManager = null;

function getLogPath() {
  return path.join(app.getPath('userData'), 'logs', 'smarttable.log');
}

function appendLog(line) {
  const text = `[${new Date().toISOString()}] ${line}\n`;
  try {
    if (!logStream) {
      const logPath = getLogPath();
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      logStream = fs.createWriteStream(logPath, { flags: 'a' });
    }
    logStream.write(text);
  } catch {
    /* ignore log failures */
  }
  console.error(line);
}

function showStartupError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const logPath = getLogPath();
  appendLog(`STARTUP FAILED: ${message}`);
  dialog.showErrorBox(
    'SmarTable no pudo iniciar',
    `${message}\n\nRevisa el log:\n${logPath}\n\nSi el error menciona better-sqlite3 o .node, instala "Microsoft Visual C++ Redistributable (x64)" e intenta de nuevo.`
  );
}

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

  // desktop:start (SMARTTABLE_DEV=0): servir el build local sin empaquetar.
  if (!isDev) {
    const localDist = path.join(__dirname, '..', 'dist');
    if (fs.existsSync(path.join(localDist, 'index.html'))) {
      return localDist;
    }
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
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    GOOGLE_OAUTH_CLIENT_PATH: process.env.GOOGLE_OAUTH_CLIENT_PATH || '',
    environment: 'PRODUCTION',
    SMARTTABLE_AUTO_SEED: '1',
    JWT_SECRET_PRODUCTION: process.env.JWT_SECRET_PRODUCTION || 'smarttable-desktop-secret-change-me',
    CORS_ORIGIN: isDev
      ? 'http://localhost:5173,http://localhost:8080'
      : `http://127.0.0.1:${PORT}`,
  };

  if (frontendDist && fs.existsSync(frontendDist)) {
    env.FRONTEND_DIST = frontendDist;
  } else if (!isDev) {
    console.warn(
      '[electron] No se encontró dist/ del frontend. Ejecuta "npm run build" antes de desktop:start, o usa desktop:dev.'
    );
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
  backendEarlyExit = null;

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`No se encontró el backend empaquetado en:\n${scriptPath}`);
  }

  if (!isDev) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  appendLog(`Iniciando backend: ${scriptPath}`);
  appendLog(`DB_PATH=${env.DB_PATH}`);
  appendLog(`FRONTEND_DIST=${env.FRONTEND_DIST || '(vacío)'}`);

  backendProcess = spawn(getNodeExecutable(), [scriptPath], {
    cwd: backendRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const onBackendData = (chunk) => {
    const text = String(chunk).trim();
    if (text) appendLog(`[backend] ${text}`);
  };
  backendProcess.stdout?.on('data', onBackendData);
  backendProcess.stderr?.on('data', onBackendData);

  backendProcess.on('error', (err) => {
    backendEarlyExit = err;
    appendLog(`Backend spawn error: ${err.message}`);
  });

  backendProcess.on('exit', (code, signal) => {
    const proc = backendProcess;
    backendProcess = null;

    // 42 = restauración de BD: reiniciar backend automáticamente
    if (code === 42 && !app.isQuitting) {
      appendLog('[electron] Backend pidió reinicio tras restaurar BD...');
      setTimeout(() => {
        try {
          startBackendProcess();
        } catch (err) {
          appendLog(`[electron] No se pudo reiniciar el backend: ${err.message}`);
        }
      }, 400);
      return;
    }

    if (code && code !== 0) {
      backendEarlyExit = new Error(
        `El backend se cerró con código ${code}${signal ? ` (signal ${signal})` : ''}. Revisa el log.`
      );
      appendLog(backendEarlyExit.message);
    }

    void proc;
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
    if (backendEarlyExit) {
      throw backendEarlyExit;
    }

    if (await checkUrl(url)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `${label} no respondió a tiempo (${url}).\n¿El puerto ${PORT} está ocupado por otro programa?`
  );
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

  mainWindow.on('close', (event) => {
    if (allowQuit) {
      return;
    }
    event.preventDefault();
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:request-close');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function emitTunnelStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('tunnel:status', status);
  }
}

function getTunnelLocalTarget() {
  // Dev: Vite (proxy /api). Prod/start: backend sirve dist + API en el mismo puerto.
  if (isDev) {
    return `http://127.0.0.1:${FRONTEND_PORT}`;
  }
  return `http://127.0.0.1:${PORT}`;
}

function getLanIPv4() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      const family = net.family === 4 || net.family === 'IPv4';
      if (!family || net.internal) continue;
      candidates.push(net.address);
    }
  }

  const preferred = candidates.find(
    (ip) =>
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );

  return preferred || candidates[0] || null;
}

/** URL para celular en la misma WiFi (no usar 127.0.0.1). */
function getLocalAccessInfo() {
  const ip = getLanIPv4();
  const port = isDev ? FRONTEND_PORT : PORT;
  if (!ip) {
    return {
      url: null,
      ip: null,
      port,
      error: 'No se detectó una IP de red local. Conecta este PC a la WiFi del restaurante.',
    };
  }
  return {
    url: `http://${ip}:${port}`,
    ip,
    port,
    error: null,
  };
}

function initTunnelManager() {
  tunnelManager = new CloudflareTunnelManager({
    userDataPath: app.getPath('userData'),
    getLocalTarget: getTunnelLocalTarget,
    enabled: tunnelEnabled,
    onStatus: emitTunnelStatus,
  });
}

function requestQuitFromRenderer() {
  allowQuit = true;
  app.isQuitting = true;
  tunnelManager?.stop();
  stopFrontendProcess();
  stopBackendProcess();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
  }
  app.quit();
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

  initTunnelManager();

  ipcMain.on('app:confirm-quit', () => {
    requestQuitFromRenderer();
  });

  ipcMain.on('app:cancel-quit', () => {
    // El renderer canceló el cierre; la ventana permanece abierta.
  });

  ipcMain.handle('tunnel:get-status', () => tunnelManager?.getStatus() ?? null);
  ipcMain.handle('tunnel:restart', async () => {
    if (!tunnelManager) return null;
    return tunnelManager.restart();
  });
  ipcMain.handle('access:get-local', () => getLocalAccessInfo());

  try {
    appendLog('=== SmarTable start ===');
    appendLog(`packaged=${app.isPackaged} execPath=${process.execPath}`);
    appendLog(`resourcesPath=${process.resourcesPath || '(n/a)'}`);

    startBackendProcess();
    await waitForBackend();

    if (isDev) {
      startFrontendProcess();
      await waitForFrontend();
    }

    createMainWindow();

    // Acceso remoto vía Cloudflare (no bloquea el UI si falla).
    void tunnelManager?.start().then((status) => {
      appendLog(`[electron] Cloudflare tunnel: ${status?.status} ${status?.url || status?.error || ''}`);
    });
  } catch (error) {
    showStartupError(error);
    allowQuit = true;
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (!allowQuit) {
    return;
  }
  app.isQuitting = true;
  tunnelManager?.stop();
  stopFrontendProcess();
  stopBackendProcess();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  if (allowQuit) {
    app.isQuitting = true;
    tunnelManager?.stop();
    stopFrontendProcess();
    stopBackendProcess();
    return;
  }

  event.preventDefault();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:request-close');
  } else {
    requestQuitFromRenderer();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
