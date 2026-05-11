const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  activateLicense: (key) => ipcRenderer.invoke('activate-license', key)
});
