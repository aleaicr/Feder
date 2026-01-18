import React from 'react';
import { Moon, Sun, Save, FolderOpen, FilePlus, Download, Sidebar, Feather, Settings, SunMoon } from 'lucide-react';

export function Layout({
    children,
    onOpen,
    onSave,
    onNew,
    onExport,
    onImport,
    isDark, // Kept for potential internal use but deprecated
    theme,
    toggleTheme,
    filename,
    projectName,
    mode,
    onModeChange,
    onProjectNameChange,
    showExplorer,
    toggleExplorer,
    onLogoClick,
    onOpenSettings
}) {
    return (
        <div className={`app-layout ${theme !== 'light' ? theme : ''}`}>
            <header className="app-header">
                <div className="title-group">
                    <button
                        onClick={toggleExplorer}
                        className={`btn-icon ${showExplorer ? 'active' : ''}`}
                        title="Toggle Explorer"
                    >
                        <Sidebar size={20} />
                    </button>
                    <div
                        onClick={onLogoClick}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                        title="Go to Welcome Screen"
                    >
                        <Feather size={24} color="var(--accent-color)" />
                        <h1 className="app-title">Feder</h1>
                    </div>

                    {/* Project Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 20 }}>
                        <div className="project-input-wrapper">
                            <input
                                value={projectName || ''}
                                onChange={(e) => onProjectNameChange && onProjectNameChange(e.target.value)}
                                className="header-project-input"
                                placeholder="Project Name"
                            />
                        </div>
                        <div className="header-mode-display">
                            <div className={`mode-pill active ${mode}-badge`} style={{
                                cursor: 'default',
                                padding: '4px 16px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {mode === 'journalist' ? 'Writer' :
                                    mode === 'researcher' ? 'Research' :
                                        mode === 'engineer' ? 'Engineer' :
                                            mode === 'scholar' ? 'Scholar' :
                                                mode === 'scriptwriter' ? 'Script' : mode}
                            </div>
                        </div>
                        <span className="file-status" style={{ marginLeft: 10, opacity: 0.6 }}>
                            {filename ? `Editing: ${filename}` : ''}
                        </span>
                    </div>
                </div>

                <div className="actions-group">
                    <ActionButton onClick={onNew} icon={<FilePlus size={18} />} label="New" />
                    <ActionButton onClick={onOpen} icon={<FolderOpen size={18} />} label="Open" />
                    <ActionButton onClick={onSave} icon={<Save size={18} />} label="Save" />
                    {mode === 'researcher' && (
                        <>
                            <ActionButton onClick={onExport} icon={<Download size={18} />} label="Export" />
                            <div className="divider"></div>
                        </>
                    )}
                    <ActionButton onClick={onOpenSettings} icon={<Settings size={18} />} label="Settings" />

                    <div className="divider"></div>

                    <button onClick={toggleTheme} className="btn-icon" title={`Theme: ${theme}`}>
                        {theme === 'light' ? <Sun size={20} /> :
                            theme === 'dark' ? <Moon size={20} /> : <SunMoon size={20} />}
                    </button>
                </div>
            </header>

            <main className="layout-content" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {children}
            </main>
        </div>
    );
}

function ActionButton({ onClick, icon, label }) {
    return (
        <button onClick={onClick} className="btn-icon">
            {icon}
            <span>{label}</span>
        </button>
    );
}
