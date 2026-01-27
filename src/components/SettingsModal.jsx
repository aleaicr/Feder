import React, { useState, useEffect } from 'react';
import { X, Monitor, AlignJustify, FolderOpen, Book } from 'lucide-react';

export function SettingsModal({ onClose, metadata, onUpdate, mode }) {
    const [localMeta, setLocalMeta] = useState(metadata || {});

    useEffect(() => {
        setLocalMeta(metadata || {});
    }, [metadata]);

    const handleChange = (key, value) => {
        const updated = { ...localMeta, [key]: value };
        setLocalMeta(updated);
        onUpdate(updated);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div className="header-title">
                        <h2>Project Settings</h2>
                        <span className="subtitle">Configure your workspace preferences</span>
                    </div>
                    <button className="btn-close" onClick={onClose}><X size={20} /></button>
                </header>

                <div className="modal-body">
                    {/* section: Visualization */}
                    <div className="settings-section">
                        <div className="section-label">
                            <Monitor size={16} />
                            <span>Visualization</span>
                        </div>
                        <div className="settings-card">
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-name">Update Mode</span>
                                    <span className="setting-desc">Choose when the preview refreshes</span>
                                </div>
                                <div className="segmented-control">
                                    <button
                                        className={localMeta.livePreview ? 'active' : ''}
                                        onClick={() => handleChange('livePreview', true)}
                                    > Live Update </button>
                                    <button
                                        className={!localMeta.livePreview ? 'active' : ''}
                                        onClick={() => handleChange('livePreview', false)}
                                    > On Save </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {mode === 'researcher' && (
                        <>
                            {/* section: Appearance */}
                            <div className="settings-section">
                                <div className="section-label">
                                    <AlignJustify size={16} />
                                    <span>Appearance</span>
                                </div>
                                <div className="settings-card">
                                    <div className="setting-row">
                                        <div className="setting-info">
                                            <span className="setting-name">Caption Alignment</span>
                                            <span className="setting-desc">Default alignment for figure captions</span>
                                        </div>
                                        <div className="segmented-control">
                                            <button
                                                className={localMeta.captionAlignment === 'center' || !localMeta.captionAlignment ? 'active' : ''}
                                                onClick={() => handleChange('captionAlignment', 'center')}
                                            > Center </button>
                                            <button
                                                className={localMeta.captionAlignment === 'justify' ? 'active' : ''}
                                                onClick={() => handleChange('captionAlignment', 'justify')}
                                            > Justify </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* section: Paths */}
                            <div className="settings-section">
                                <div className="section-label">
                                    <FolderOpen size={16} />
                                    <span>File Structures</span>
                                </div>
                                <div className="settings-card">
                                    <div className="setting-input-group">
                                        <label>Figures Folder</label>
                                        <div className="input-with-icon">
                                            <FolderOpen size={14} className="input-icon" />
                                            <input
                                                type="text"
                                                value={localMeta.figuresFolder || 'figures'}
                                                onChange={e => handleChange('figuresFolder', e.target.value)}
                                                placeholder="figures"
                                            />
                                        </div>
                                    </div>
                                    <div className="setting-input-group" style={{ marginTop: 12 }}>
                                        <label>Bibliography File</label>
                                        <div className="input-with-icon">
                                            <Book size={14} className="input-icon" />
                                            <input
                                                type="text"
                                                value={localMeta.bibFile || 'references.bib'}
                                                onChange={e => handleChange('bibFile', e.target.value)}
                                                placeholder="references.bib"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <footer className="modal-footer">
                    <button className="btn-primary" onClick={onClose}>Done</button>
                </footer>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .premium-modal {
                    background: var(--bg-panel);
                    width: 480px;
                    max-width: 95vw;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px var(--border-color);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .modal-header {
                    padding: 24px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid var(--border-color);
                }
                .header-title h2 {
                    margin: 0;
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: var(--text-primary);
                }
                .header-title .subtitle {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }

                .btn-close {
                    background: var(--hover-bg);
                    border: none;
                    color: var(--text-secondary);
                    padding: 8px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-close:hover {
                    background: #ff4757;
                    color: white;
                }

                .modal-body {
                    padding: 24px 32px;
                    max-height: 70vh;
                    overflow-y: auto;
                }

                .settings-section {
                    margin-bottom: 24px;
                }
                .section-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 12px;
                }

                .settings-card {
                    background: var(--bg-app);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 16px;
                }

                .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }
                .setting-info {
                    display: flex;
                    flex-direction: column;
                }
                .setting-name {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .setting-desc {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }

                .segmented-control {
                    display: flex;
                    background: var(--bg-panel);
                    padding: 4px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                }
                .segmented-control button {
                    background: transparent;
                    border: none;
                    padding: 6px 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    border-radius: 7px;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .segmented-control button.active {
                    background: var(--accent-color);
                    color: white;
                    box-shadow: 0 2px 8px rgba(var(--accent-color-rgb), 0.3);
                }

                .setting-input-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--text-primary);
                }
                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 12px;
                    color: var(--text-secondary);
                }
                .input-with-icon input {
                    width: 100%;
                    padding: 10px 12px 10px 36px;
                    background: var(--bg-panel);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .input-with-icon input:focus {
                    border-color: var(--accent-color);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.1);
                }

                .modal-footer {
                    padding: 20px 32px 32px;
                    display: flex;
                    justify-content: flex-end;
                }
                .btn-primary {
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 10px 32px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-primary:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.3);
                }
            `}</style>
        </div>
    );
}
