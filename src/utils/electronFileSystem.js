
// Custom "Handle" adapter for Electron to mimic FileSystemAccess API

export const getElectronHandle = (path, name) => {
    return createDirHandle(path, name || path.split(/[\\/]/).pop());
};

const createDirHandle = (path, name) => {
    return {
        kind: 'directory',
        name: name,
        path: path, // Internal custom property
        async getFileHandle(name, opts) {
            const filePath = `${path}\\${name}`; // Windows specific, but better use slash? Electron handles both usually.
            // Check if exists if create is false?
            // For simplicity, we assume we return a handle pointing to that path.
            // If create: true, we might want to ensure it exists or just rely on write.
            return createFileHandle(filePath, name);
        },
        async getDirectoryHandle(name, opts) {
            const dirPath = `${path}\\${name}`;
            if (opts?.create) {
                await window.electronAPI.createDir(dirPath);
            }
            return createDirHandle(dirPath, name);
        },
        async *values() {
            const entries = await window.electronAPI.readDir(path);
            for (const entry of entries) {
                if (entry.kind === 'directory') {
                    yield createDirHandle(`${path}\\${entry.name}`, entry.name);
                } else {
                    yield createFileHandle(`${path}\\${entry.name}`, entry.name);
                }
            }
        },
        async removeEntry(name, opts) {
            const targetPath = `${path}\\${name}`;
            await window.electronAPI.delete(targetPath);
        },
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted'
    };
};

const createFileHandle = (path, name) => {
    return {
        kind: 'file',
        name: name,
        path: path,
        async getFile() {
            // In browser API, getFile returns a Blob/File object.
            // We need to mimic that.
            // For text files, we can read string. For images, buffer.
            // But the app expects `file.text()` and `file.arrayBuffer()`.
            return {
                name: name,
                lastModified: Date.now(), // Mocked
                text: async () => await window.electronAPI.readFile(path),
                arrayBuffer: async () => {
                    const buf = await window.electronAPI.readFileBuffer(path);
                    return buf.buffer; // Convert Uint8Array to ArrayBuffer
                }
            };
        },
        async createWritable() {
            return {
                write: async (content) => {
                    // Content might be string or buffer
                    await window.electronAPI.writeFile(path, content);
                },
                close: async () => { }
            };
        },
        async move(newName) {
            // Not implemented in this basic adapter yet, but requested in app code sometimes.
            // Using delete/write logic in app fallback.
            // Or implement rename IPC if needed.
        },
        async remove() {
            await window.electronAPI.delete(path);
        },
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted'
    };
};
