const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('smarttable', {
  isDesktop: true,
});
