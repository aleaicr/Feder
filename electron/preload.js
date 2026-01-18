const { contextBridge, ipcRenderer } = require('electron');
const { webUtils } = require('electron'); // Optional, if needed for drag-drop path

contextBridge.exposeInMainWorld('electronAPI', {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    readFileBuffer: (path) => ipcRenderer.invoke('fs:readFileBuffer', path),
    writeFile: (path, data) => ipcRenderer.invoke('fs:writeFile', { path, data }),
    createDir: (path) => ipcRenderer.invoke('fs:createDir', path),
    delete: (path) => ipcRenderer.invoke('fs:delete', path),
    isElectron: true
});

