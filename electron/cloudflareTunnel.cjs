const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const QUICK_TUNNEL_URL_REGEX = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
const DOWNLOAD_TIMEOUT_MS = 120000;
const START_TIMEOUT_MS = 60000;

/** @typedef {'idle'|'downloading'|'starting'|'connected'|'error'} TunnelStatusName */

/**
 * @typedef {object} TunnelStatus
 * @property {TunnelStatusName} status
 * @property {string|null} url
 * @property {string|null} error
 * @property {string} localTarget
 */

class CloudflareTunnelManager {
  /**
   * @param {{
   *   userDataPath: string,
   *   getLocalTarget: () => string,
   *   onStatus?: (status: TunnelStatus) => void,
   *   enabled?: boolean,
   * }} options
   */
  constructor(options) {
    this.userDataPath = options.userDataPath;
    this.getLocalTarget = options.getLocalTarget;
    this.onStatus = options.onStatus || (() => {});
    this.enabled = options.enabled !== false;
    this.process = null;
    this.starting = false;
    /** @type {TunnelStatus} */
    this.state = {
      status: 'idle',
      url: null,
      error: null,
      localTarget: options.getLocalTarget(),
    };
  }

  getStatus() {
    return {
      ...this.state,
      localTarget: this.getLocalTarget(),
      enabled: this.enabled,
    };
  }

  setState(partial) {
    this.state = {
      ...this.state,
      ...partial,
      localTarget: this.getLocalTarget(),
    };
    this.onStatus(this.getStatus());
  }

  getBinaryPath() {
    const binDir = path.join(this.userDataPath, 'bin');
    const name = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
    return path.join(binDir, name);
  }

  getDownloadUrl() {
    if (process.platform === 'win32') {
      return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
    }
    if (process.platform === 'darwin') {
      const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
      return `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-${arch}.tgz`;
    }
    return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
  }

  async ensureBinary() {
    const binaryPath = this.getBinaryPath();
    if (fs.existsSync(binaryPath)) {
      return binaryPath;
    }

    if (process.platform !== 'win32') {
      throw new Error(
        'Descarga automática de cloudflared solo está preparada para Windows. Instala cloudflared manualmente o usa Windows.'
      );
    }

    this.setState({ status: 'downloading', url: null, error: null });
    fs.mkdirSync(path.dirname(binaryPath), { recursive: true });

    const tmpPath = `${binaryPath}.download`;
    await downloadFile(this.getDownloadUrl(), tmpPath);
    fs.renameSync(tmpPath, binaryPath);
    return binaryPath;
  }

  stop() {
    if (this.process) {
      try {
        this.process.kill();
      } catch {
        /* ignore */
      }
      this.process = null;
    }
  }

  async start() {
    if (!this.enabled) {
      this.setState({
        status: 'error',
        url: null,
        error: 'Acceso remoto desactivado (SMARTTABLE_CLOUDFLARE_TUNNEL=0)',
      });
      return this.getStatus();
    }

    if (this.starting) {
      return this.getStatus();
    }

    this.starting = true;
    this.stop();
    this.setState({ status: 'starting', url: null, error: null });

    try {
      const binaryPath = await this.ensureBinary();
      const localTarget = this.getLocalTarget();
      const status = await this.spawnAndWaitForUrl(binaryPath, localTarget);
      return status;
    } catch (err) {
      this.stop();
      const message = err instanceof Error ? err.message : String(err);
      this.setState({ status: 'error', url: null, error: message });
      return this.getStatus();
    } finally {
      this.starting = false;
    }
  }

  async restart() {
    this.stop();
    return this.start();
  }

  /**
   * @param {string} binaryPath
   * @param {string} localTarget
   */
  spawnAndWaitForUrl(binaryPath, localTarget) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let stderrBuffer = '';

      const child = spawn(
        binaryPath,
        ['tunnel', '--no-autoupdate', '--protocol', 'http2', '--url', localTarget],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        }
      );

      this.process = child;

      const finishOk = (url) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.setState({ status: 'connected', url, error: null });
        resolve(this.getStatus());
      };

      const finishErr = (message) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(message));
      };

      const timer = setTimeout(() => {
        finishErr(
          'Tiempo agotado esperando la URL de Cloudflare. Revisa la conexión a internet e intenta de nuevo.'
        );
        this.stop();
      }, START_TIMEOUT_MS);

      const consume = (chunk) => {
        const text = chunk.toString();
        stderrBuffer += text;
        const match = QUICK_TUNNEL_URL_REGEX.exec(stderrBuffer);
        if (match) {
          finishOk(match[0]);
        }
      };

      child.stdout?.on('data', consume);
      child.stderr?.on('data', consume);

      child.on('error', (err) => {
        finishErr(`No se pudo iniciar cloudflared: ${err.message}`);
      });

      child.on('exit', (code, signal) => {
        this.process = null;
        if (settled) {
          if (this.state.status === 'connected') {
            this.setState({
              status: 'error',
              url: null,
              error: 'El túnel se cerró. Pulsa Reintentar para volver a exponerlo.',
            });
          }
          return;
        }
        const reason = signal ? `señal ${signal}` : `código ${code}`;
        finishErr(`cloudflared terminó antes de estar listo (${reason}). ¿Hay internet?`);
      });
    });
  }
}

/**
 * @param {string} url
 * @param {string} destPath
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      file.close(() => {
        try {
          fs.unlinkSync(destPath);
        } catch {
          /* ignore */
        }
      });
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    const request = (currentUrl, redirectsLeft) => {
      const req = https.get(currentUrl, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          const next = new URL(res.headers.location, currentUrl).toString();
          request(next, redirectsLeft - 1);
          return;
        }

        if (res.statusCode !== 200) {
          fail(new Error(`No se pudo descargar cloudflared (HTTP ${res.statusCode})`));
          res.resume();
          return;
        }

        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if (settled) return;
            settled = true;
            resolve();
          });
        });
      });

      req.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
        req.destroy();
        fail(new Error('Tiempo agotado descargando cloudflared'));
      });

      req.on('error', fail);
    };

    request(url, 5);
    file.on('error', fail);
  });
}

module.exports = { CloudflareTunnelManager };
