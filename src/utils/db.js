import { get, set } from 'idb-keyval';

export const saveProjectHandle = async (handle) => {
    await set('projectHandle', handle);
};

export const getProjectHandle = async () => {
    return await get('projectHandle');
};

export const saveRecentProject = async (handle, name, mode) => {
    let recent = await get('recentProjects') || [];

    // Extract path securely - check both top-level property and handle property
    const path = handle.path || null;

    // Filter out existing project with same name OR same path (to avoid duplicates)
    recent = recent.filter(p => {
        // Remove if name matches
        if (p.name === name) return false;
        // Remove if path matches (and path exists)
        if (path && p.path === path) return false;
        return true;
    });

    // Save path explicitly for Electron
    const newEntry = { handle, name, mode, lastOpened: Date.now(), path };
    // Add to top, keep max 5
    const updated = [newEntry, ...recent].slice(0, 5);

    await set('recentProjects', updated);
};

export const saveRecentList = async (list) => {
    await set('recentProjects', list);
};

export const getRecentProjects = async () => {
    return await get('recentProjects') || [];
};

export const saveSettings = async (settings) => {
    await set('userSettings', settings);
};

export const getSettings = async () => {
    return await get('userSettings') || {
        name: '',
        affiliation: '',
        profession: '',
        email: '',
        ai: {
            enabled: false,
            provider: 'openai',
            maxChars: 120,
            debounceMs: 400,
            openai: {
                enabled: true,
                apiKey: '',
                model: 'gpt-4o-mini'
            },
            ollama: {
                enabled: false,
                baseUrl: 'http://localhost:11434',
                model: 'llama3.1:8b'
            },
            gemini: {
                enabled: false,
                apiKey: '',
                model: 'gemini-1.5-flash'
            }
        }
    };
};
