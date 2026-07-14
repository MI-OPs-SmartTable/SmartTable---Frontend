const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('smarttable', {
  isDesktop: true,
  onRequestClose(handler) {
    const listener = () => {
      try {
        handler();
      } catch (err) {
        console.error('[smarttable] Error en onRequestClose:', err);
        ipcRenderer.send('app:confirm-quit');
      }
    };
    ipcRenderer.on('app:request-close', listener);
    return () => {
      ipcRenderer.removeListener('app:request-close', listener);
    };
  },
  confirmQuit() {
    ipcRenderer.send('app:confirm-quit');
  },
  cancelQuit() {
    ipcRenderer.send('app:cancel-quit');
  },
  getTunnelStatus() {
    return ipcRenderer.invoke('tunnel:get-status');
  },
  restartTunnel() {
    return ipcRenderer.invoke('tunnel:restart');
  },
  onTunnelStatus(handler) {
    const listener = (_event, status) => {
      try {
        handler(status);
      } catch (err) {
        console.error('[smarttable] Error en onTunnelStatus:', err);
      }
    };
    ipcRenderer.on('tunnel:status', listener);
    return () => {
      ipcRenderer.removeListener('tunnel:status', listener);
    };
  },
  getLocalAccess() {
    return ipcRenderer.invoke('access:get-local');
  },
});
