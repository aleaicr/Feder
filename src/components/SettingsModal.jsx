import React, { useState, useEffect } from 'react';
import { X, Monitor, AlignJustify, FolderOpen, Book } from 'lucide-react';

export function SettingsModal({ onClose, metadata, onUpdate, mode, settings, onUpdateSettings }) {
    const [localMeta, setLocalMeta] = useState(metadata || {});
    const [localSettings, setLocalSettings] = useState(settings || {});

    useEffect(() => {
        setLocalMeta(metadata || {});
    }, [metadata]);

    useEffect(() => {
        setLocalSettings(settings || {});
    }, [settings]);

    const handleChange = (key, value) => {
        const updated = { ...localMeta, [key]: value };
        setLocalMeta(updated);
        onUpdate(updated);
    };

    const handleAIChange = (path, value) => {
        // Decide where to save: Sensitive keys go to global 'settings', config goes to 'projectMetadata'
        const isSensitive = path.includes('apiKey');

        if (isSensitive) {
            const updatedAI = { ...(localSettings.ai || {}) };
            let cursor = updatedAI;
            for (let i = 0; i < path.length - 1; i += 1) {
                const key = path[i];
                cursor[key] = { ...(cursor[key] || {}) };
                cursor = cursor[key];
            }
            cursor[path[path.length - 1]] = value;

            const updated = { ...localSettings, ai: updatedAI };
            setLocalSettings(updated);
            if (onUpdateSettings) onUpdateSettings(updated);
        } else {
            // Save to project metadata
            const updatedAiMeta = { ...(localMeta.aiConfig || {}) };
            let cursor = updatedAiMeta;
            for (let i = 0; i < path.length - 1; i += 1) {
                const key = path[i];
                cursor[key] = { ...(cursor[key] || {}) };
                cursor = cursor[key];
            }
            cursor[path[path.length - 1]] = value;

            const updated = { ...localMeta, aiConfig: updatedAiMeta };
            setLocalMeta(updated);
            if (onUpdate) onUpdate(updated);
        }
    };

    // Helper to get value from either source
    const getAIVal = (path, defaultValue) => {
        const isSensitive = path.includes('apiKey');
        let source = isSensitive ? localSettings.ai : localMeta.aiConfig;
        if (!source) return defaultValue;

        let cursor = source;
        for (const key of path) {
            if (cursor[key] === undefined) return defaultValue;
            cursor = cursor[key];
        }
        return cursor ?? defaultValue;
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

                    {/* section: AI Assist */}
                    <div className="settings-section">
                        <div className="section-label">
                            <AlignJustify size={16} />
                            <span>AI Assist</span>
                        </div>
                        <div className="settings-card">
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-name">Inline Suggestions</span>
                                    <span className="setting-desc">Fast inline text continuations while typing</span>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.ai?.enabled || false}
                                        onChange={(e) => handleAIChange(['enabled'], e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            {localSettings.ai?.enabled && (
                                <div style={{ marginTop: 20 }}>
                                    {/* 1. Provider Selection */}
                                    <div className="setting-input-group">
                                        <label>Provider</label>
                                        <select
                                            value={getAIVal(['provider'], 'gemini')}
                                            onChange={(e) => handleAIChange(['provider'], e.target.value)}
                                            className="form-input"
                                        >
                                            <option value="gemini">Google Gemini (Recommended)</option>
                                            <option value="openai">OpenAI (Cloud)</option>
                                            <option value="ollama">Ollama (Local)</option>
                                        </select>
                                    </div>

                                    {/* 2. Provider Specific Settings */}
                                    {getAIVal(['provider'], 'gemini') === 'gemini' && (
                                        <div className="setting-input-group" style={{ marginTop: 12 }}>
                                            <label>Gemini Configuration</label>
                                            <div className="input-with-icon">
                                                <input
                                                    type="password"
                                                    value={getAIVal(['gemini', 'apiKey'], '')}
                                                    onChange={(e) => handleAIChange(['gemini', 'apiKey'], e.target.value)}
                                                    placeholder="Gemini API Key"
                                                />
                                            </div>
                                            <div className="input-with-icon" style={{ marginTop: 8 }}>
                                                <select
                                                    value={getAIVal(['gemini', 'model'], 'gemini-2.5-flash-lite (recommended)')}
                                                    onChange={(e) => handleAIChange(['gemini', 'model'], e.target.value)}
                                                    className="form-input"
                                                >
                                                    <option value="gemini-2.5-flash-lite (recommended)">gemini-2.5-flash-lite (Recommended)</option>
                                                    <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                                                    <option value="gemini-3-pro-preview">gemini-3-pro-preview</option>
                                                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {getAIVal(['provider']) === 'openai' && (
                                        <div className="setting-input-group" style={{ marginTop: 12 }}>
                                            <label>OpenAI Configuration</label>
                                            <div className="input-with-icon">
                                                <input
                                                    type="password"
                                                    value={getAIVal(['openai', 'apiKey'], '')}
                                                    onChange={(e) => handleAIChange(['openai', 'apiKey'], e.target.value)}
                                                    placeholder="OpenAI API Key"
                                                />
                                            </div>
                                            <div className="input-with-icon" style={{ marginTop: 8 }}>
                                                <select
                                                    value={getAIVal(['openai', 'model'], 'gpt-5.2-chat-latest')}
                                                    onChange={(e) => handleAIChange(['openai', 'model'], e.target.value)}
                                                    className="form-input"
                                                >
                                                    <option value="gpt-5.2-chat-latest">gpt-5.2-chat-latest</option>
                                                    <option value="gpt-5-mini">gpt-5-mini</option>
                                                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                                                    <option value="gpt-4o">gpt-4o</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {getAIVal(['provider']) === 'ollama' && (
                                        <div className="setting-input-group" style={{ marginTop: 12 }}>
                                            <label>Ollama Configuration</label>
                                            <div className="input-with-icon">
                                                <input
                                                    type="text"
                                                    value={getAIVal(['ollama', 'baseUrl'], 'http://localhost:11434')}
                                                    onChange={(e) => handleAIChange(['ollama', 'baseUrl'], e.target.value)}
                                                    placeholder="http://localhost:11434"
                                                />
                                            </div>
                                            <div className="input-with-icon" style={{ marginTop: 8 }}>
                                                <input
                                                    type="text"
                                                    value={getAIVal(['ollama', 'model'], 'gemma3:4b (recommended)')}
                                                    onChange={(e) => handleAIChange(['ollama', 'model'], e.target.value)}
                                                    placeholder="Model name (e.g., gemma3:4b)"
                                                    className="form-input"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Trigger Mode */}
                                    <div className="setting-input-group" style={{ marginTop: 16 }}>
                                        <label>Trigger Mode</label>
                                        <div className="segmented-control" style={{ width: 'fit-content' }}>
                                            <button
                                                className={getAIVal(['triggerMode'], 'automatic') === 'automatic' ? 'active' : ''}
                                                onClick={() => handleAIChange(['triggerMode'], 'automatic')}
                                            > Automatic (On Pause) </button>
                                            <button
                                                className={getAIVal(['triggerMode']) === 'manual' ? 'active' : ''}
                                                onClick={() => handleAIChange(['triggerMode'], 'manual')}
                                            > Manual (Shortcut) </button>
                                        </div>
                                        <span className="setting-desc" style={{ marginTop: 4, display: 'block' }}>
                                            {getAIVal(['triggerMode']) === 'manual'
                                                ? "AI only triggers on Ctrl+Space or toolbar button."
                                                : "AI triggers automatically when you pause typing."}
                                        </span>
                                    </div>

                                    {/* 3. General Configuration (Bottom) */}
                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        <div className="setting-input-group" style={{ flex: 1 }}>
                                            <label>Max Words <span style={{ fontSize: '10px', opacity: 0.6 }}>(12 recommended)</span></label>
                                            <input
                                                type="number"
                                                min="5"
                                                max="100"
                                                value={getAIVal(['maxWords'], 12)}
                                                onChange={(e) => handleAIChange(['maxWords'], Number(e.target.value))}
                                                className="form-input clean-number"
                                            />
                                        </div>
                                        <div className="setting-input-group" style={{ flex: 1 }}>
                                            <label>Delay <span style={{ fontSize: '10px', opacity: 0.6 }}>(1.0 recommended)</span></label>
                                            <input
                                                type="number"
                                                min="0.2"
                                                max="5"
                                                step="0.1"
                                                value={getAIVal(['debounceMs'], 1000) / 1000}
                                                onChange={(e) => handleAIChange(['debounceMs'], Number(e.target.value) * 1000)}
                                                className="form-input clean-number"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                                value={localMeta.figuresFolder !== undefined ? localMeta.figuresFolder : 'figures'}
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
                                                value={localMeta.bibFile !== undefined ? localMeta.bibFile : 'references.bib'}
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

                /* Remove arrows from number inputs */
                .clean-number::-webkit-inner-spin-button,
                .clean-number::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .clean-number {
                    -moz-appearance: textfield;
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
