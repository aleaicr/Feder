import { get, set } from 'idb-keyval';

export const saveProjectHandle = async (handle) => {
    await set('projectHandle', handle);
};

export const getProjectHandle = async () => {
    return await get('projectHandle');
};

export const saveRecentProject = async (handle, name, mode) => {
    let recent = await get('recentProjects') || [];

    // Filter out existing project with same name to move it to top
    recent = recent.filter(p => p.name !== name);

    // Save path if available (Electron)
    const newEntry = { handle, name, mode, lastOpened: Date.now(), path: handle.path || null };
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
        email: ''
    };
};
