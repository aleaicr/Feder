import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, Image, Link, List, Quote, Code, ImagePlus, Sparkles } from 'lucide-react';
import { requestInlineSuggestion } from '../utils/aiSuggestions';

export function Editor({ value, onChange, mode, onUploadImage, settings, projectMetadata, onAiThinking, onRegisterCancel }) {
    const textareaRef = useRef(null);
    const mirrorRef = useRef(null);
    const ghostRef = useRef(null);

    const debounceRef = useRef(null);
    const abortRef = useRef(null);
    const lastContextRef = useRef('');
    const cursorRef = useRef({ start: 0, end: 0 });

    const [suggestion, setSuggestion] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [cursorVersion, setCursorVersion] = useState(0);
    const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
    const [showCiteMenu, setShowCiteMenu] = useState(false);

    const insertText = (before, after = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.focus();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        const replacement = before + selectedText + after;

        // Use execCommand to preserve undo history if possible (deprecated but widely supported)
        const success = document.execCommand('insertText', false, replacement);

        if (!success) {
            // Fallback for newer browsers if they drop support (unlikely for now) or edge cases
            const newText = text.substring(0, start) + replacement + text.substring(end);
            onChange(newText);

            // Manually restore cursor
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + before.length, end + before.length);
            }, 0);
        } else {
            // If success, the cursor is usually arguably placed at the end of insertion. 
            // We might want to select the 'middle' part if it was a wrapper.
            // But execCommand places cursor at end.
            // Let's try to adjust selection if wrapping
            setTimeout(() => {
                textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
            }, 0);
        }
    };

    const updateCursor = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        cursorRef.current = {
            start: textarea.selectionStart || 0,
            end: textarea.selectionEnd || 0
        };
        setCursorVersion((v) => v + 1);
    }, []);

    const updateCaretPosition = useCallback(() => {
        const textarea = textareaRef.current;
        const mirror = mirrorRef.current;
        if (!textarea || !mirror) return;

        const computed = window.getComputedStyle(textarea);

        // Copy all font/text properties
        const properties = [
            'direction',
            'boxSizing',
            'width',
            'height',
            'overflowX',
            'overflowY',
            'borderTopWidth',
            'borderRightWidth',
            'borderBottomWidth',
            'borderLeftWidth',
            'borderStyle',
            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft',
            'fontStyle',
            'fontVariant',
            'fontWeight',
            'fontStretch',
            'fontSize',
            'fontSizeAdjust',
            'lineHeight',
            'fontFamily',
            'textAlign',
            'textTransform',
            'textIndent',
            'textDecoration',
            'letterSpacing',
            'wordSpacing',
            'tabSize',
            'MozTabSize'
        ];

        properties.forEach(prop => {
            mirror.style[prop] = computed[prop];
        });

        // Specific overrides for the mirror to ensure it behaves as a measurement tool
        mirror.style.position = 'absolute';
        mirror.style.top = '0';
        mirror.style.left = '0';
        mirror.style.visibility = 'hidden';
        mirror.style.width = `${textarea.clientWidth}px`; // Match inner width (no scrollbar)
        mirror.style.border = 'none'; // Since we use clientWidth, we don't want borders on mirror
        mirror.style.boxSizing = 'border-box'; // Ensure padding is included in width

        const caret = cursorRef.current.start || 0;
        const prefix = textarea.value.substring(0, caret);

        mirror.textContent = prefix;
        const span = document.createElement('span');
        span.textContent = '\u200b'; // Zero-width space
        mirror.appendChild(span);

        // Sync scroll
        mirror.scrollTop = textarea.scrollTop;
        mirror.scrollLeft = textarea.scrollLeft;

        // Calculate coordinates relative to the textarea wrapper
        const top = span.offsetTop + parseInt(computed.borderTopWidth) - textarea.scrollTop;
        const left = span.offsetLeft + parseInt(computed.borderLeftWidth) - textarea.scrollLeft;

        setCaretPos({ top, left });
    }, []);

    useEffect(() => {
        updateCursor();
    }, [updateCursor]);

    const acceptSuggestion = useCallback(() => {
        if (!suggestion) return;
        // Strip leading ellipses if they still appear
        const cleaned = suggestion.replace(/^\s*\.\.\.\s*/, '');
        insertText(cleaned, '');
        setSuggestion('');
    }, [suggestion]);


    const handleImageUpload = async () => {
        if (!onUploadImage) return;
        try {
            const result = await onUploadImage(); // Expects { alt, src }
            if (result) {
                insertText(`![${result.alt}](${result.src}){width=100%}`, '');
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        updateCaretPosition();
    }, [value, cursorVersion, suggestion, updateCaretPosition]);

    // AI Suggestion Logic
    const fetchSuggestion = useCallback(async () => {
        const aiGlobal = settings?.ai || {};
        const aiProject = projectMetadata?.aiConfig || {};
        const aiConfig = {
            ...aiGlobal,
            ...aiProject,
            openai: { ...(aiGlobal.openai || {}), ...(aiProject.openai || {}) },
            gemini: { ...(aiGlobal.gemini || {}), ...(aiProject.gemini || {}) },
            ollama: { ...(aiGlobal.ollama || {}), ...(aiProject.ollama || {}) }
        };

        if (!aiConfig.enabled) {
            setSuggestion('');
            if (onAiThinking) onAiThinking(false);
            setIsSuggesting(false);
            return;
        }

        const textarea = textareaRef.current;
        if (!textarea) return;

        const { start, end } = cursorRef.current;
        if (start !== end) {
            setSuggestion('');
            if (onAiThinking) onAiThinking(false);
            setIsSuggesting(false);
            return;
        }

        const prefix = value.slice(0, start);
        const suffix = value.slice(end);

        if (!prefix.trim() || prefix.length < 5) {
            setSuggestion('');
            if (onAiThinking) onAiThinking(false);
            setIsSuggesting(false);
            return;
        }

        const contextKey = `${prefix.slice(-100)}|${mode}`;
        if (contextKey === lastContextRef.current) return;
        lastContextRef.current = contextKey;

        if (abortRef.current) abortRef.current.abort();

        setIsSuggesting(true);
        if (onAiThinking) onAiThinking(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const suggestionText = await requestInlineSuggestion({
                aiConfig,
                prefix: prefix.slice(-3000),
                suffix: suffix.slice(0, 1000),
                mode,
                signal: controller.signal
            });
            if (!controller.signal.aborted) {
                if (suggestionText) {
                    setSuggestion(suggestionText);
                } else {
                    setSuggestion('');
                }
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('AI Suggestion Error:', e);
            }
            if (!controller.signal.aborted) setSuggestion('');
        } finally {
            if (!controller.signal.aborted) {
                setIsSuggesting(false);
                if (onAiThinking) onAiThinking(false);
            }
        }
    }, [value, mode, settings, projectMetadata, onAiThinking]);


    // Automatic Trigger Effect
    useEffect(() => {
        const aiProject = projectMetadata?.aiConfig || {};
        const enabled = settings?.ai?.enabled;
        const triggerMode = aiProject.triggerMode || 'automatic';

        if (!enabled || triggerMode === 'manual') {
            return;
        }

        const debounceMs = aiProject.debounceMs || 1000;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Only trigger if we have changes (cursorVersion or value)
        debounceRef.current = setTimeout(() => {
            fetchSuggestion();
        }, debounceMs);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value, cursorVersion, fetchSuggestion, settings?.ai?.enabled, projectMetadata?.aiConfig]);

    useEffect(() => {
        if (onRegisterCancel) {
            onRegisterCancel(() => {
                if (abortRef.current) abortRef.current.abort();
                setIsSuggesting(false);
                if (onAiThinking) onAiThinking(false);
                setSuggestion('');
                lastContextRef.current = ''; // Reset context so it can be re-triggered
            });
        }
    }, [onRegisterCancel, onAiThinking]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
            if (onAiThinking) onAiThinking(false);
        };
    }, [onAiThinking]);


    return (

        <div className="panel-editor">
            {/* Toolbar */}
            <div className="editor-toolbar">
                <ToolBtn icon={<Bold size={18} />} onClick={() => insertText('**', '**')} title="Bold" />
                <ToolBtn icon={<Italic size={18} />} onClick={() => insertText('*', '*')} title="Italic" />
                <ToolBtn icon={<Underline size={18} />} onClick={() => insertText('<u>', '</u>')} title="Underline" />
                <div className="divider"></div>
                <ToolBtn icon={<Heading1 size={18} />} onClick={() => insertText('# ')} title="H1" />
                <ToolBtn icon={<Heading2 size={18} />} onClick={() => insertText('## ')} title="H2" />
                <div className="divider"></div>
                <ToolBtn icon={<List size={18} />} onClick={() => insertText('- ')} title="List" />
                <ToolBtn icon={<Quote size={18} />} onClick={() => insertText('> ')} title="Quote" />
                <ToolBtn icon={<Code size={18} />} onClick={() => insertText('`', '`')} title="Inline Code" />
                <div className="divider"></div>
                <ToolBtn icon={<Link size={18} />} onClick={() => insertText('[', '](url)')} title="Link" />
                <ToolBtn icon={<Image size={18} />} onClick={() => insertText('![Caption of the figure]', '(path_to_figure){#label_figure width=100%}')} title="Image (Text)" />
                <ToolBtn icon={<ImagePlus size={18} />} onClick={handleImageUpload} title="Upload Image" />
                <div className="divider"></div>
                {settings?.ai?.enabled && (
                    <ToolBtn icon={<Sparkles size={18} />} onClick={() => {
                        lastContextRef.current = '';
                        fetchSuggestion();
                    }} title="Trigger AI (Ctrl+Space)" />
                )}
                {/* Researcher Mode Tools */}
                {mode === 'researcher' && (
                    <div className="relative-tool-container" style={{ position: 'relative', display: 'inline-block' }}>
                        <ToolBtn
                            label="Cite"
                            onClick={() => setShowCiteMenu(!showCiteMenu)}
                            title="Insert Citation or Reference"
                        />
                        {showCiteMenu && (
                            <div className="tool-dropdown-menu" style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                zIndex: 100,
                                minWidth: '200px',
                                padding: '4px 0'
                            }}>
                                <button className="dropdown-item" onClick={() => { insertText('[@paper_label]', ''); setShowCiteMenu(false); }}>
                                    Cite Paper
                                </button>
                                <button className="dropdown-item" onClick={() => { insertText('[text@paper_label]', ''); setShowCiteMenu(false); }}>
                                    Cite Paper as Text
                                </button>
                                <div className="divider-h"></div>
                                <button className="dropdown-item" onClick={() => { insertText('[figure@figure_label]', ''); setShowCiteMenu(false); }}>
                                    Cross Reference Figure
                                </button>
                                <button className="dropdown-item" onClick={() => { insertText('[equation@equation_label]', ''); setShowCiteMenu(false); }}>
                                    Cross Reference Equation
                                </button>
                                <button className="dropdown-item" onClick={() => { insertText('[table@table_label]', ''); setShowCiteMenu(false); }}>
                                    Cross Reference Table
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Text Area */}
            <div className="textarea-wrapper">
                {/* Mirror for logic only */}
                <div ref={mirrorRef} className="textarea-mirror" aria-hidden="true" />

                {/* Ghost Overlay for AI Suggestions */}
                <div ref={ghostRef} className="ghost-overlay" aria-hidden="true">
                    {value.substring(0, cursorRef.current?.start || 0)}
                    {suggestion && <span className="suggestion">{suggestion}</span>}
                </div>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => {
                        setSuggestion(''); // Clear on type
                        onChange(e.target.value);
                    }}
                    className="main-textarea"
                    placeholder="# Start writing..."
                    spellCheck="false"
                    onKeyDown={(e) => {
                        if (suggestion && e.key === 'Tab') {
                            e.preventDefault();
                            acceptSuggestion();
                        }
                        if (suggestion && e.key === 'Escape') {
                            e.preventDefault();
                            setSuggestion('');
                        }
                        /* Allow Ctrl+RightArrow but maybe standard navigation handles it? 
                           If we want partial accept, that's complex. */
                        if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                            e.preventDefault();
                            lastContextRef.current = '';
                            fetchSuggestion();
                        }
                    }}
                    onKeyUp={updateCursor}
                    onClick={updateCursor}
                    onSelect={updateCursor}
                    onScroll={(e) => {
                        updateCaretPosition();
                        if (ghostRef.current) {
                            ghostRef.current.scrollTop = e.target.scrollTop;
                            ghostRef.current.scrollLeft = e.target.scrollLeft;
                        }
                    }}
                    onDragOver={(e) => {

                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const data = e.dataTransfer.getData('application/json');
                        if (data) {
                            try {
                                const fileInfo = JSON.parse(data);
                                const { name, path } = fileInfo;
                                if (name.match(/\.(png|jpg|jpeg|svg|gif)$/i)) {
                                    // Derive ID from filename (remove extension)
                                    const id = name.replace(/\.[^/.]+$/, "");
                                    insertText(`![Caption of the figure](${path}){#${id} width=100%}`, '');
                                } else if (name.endsWith('.md')) {
                                    insertText(`[${name}](${path})`, '');
                                } else {
                                    insertText(path, '');
                                }
                            } catch (err) {
                                console.error('Failed to parse dropped data', err);
                            }
                        } else {
                            const text = e.dataTransfer.getData('text/plain');
                            if (text) insertText(text, '');
                        }
                    }}
                />
            </div>
        </div>
    );
}

function ToolBtn({ icon, label, onClick, title }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="btn-icon"
        >
            {icon || <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0 4px' }}>{label}</span>}
        </button>
    );
}
