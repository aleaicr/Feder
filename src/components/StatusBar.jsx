import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Zap, AlignCenter, AlignJustify, Save, Activity, Settings, X, Check, FileText, Square } from 'lucide-react';


export function StatusBar({
    settings,
    isAiThinking,
    projectMetadata,
    onOpenSettings, // Fallback to full settings
    onUpdateSettings, // New: Update global settings
    onUpdateProjectMetadata, // New: Update project metadata
    wordCount,
    paperView,
    onTogglePaperView,
    onCancelAi
}) {

    const [showAiPanel, setShowAiPanel] = useState(false);

    // Derived state
    const ai = settings?.ai || {};
    const enabled = ai.enabled;
    const provider = ai.provider || 'gemini';
    const currentModel = ai[provider]?.model || '';
    const currentKey = ai[provider]?.apiKey || '';
    const currentBaseUrl = ai[provider]?.baseUrl || '';
    const triggerMode = ai.triggerMode || 'automatic';
    const debounceMs = ai.debounceMs || 1000;

    const handleTriggerModeChange = (val) => {
        const updatedAi = { ...ai, triggerMode: val };
        onUpdateSettings({ ...settings, ai: updatedAi });
    };

    const handleDebounceChange = (val) => {
        const ms = parseInt(val, 10);
        const updatedAi = { ...ai, debounceMs: isNaN(ms) ? 1000 : ms };
        onUpdateSettings({ ...settings, ai: updatedAi });
    };

    const handleProviderChange = (newProvider) => {
        const updatedAi = { ...ai, provider: newProvider };
        onUpdateSettings({ ...settings, ai: updatedAi });
    };

    const handleModelChange = (val) => {
        const updatedProviderConfig = { ...(ai[provider] || {}), model: val };
        const updatedAi = { ...ai, [provider]: updatedProviderConfig };
        onUpdateSettings({ ...settings, ai: updatedAi });
    };

    const handleKeyChange = (val) => {
        const updatedProviderConfig = { ...(ai[provider] || {}), apiKey: val };
        const updatedAi = { ...ai, [provider]: updatedProviderConfig };
        onUpdateSettings({ ...settings, ai: updatedAi });
    };

    const handleUrlChange = (val) => {
        const updatedProviderConfig = { ...(ai[provider] || {}), baseUrl: val };
        const updatedAi = { ...ai, [provider]: updatedProviderConfig };
        onUpdateSettings({ ...settings, ai: updatedAi });
    };

    const toggleAi = () => {
        const updatedAi = { ...ai, enabled: !enabled };
        onUpdateSettings({ ...settings, ai: updatedAi });
    };


    const toggleLivePreview = () => {
        if (!onUpdateProjectMetadata) return;
        onUpdateProjectMetadata({
            ...projectMetadata,
            livePreview: !projectMetadata.livePreview
        });
    };

    const toggleAlignment = () => {
        if (!onUpdateProjectMetadata) return;
        const current = projectMetadata.captionAlignment || 'center';
        const next = current === 'center' ? 'justify' : 'center';
        onUpdateProjectMetadata({
            ...projectMetadata,
            captionAlignment: next
        });
    };

    // Format provider name nicely
    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    const isLive = projectMetadata?.livePreview;
    const alignment = projectMetadata?.captionAlignment || 'center';

    return (
        <>
            {showAiPanel && (
                <div className="mini-panel-overlay" onClick={() => setShowAiPanel(false)} />
            )}
            <footer className="status-bar">
                <div className="status-group left">
                    <div className="status-item-container">
                        <div
                            className={`status-item ai-status ${isAiThinking ? 'thinking' : ''} ${!enabled ? 'disabled' : ''}`}
                            onClick={() => setShowAiPanel(!showAiPanel)}
                            title="Click to configure AI"
                        >
                            <div className="status-icon">
                                {isAiThinking ? (
                                    <Activity size={12} className="spin-slow" />
                                ) : (
                                    <Cpu size={12} />
                                )}
                            </div>
                            <span>
                                {isAiThinking ? 'Thinking...' :
                                    !enabled ? 'AI Off' :
                                        `AI: ${providerLabel}`}
                            </span>
                            {isAiThinking && (
                                <button
                                    className="cancel-ai-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCancelAi && onCancelAi();
                                    }}
                                    title="Stop Thinking"
                                >
                                    <Square size={6} fill="currentColor" />
                                </button>
                            )}
                        </div>

                        {showAiPanel && (
                            <div className="mini-panel-popup" onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <strong style={{ fontSize: '12px' }}>AI Configuration</strong>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                            className="btn-icon-small"
                                            onClick={toggleAi}
                                            title={enabled ? "Disable AI" : "Enable AI"}
                                            style={{ color: enabled ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                                        >
                                            <Zap size={14} fill={enabled ? "currentColor" : "none"} />
                                        </button>
                                        <button className="btn-icon-small" onClick={() => setShowAiPanel(false)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                                    <label>Trigger Mode</label>
                                    <select value={triggerMode} onChange={e => handleTriggerModeChange(e.target.value)}>
                                        <option value="automatic">Automatic (On Stop)</option>
                                        <option value="manual">Manual (Ctrl+Space)</option>
                                    </select>

                                    {triggerMode === 'automatic' && (
                                        <div style={{ marginTop: 8 }}>
                                            <label>Wait Time (s)</label>
                                            <input
                                                type="number"
                                                value={(debounceMs || 1000) / 1000}
                                                onChange={e => handleDebounceChange(Number(e.target.value) * 1000)}
                                                step="0.1"
                                                min="0.2"
                                                max="5"
                                            />
                                        </div>
                                    )}
                                </div>

                                <label>Provider</label>
                                <select value={provider} onChange={e => handleProviderChange(e.target.value)}>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="ollama">Ollama (Local)</option>
                                </select>

                                <label>Model</label>
                                <input
                                    type="text"
                                    value={currentModel}
                                    onChange={e => handleModelChange(e.target.value)}
                                    placeholder="e.g. gpt-4o-mini, llama3"
                                />

                                {provider === 'ollama' ? (
                                    <>
                                        <label>Base URL</label>
                                        <input
                                            type="text"
                                            value={currentBaseUrl}
                                            onChange={e => handleUrlChange(e.target.value)}
                                            placeholder="http://localhost:11434"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label>API Key</label>
                                        <input
                                            type="password"
                                            value={currentKey}
                                            onChange={e => handleKeyChange(e.target.value)}
                                            placeholder="sk-..."
                                        />
                                    </>
                                )}

                                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn-small" onClick={() => onOpenSettings && onOpenSettings()}>
                                        More Settings...
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>


                    <div
                        className="status-item clickable"
                        onClick={toggleLivePreview}
                        title="Click to toggle Live Preview"
                    >
                        {isLive ? <Zap size={12} color="var(--accent-color)" fill="currentColor" /> : <Save size={12} />}
                        <span>{isLive ? 'Live Preview' : 'Update on Save'}</span>
                    </div>
                </div>

                <div className="status-group right">
                    {onTogglePaperView && (
                        <div className="status-item clickable" onClick={onTogglePaperView} title="Toggle Paper View (White Background)">
                            <FileText size={12} color={paperView ? "var(--text-primary)" : "var(--text-secondary)"} />
                            <span>{paperView ? "Paper View" : "Theme View"}</span>
                        </div>
                    )}

                    {wordCount !== undefined && (
                        <div className="status-item">
                            <span>{wordCount} words</span>
                        </div>
                    )}


                    <div className="status-item" onClick={toggleAlignment} title="Click to toggle Caption Alignment">
                        {alignment === 'justify' ? <AlignJustify size={12} /> : <AlignCenter size={12} />}
                        <span>{alignment === 'justify' ? 'Justified' : 'Centered'}</span>
                    </div>

                    <div className="status-item" title="UTF-8">
                        <span>UTF-8</span>
                    </div>
                </div>
            </footer >
        </>
    );
}
