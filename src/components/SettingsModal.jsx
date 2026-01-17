import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

    if (mode !== 'researcher') return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>Project Decisions</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </header>
                <div className="modal-body form-grid">

                    <div className="form-group full-width">
                        <label>Caption Alignment</label>
                        <div className="radio-group" style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="captionAlignment"
                                    value="center"
                                    checked={localMeta.captionAlignment === 'center' || !localMeta.captionAlignment}
                                    onChange={() => handleChange('captionAlignment', 'center')}
                                />
                                Center
                            </label>
                            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="captionAlignment"
                                    value="justify"
                                    checked={localMeta.captionAlignment === 'justify'}
                                    onChange={() => handleChange('captionAlignment', 'justify')}
                                />
                                Justify
                            </label>
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>Figures Folder Name</label>
                        <input
                            type="text"
                            value={localMeta.figuresFolder || 'figures'}
                            onChange={e => handleChange('figuresFolder', e.target.value)}
                            className="form-input"
                            placeholder="figures"
                        />
                        <span className="help-text" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                            Default folder for storing images.
                        </span>
                    </div>

                    <div className="form-group full-width">
                        <label>Bibliography File</label>
                        <input
                            type="text"
                            value={localMeta.bibFile || 'references.bib'}
                            onChange={e => handleChange('bibFile', e.target.value)}
                            className="form-input"
                            placeholder="references.bib"
                        />
                        <span className="help-text" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                            Default .bib file for citations.
                        </span>
                    </div>
                </div>
                <footer className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="text-btn" onClick={onClose}>Close</button>
                </footer>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(2px);
                }
                .modal-content {
                    background: var(--bg-panel);
                    width: 400px;
                    max-width: 90vw;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    padding: 20px;
                    border: 1px solid var(--border-color);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 10px;
                }
                .modal-header h2 {
                    margin: 0;
                    font-size: 1.2rem;
                }
            `}</style>
        </div>
    );
}
