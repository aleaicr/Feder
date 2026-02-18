import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Zap, AlignCenter, AlignJustify, Save, Activity, Settings, X, Check, FileText, Square, HelpCircle } from 'lucide-react';


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
    const aiConfig = projectMetadata?.aiConfig || {};
    const aiGlobal = settings?.ai || {};

    const enabled = aiGlobal.enabled; // Toggle is still global for now (app feature)
    const provider = aiConfig.provider || 'gemini';
    const triggerMode = aiConfig.triggerMode || 'automatic';
    const debounceMs = aiConfig.debounceMs || 1000;

    // Config values from Project Meta
    const currentModel = aiConfig[provider]?.model || (provider === 'gemini' ? 'gemini-2.5-flash-lite (recommended)' : (provider === 'ollama' ? 'gemma3:4b (recommended)' : ''));
    const currentBaseUrl = aiConfig[provider]?.baseUrl || '';

    // Sensitive values from Global Settings
    const currentKey = aiGlobal[provider]?.apiKey || '';

    const handleTriggerModeChange = (val) => {
        onUpdateProjectMetadata({ ...projectMetadata, aiConfig: { ...aiConfig, triggerMode: val } });
    };

    const handleDebounceChange = (val) => {
        const ms = parseInt(val, 10);
        onUpdateProjectMetadata({ ...projectMetadata, aiConfig: { ...aiConfig, debounceMs: isNaN(ms) ? 1000 : ms } });
    };

    const handleProviderChange = (newProvider) => {
        onUpdateProjectMetadata({ ...projectMetadata, aiConfig: { ...aiConfig, provider: newProvider } });
    };

    const handleModelChange = (val) => {
        const updatedProviderConfig = { ...(aiConfig[provider] || {}), model: val };
        onUpdateProjectMetadata({ ...projectMetadata, aiConfig: { ...aiConfig, [provider]: updatedProviderConfig } });
    };

    const handleKeyChange = (val) => {
        const updatedAiGlobal = { ...aiGlobal, [provider]: { ...(aiGlobal[provider] || {}), apiKey: val } };
        onUpdateSettings({ ...settings, ai: updatedAiGlobal });
    };

    const handleUrlChange = (val) => {
        const updatedProviderConfig = { ...(aiConfig[provider] || {}), baseUrl: val };
        onUpdateProjectMetadata({ ...projectMetadata, aiConfig: { ...aiConfig, [provider]: updatedProviderConfig } });
    };

    const toggleAi = () => {
        onUpdateSettings({ ...settings, ai: { ...aiGlobal, enabled: !enabled } });
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
                                                className="clean-number"
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

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label>Model</label>
                                    {provider === 'ollama' && (
                                        <button
                                            className="btn-icon-small"
                                            onClick={() => {
                                                const url = 'https://github.com/CodexFabrica/Feder/blob/main/docs/README_local_AI_assist.md';
                                                if (window.electronAPI && window.electronAPI.openExternal) {
                                                    window.electronAPI.openExternal(url);
                                                } else {
                                                    window.open(url, '_blank');
                                                }
                                            }}
                                            title="Learn how to use local models"
                                            style={{ color: 'var(--accent-color)', padding: '0 4px' }}
                                        >
                                            <HelpCircle size={14} />
                                        </button>
                                    )}
                                </div>
                                {provider === 'ollama' ? (
                                    <input
                                        type="text"
                                        value={currentModel}
                                        onChange={e => handleModelChange(e.target.value)}
                                        placeholder="e.g. gemma3:4b (recommended)"
                                    />
                                ) : (
                                    <select
                                        value={currentModel}
                                        onChange={e => handleModelChange(e.target.value)}
                                    >
                                        {provider === 'gemini' && [
                                            'gemini-2.5-flash-lite (recommended)',
                                            'gemini-3-flash-preview',
                                            'gemini-3-pro-preview',
                                            'gemini-2.5-flash',
                                            'gemini-2.5-pro'
                                        ].map(m => <option key={m} value={m}>{m}</option>)}

                                        {provider === 'openai' && [
                                            'gpt-5.2-chat-latest',
                                            'gpt-5-1-chat-latest',
                                            'gpt-5-mini',
                                            'gpt-5-nano',
                                            'gpt-4.1-nano',
                                            'gpt-4o-mini',
                                            'gpt-4o'
                                        ].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                )}

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
                            <span>{paperView ? "Paper View ON" : "Paper View OFF"}</span>
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
