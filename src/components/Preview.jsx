import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChevronDown, ChevronRight, List } from 'lucide-react';


// Helper to split markdown by level 1 headers
const splitByH1 = (text) => {
    if (!text) return [];

    const lines = text.split('\n');
    const sections = [];
    let currentSection = { title: null, lines: [], startLine: 0 };
    let inCodeBlock = false;

    lines.forEach((line, index) => {
        // Toggle code block status
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
        }

        // Check for H1: only if not in code block
        // Matches start of line # followed by space
        const h1Match = !inCodeBlock && line.match(/^(\s*)#\s+(.+)$/);

        if (h1Match) {
            // Push previous section if it has content or was a titled section
            if (currentSection.lines.length > 0 || currentSection.title !== null) {
                sections.push(currentSection);
            }

            // Start new section
            // content starts at next line, so offset is index + 1
            currentSection = {
                title: h1Match[2].trim(),
                lines: [],
                startLine: index + 1
            };
        } else {
            currentSection.lines.push(line);
        }
    });

    // Push final section
    if (currentSection.lines.length > 0 || currentSection.title !== null) {
        sections.push(currentSection);
    }

    return sections;
};

// BibTeX, Citation, and Reference Helpers
const parseBibTex = (text) => {
    const entries = {};
    const blocks = text.split(/^@/m).slice(1);
    blocks.forEach(block => {
        const openBrace = block.indexOf('{');
        if (openBrace === -1) return;

        // Extract key
        const afterType = block.substring(openBrace + 1);
        const comma = afterType.indexOf(',');
        if (comma === -1) return;
        const key = afterType.substring(0, comma).trim();

        // Parse fields
        const entry = { key };
        const body = afterType.substring(comma + 1);

        // Match field = {value} pattern
        // Note: This is a simple regex and assumes values are enclosed in braces and don't contain nested braces
        const fieldRegex = /([a-zA-Z0-9_\-]+)\s*=\s*{([^}]+)}/g;
        let match;
        while ((match = fieldRegex.exec(body)) !== null) {
            entry[match[1].toLowerCase()] = match[2];
        }
        entries[key] = entry;
    });
    return entries;
};

const formatCitation = (key, entry, type = 'parenthetical') => {
    if (!entry) return type === 'narrative' ? `${key}` : `(${key})`;
    const year = entry.year || 'n.d.';
    const authorsStr = entry.author;

    let label = key;
    if (authorsStr) {
        const authors = authorsStr.split(' and ').map(a => a.trim());
        const surnames = authors.map(a => {
            if (a.includes(',')) return a.split(',')[0].trim();
            const parts = a.split(' ');
            return parts[parts.length - 1];
        });

        if (surnames.length === 1) label = surnames[0];
        else if (surnames.length === 2) label = `${surnames[0]} & ${surnames[1]}`;
        else label = `${surnames[0]} et al.`;
    }

    if (type === 'narrative') {
        return `${label} (${year})`;
    }
    return `(${label}, ${year})`;
};

const ReferenceList = ({ bibData, citedKeys }) => {
    if (!bibData || Object.keys(bibData).length === 0) return null;

    // Filter to show only cited keys? Or all? User said "add the references", usually implies all in bib or cited.
    // Let's show all for now as user might manage the .bib file to only include relevant ones, 
    // or we can filter if we had the list of cited keys. 
    // Let's filter by cited if possible, but for now showing all is safer to ensure nothing is missed if regex misses.
    // Actually, usually you only list what you cite.

    const sortedEntries = Object.values(bibData).sort((a, b) => {
        const authA = a.author || '';
        const authB = b.author || '';
        return authA.localeCompare(authB);
    });

    return (
        <div className="references-section prose" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
            <h1>References</h1>
            <div className="references-list" style={{ fontSize: '0.9rem' }}>
                {sortedEntries.map(entry => {
                    if (citedKeys && !citedKeys.has(entry.key)) return null;

                    const authorsStr = entry.author ? entry.author.split(' and ').map((a, i, arr) => {
                        let formatted = a.trim();
                        if (!formatted.includes(',')) {
                            const parts = formatted.split(' ');
                            const surname = parts.pop();
                            const initials = parts.map(p => p[0] + '.').join(' ');
                            formatted = `${surname}, ${initials}`;
                        }
                        if (i === arr.length - 1 && arr.length > 1) return `& ${formatted}`;
                        return formatted;
                    }).join(', ') : 'Unknown Author';

                    return (
                        <div key={entry.key} style={{ marginBottom: '1em', paddingLeft: '1.5em', textIndent: '-1.5em' }}>
                            {authorsStr} ({entry.year}). {entry.title}.
                            {entry.journal && <span> <i>{entry.journal}</i>, </span>}
                            {entry.volume && <span><i>{entry.volume}</i></span>}
                            {entry.issue ? `(${entry.issue})` : ''}
                            {entry.pages && <span>, {entry.pages}</span>}.
                            {entry.doi && <span> https://doi.org/{entry.doi}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MarkdownSection = ({ title, content, offset, dirHandle, onUpdateContent, activeAccentColor, fullContent, metadata, projectMetadata }) => {
    const [isOpen, setIsOpen] = useState(true);

    const processedContent = React.useMemo(() => {
        return content.replace(/!\[(.*?)\]\((.*?)\)\{width=(.*?)\}/g, '![$1|width=$3]($2)');
    }, [content]);

    // Custom components with offset-aware checkbox logic
    const components = {
        img: ({ node, ...props }) => <AsyncImage {...props} dirHandle={dirHandle} metadata={metadata} projectMetadata={projectMetadata} />,

        input: ({ node, ...props }) => {
            if (props.type === 'checkbox') {
                return (
                    <input
                        type="checkbox"
                        checked={props.checked}
                        disabled={!onUpdateContent}
                        onChange={(e) => {
                            if (onUpdateContent && node && node.position) {
                                // Adjust local line number to global line number
                                const localLineIndex = node.position.start.line - 1;
                                const globalLineIndex = localLineIndex + offset;

                                const lines = fullContent.split('\n');

                                // Robust finding mechanism using global index
                                let targetIndex = globalLineIndex;
                                let found = false;

                                // Check direct match
                                if (lines[targetIndex] && lines[targetIndex].match(/^(\s*[-*+]\s+)\[([ xX])\]/)) {
                                    found = true;
                                }
                                // Search window +/- 2 lines if position is slightly off
                                else {
                                    for (let searchOffset = -2; searchOffset <= 2; searchOffset++) {
                                        const idx = globalLineIndex + searchOffset;
                                        if (idx >= 0 && idx < lines.length && lines[idx].match(/^(\s*[-*+]\s+)\[([ xX])\]/)) {
                                            targetIndex = idx;
                                            found = true;
                                            break;
                                        }
                                    }
                                }

                                if (found) {
                                    const line = lines[targetIndex];
                                    const match = line.match(/^(\s*[-*+]\s+)\[([ xX])\]/);
                                    if (match) {
                                        const prefix = match[1];
                                        const current = match[2];
                                        const newStatus = current === ' ' ? 'x' : ' ';
                                        lines[targetIndex] = line.replace(/^(\s*[-*+]\s+)\[([ xX])\]/, `${prefix}[${newStatus}]`);
                                        onUpdateContent(lines.join('\n'));
                                    }
                                }
                            }
                        }}
                        style={{ cursor: onUpdateContent ? 'pointer' : 'default', margin: '0 0.2rem 0.2rem 0', verticalAlign: 'middle', accentColor: activeAccentColor }}
                    />
                );
            }
            return <input {...props} />;
        },
        del: ({ node, ...props }) => <span {...props} style={{ textDecoration: 'none' }} />
    };

    if (title === null) {
        // Preamble (no header)
        if (!content.trim()) return null;
        return (
            <div className="prose preamble">
                <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={components}
                >
                    {processedContent}
                </ReactMarkdown>
            </div>
        );
    }

    return (
        <div className="markdown-section-wrapper">
            <div
                className="section-collapsible-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    '--hover-accent': activeAccentColor
                }}
            >
                <div style={{ color: activeAccentColor }}>
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <h1 className="section-h1-title">{title}</h1>
            </div>
            {isOpen && (
                <div className="prose section-content">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={components}
                    >
                        {processedContent}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

function PreviewComponent({ content, metadata, projectMetadata, dirHandle, mode, onUpdateContent, onUpdateMetadata }) {
    const [coverOpen, setCoverOpen] = useState(true);
    const [tocOpen, setTocOpen] = useState(true);

    const { title, authors, author, abstract, subtitle, showToC } = metadata || {};

    let displayAuthors = null;
    if (authors && Array.isArray(authors)) {
        displayAuthors = authors.map(a => {
            if (typeof a === 'object' && a !== null) return a.name || JSON.stringify(a);
            return a;
        }).join(', ');
    } else if (author) {
        displayAuthors = typeof author === 'object' ? (author.name || JSON.stringify(author)) : author;
    }

    const isResearch = mode === 'researcher';
    const isEngineer = mode === 'engineer';
    const isScript = mode === 'scriptwriter';
    const isScholar = mode === 'scholar';
    const isJournalist = mode === 'journalist';

    // Parse headers for Table of Contents
    const parseHeaders = (md) => {
        if (!md) return [];
        const lines = md.split('\n');
        const headers = [];
        lines.forEach(line => {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                headers.push({
                    level: match[1].length,
                    text: match[2].trim()
                });
            }
        });
        return headers;
    };

    const toc = parseHeaders(content);

    let renderedAuthors;
    if ((isResearch || isEngineer) && authors && Array.isArray(authors)) {
        renderedAuthors = (
            <div className={isEngineer ? "eng-authors-grid" : "paper-authors-block"}>
                {authors.map((a, i) => {
                    const name = typeof a === 'object' ? (a.name || 'Unknown') : a;
                    const aff = typeof a === 'object' ? (a.affiliation || a.company || '') : '';
                    const email = typeof a === 'object' ? a.email : '';

                    return (
                        <div key={i} className={isEngineer ? "eng-author-entry" : "paper-author-entry"}>
                            <span className={isEngineer ? "eng-author-name" : "paper-author-name"}>{name}</span>
                            {aff && <span className={isEngineer ? "eng-author-aff" : "paper-author-aff"}>{aff}</span>}
                            {email && <span className={isEngineer ? "eng-author-email" : "paper-author-email"}>{email}</span>}
                        </div>
                    );
                })}
            </div>
        );
    } else {
        renderedAuthors = displayAuthors && <div className="preview-authors">By {displayAuthors}</div>;
    }

    // Helper to safely render values as children (prevents crash on Date objects)
    const safeRender = (val) => {
        if (val === null || val === undefined) return '';
        if (val instanceof Date) return val.toLocaleDateString();
        if (typeof val === 'object' && !Array.isArray(val)) return JSON.stringify(val);
        return val;
    };

    const safeDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) return val.toLocaleDateString();
        return val;
    };

    const { client, projectNumber, date, revision, checkedBy, approvedBy, basedOn, contact, profession, course, showCover, objectives, accentColor } = metadata || {};

    const activeAccentColor = accentColor || '#9747ff';

    const displayDate = safeDate(date) || new Date().toLocaleDateString();

    const toggleObjective = (index) => {
        if (!objectives || !onUpdateMetadata) return;

        const newObjectives = [...objectives];
        const current = newObjectives[index];
        // Check if starts with [x] or [X]
        const isChecked = /^\[[xX]\]\s+/.test(current);

        if (isChecked) {
            newObjectives[index] = current.replace(/^\[[xX]\]\s+/, '');
        } else {
            newObjectives[index] = `[x] ${current}`;
        }

        onUpdateMetadata({ ...metadata, objectives: newObjectives });
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '151, 71, 255'; // Default
    };

    // Load Bibliography
    const [bibData, setBibData] = useState({});

    useEffect(() => {
        const loadBib = async () => {
            if (!dirHandle) return;
            try {
                // Use project setting or default
                const bibFile = projectMetadata?.bibFile || 'references.bib';
                const fileHandle = await dirHandle.getFileHandle(bibFile);
                const file = await fileHandle.getFile();
                const text = await file.text();
                setBibData(parseBibTex(text));
            } catch (e) {
                // console.warn('No references.bib found');
                setBibData({});
            }
        };
        loadBib();
    }, [dirHandle, projectMetadata?.bibFile]);

    // Process citations in content
    // Replace [@Key] with APA citation
    const { contentWithCitations, citedKeys } = React.useMemo(() => {
        if (!content) return { contentWithCitations: '', citedKeys: new Set() };

        const keys = new Set();
        const newContent = content.replace(/\[text@([a-zA-Z0-9_\-]+)\]/g, (match, key) => {
            keys.add(key);
            return formatCitation(key, bibData[key], 'narrative');
        }).replace(/\[@([a-zA-Z0-9_\-]+)\]/g, (match, key) => {
            keys.add(key);
            return formatCitation(key, bibData[key], 'parenthetical');
        });

        return { contentWithCitations: newContent, citedKeys: keys };
    }, [content, bibData]);

    const sections = React.useMemo(() => splitByH1(contentWithCitations), [contentWithCitations]);

    return (
        <div
            className={`panel-preview ${isResearch ? 'research-mode' : ''} ${isEngineer ? 'engineer-mode' : ''} ${isScript ? 'script-mode' : ''} ${isScholar ? 'scholar-mode' : ''} ${isJournalist ? 'journalist-mode' : ''}`}
            style={{
                '--scholar-accent': activeAccentColor,
                '--scholar-accent-rgb': hexToRgb(activeAccentColor)
            }}
        >
            <div className={`preview-content ${isResearch ? 'paper-layout' : ''} ${isEngineer ? 'eng-report-layout' : ''} ${isScript ? 'script-layout' : ''} ${isScholar ? 'scholar-lecture-layout' : ''} ${isJournalist ? 'journal-layout' : ''}`}>

                {/* Engineer Cover Page */}
                {isEngineer && (
                    <div className={`collapsible-section ${coverOpen ? 'open' : ''}`}>
                        <div className="section-header" onClick={() => setCoverOpen(!coverOpen)}>
                            {coverOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span>COVER PAGE</span>
                        </div>
                        {coverOpen && (
                            <header className="eng-cover-page">
                                <div className="eng-client-block">
                                    <span className="label">CLIENT:</span>
                                    <span className="value">{client || '---'}</span>
                                </div>
                                <div className="eng-title-block">
                                    <h1 className="eng-report-title">{title || 'CALCULATION REPORT'}</h1>
                                </div>
                                <div className="eng-meta-grid">
                                    <div className="eng-meta-item">
                                        <span className="label">PROJECT NO:</span>
                                        <span className="value">{projectNumber || '---'}</span>
                                    </div>
                                    <div className="eng-meta-item">
                                        <span className="label">DATE:</span>
                                        <span className="value">{displayDate}</span>
                                    </div>
                                    <div className="eng-meta-item">
                                        <span className="label">REVISION:</span>
                                        <span className="value">{revision || 'Rev 0'}</span>
                                    </div>
                                </div>
                                <div className="eng-team-section">
                                    <h3>PREPARED BY:</h3>
                                    {renderedAuthors}
                                </div>
                                <div className="eng-approval-grid">
                                    <div className="approval-col">
                                        <span className="label">CHECKED BY</span>
                                        <span className="signature-line"></span>
                                        <span className="value">{checkedBy || '---'}</span>
                                    </div>
                                    <div className="approval-col">
                                        <span className="label">APPROVED BY</span>
                                        <span className="signature-line"></span>
                                        <span className="value">{approvedBy || '---'}</span>
                                    </div>
                                </div>
                                {abstract && (
                                    <div className="eng-summary-block">
                                        <h3>EXECUTIVE SUMMARY</h3>
                                        <p>{abstract}</p>
                                    </div>
                                )}

                            </header>
                        )}
                    </div>
                )}

                {/* Scriptwriter Cover Page */}
                {isScript && (
                    <div className={`collapsible-section ${coverOpen ? 'open' : ''}`}>
                        <div className="section-header" onClick={() => setCoverOpen(!coverOpen)}>
                            {coverOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span>COVER PAGE</span>
                        </div>
                        {coverOpen && (
                            <header className="script-cover-page">
                                <div className="script-title-container">
                                    <h1 className="script-title">{title || 'UNTITLED SCRIPT'}</h1>
                                    {author && (
                                        <div className="script-author-block">
                                            <span>written by</span>
                                            <p className="script-author-name">{author}</p>
                                        </div>
                                    )}
                                    {basedOn && (
                                        <div className="script-based-block">
                                            <span>based on</span>
                                            <p>{basedOn}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="script-footer-info">
                                    {date && <div className="script-date">{safeDate(date)}</div>}
                                    {contact && <div className="script-contact">{contact}</div>}
                                </div>

                            </header>
                        )}
                    </div>
                )}

                {/* Scholar Cover Page */}
                {isScholar && showCover !== false && (
                    <div className={`collapsible-section ${coverOpen ? 'open' : ''}`}>
                        <div className="section-header" onClick={() => setCoverOpen(!coverOpen)}>
                            {coverOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span>COURSE COVER</span>
                        </div>
                        {coverOpen && (
                            <header className="scholar-cover-page">
                                <div className="scholar-course-tag">{course || 'COURSE NAME'}</div>
                                <h1 className="scholar-lecture-title">{title || 'LECTURE NOTES'}</h1>
                                <div className="scholar-meta-info">
                                    <div className="meta-item">
                                        <span className="label">STUDENT</span>
                                        <span className="value">{displayAuthors || ''}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="label">DATE</span>
                                        <span className="value">{displayDate}</span>
                                    </div>
                                </div>
                                {objectives && objectives.length > 0 && (
                                    <div className="scholar-objectives-preview">
                                        <span className="label" style={{ display: 'block', marginBottom: 15, fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>LECTURE OBJECTIVES</span>
                                        <div className="scholar-checklist">
                                            {objectives.map((obj, i) => {
                                                const isChecked = /^\[[xX]\]\s+/.test(obj);
                                                const displayText = obj.replace(/^\[[xX]\]\s+/, '');

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`checklist-item ${isChecked ? 'checked' : ''}`}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: onUpdateMetadata ? 'pointer' : 'default' }}
                                                        onClick={() => toggleObjective(i)}
                                                    >
                                                        <div style={{
                                                            width: 18,
                                                            height: 18,
                                                            border: `2px solid ${activeAccentColor}`,
                                                            borderRadius: 4,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            background: isChecked ? activeAccentColor : 'transparent',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            {isChecked && <div style={{ width: 6, height: 10, borderBottom: '2px solid white', borderRight: '2px solid white', transform: 'rotate(45deg)', marginTop: -2 }}></div>}
                                                        </div>
                                                        <span style={{ fontSize: '1rem', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.7 : 1 }}>
                                                            {displayText}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            </header>
                        )}
                    </div>
                )}

                {/* Journalist Cover/Header */}
                {isJournalist && (
                    <div className={`collapsible-section ${coverOpen ? 'open' : ''}`}>
                        <div className="section-header" onClick={() => setCoverOpen(!coverOpen)}>
                            {coverOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span>PRESS HEADER</span>
                        </div>
                        {coverOpen && (
                            <header className="journal-header">
                                <div className="journal-meta-top">
                                    <span className="journal-dateline">{date ? safeDate(date) : new Date().toLocaleDateString()}</span>
                                    <span className="journal-category">PRESS RELEASE / NEWS</span>
                                </div>
                                <h1 className="journal-title">{safeRender(title) || 'UNTITLED ARTICLE'}</h1>
                                {subtitle && <p className="journal-subtitle">{safeRender(subtitle)}</p>}
                                <div className="journal-byline">
                                    <div className="byline-info">
                                        <span className="by">By </span>
                                        <span className="journalist-name">{displayAuthors || 'Anonymous'}</span>
                                        {profession && <span className="journalist-profession">, {safeRender(profession)}</span>}
                                    </div>
                                </div>
                            </header>
                        )}
                    </div>
                )}

                {/* Table of Contents (Engineer Mode) */}
                {isEngineer && showToC !== false && toc.length > 0 && (
                    <div className={`collapsible-section ${tocOpen ? 'open' : ''}`} style={{ marginTop: coverOpen ? 0 : 20 }}>
                        <div className="section-header" onClick={() => setTocOpen(!tocOpen)}>
                            {tocOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <List size={14} style={{ marginLeft: 5 }} />
                            <span>CONTENTS</span>
                        </div>
                        {tocOpen && (
                            <div className="toc-block">
                                <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>Table of Contents</h2>
                                <div className="toc-list">
                                    {toc.map((h, i) => (
                                        <div
                                            key={i}
                                            className={`toc-item level-${h.level}`}
                                            style={{
                                                marginLeft: (h.level - 1) * 20,
                                                fontSize: h.level === 1 ? '1rem' : '0.9rem',
                                                fontWeight: h.level === 1 ? 700 : 400,
                                                marginBottom: 8,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                borderBottom: '1px dotted #ccc',
                                                paddingBottom: 2
                                            }}
                                        >
                                            <span className="toc-text">{h.text}</span>
                                            <span className="toc-dots"></span>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}
                    </div>
                )}

                {!isEngineer && !isScript && !isScholar && !isJournalist && (title || displayAuthors || abstract || subtitle) && (
                    <header className="preview-header">
                        {title && <h1 className={`preview-title ${isResearch ? 'paper-title' : ''}`}>{safeRender(title)}</h1>}
                        {subtitle && <p className="preview-subtitle">{safeRender(subtitle)}</p>}
                        {renderedAuthors}
                        {profession && <div className="preview-profession">{safeRender(profession)}</div>}
                        {date && <div className="preview-date">{safeDate(date)}</div>}
                        {abstract && (
                            <div className="preview-abstract">
                                <span className="preview-abstract-label">Abstract</span>
                                {safeRender(abstract)}
                            </div>
                        )}
                    </header>
                )}

                <div className="preview-markdown-body">
                    {sections.map((section, idx) => (
                        <MarkdownSection
                            key={idx}
                            title={section.title}
                            content={section.lines.join('\n')}
                            offset={section.startLine}
                            dirHandle={dirHandle}
                            onUpdateContent={onUpdateContent}
                            activeAccentColor={activeAccentColor}
                            fullContent={content}
                            metadata={metadata}
                            projectMetadata={projectMetadata}
                        />
                    ))}

                    {/* References Section */}
                    {metadata?.showReferences && !isJournalist && (
                        <ReferenceList bibData={bibData} citedKeys={citedKeys} />
                    )}
                </div>
            </div>
        </div>
    );
}

export const Preview = React.memo(PreviewComponent);

function AsyncImage({ src, alt, dirHandle, metadata, projectMetadata }) {
    const [imgSrc, setImgSrc] = useState(src);

    // Extract width if present in alt text (from pipe syntax)
    let displayAlt = alt || '';
    let width = null;
    if (displayAlt && displayAlt.includes('|width=')) {
        const parts = displayAlt.split('|width=');
        displayAlt = parts[0];
        width = parts[1];
    }

    // Caption Alignment: check metadata (file frontmatter) first, then projectMetadata
    const captionAlign = (metadata && metadata.captionAlignment) || (projectMetadata && projectMetadata.captionAlignment) || 'center';

    useEffect(() => {
        let objectUrl;
        const loadLocalImage = async () => {
            // Only attempt to load if we have a directory handle and it's not an external URL
            if (!dirHandle || !src || src.startsWith('http') || src.startsWith('blob:')) return;

            try {
                // Assume src is relative path like "figures/image.png"
                // We need to traverse the path relative to dirHandle
                const parts = src.split('/');
                let currentHandle = dirHandle;

                for (let i = 0; i < parts.length - 1; i++) {
                    currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
                }

                const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1]);
                const file = await fileHandle.getFile();
                objectUrl = URL.createObjectURL(file);
                setImgSrc(objectUrl);
            } catch (err) {
                console.warn('Failed to load local image:', src);
            }
        };

        loadLocalImage();

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src, dirHandle]);

    return (
        <figure style={{ textAlign: 'center', width: '100%', margin: '1.5rem 0' }}>
            <img
                src={imgSrc}
                alt={displayAlt}
                className="rounded-lg shadow-md mx-auto"
                style={{
                    maxWidth: '100%',
                    width: width || 'auto'
                }}
            />
            {displayAlt && (
                <figcaption
                    className="text-sm text-gray-500 mt-2 italic"
                    style={{ textAlign: captionAlign }}
                >
                    {displayAlt}
                </figcaption>
            )}
        </figure>
    );
}
