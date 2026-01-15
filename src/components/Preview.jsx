import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChevronDown, ChevronRight, List } from 'lucide-react';

export function Preview({ content, metadata, dirHandle, mode }) {
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

    const isResearch = mode === 'researcher' || mode === 'scholar';
    const isEngineer = mode === 'engineer';
    const isScript = mode === 'scriptwriter';

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

    // Helper to safely render dates
    const safeDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) return val.toLocaleDateString();
        return val;
    };

    const { client, projectNumber, date, revision, checkedBy, approvedBy, basedOn, contact, profession } = metadata || {};

    const displayDate = safeDate(date) || new Date().toLocaleDateString();

    return (
        <div className={`panel-preview ${isResearch ? 'research-mode' : ''} ${isEngineer ? 'engineer-mode' : ''} ${isScript ? 'script-mode' : ''}`}>
            <div className={`preview-content ${isResearch ? 'paper-layout' : ''} ${isEngineer ? 'eng-report-layout' : ''} ${isScript ? 'script-layout' : ''}`}>

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
                                <div className="page-break-indicator"></div>
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
                                <div className="page-break-indicator"></div>
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
                                <div className="page-break-indicator"></div>
                            </div>
                        )}
                    </div>
                )}

                {!isEngineer && !isScript && (title || displayAuthors || abstract || subtitle) && (
                    <header className="preview-header">
                        {title && <h1 className={`preview-title ${isResearch ? 'paper-title' : ''}`}>{title}</h1>}
                        {subtitle && <p className="preview-subtitle">{subtitle}</p>}
                        {renderedAuthors}
                        {profession && <div className="preview-profession">{profession}</div>}
                        {date && <div className="preview-date">{date}</div>}
                        {abstract && (
                            <div className="preview-abstract">
                                <span className="preview-abstract-label">Abstract</span>
                                {abstract}
                            </div>
                        )}
                    </header>
                )}
                <div className="prose">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            img: ({ node, ...props }) => <AsyncImage {...props} dirHandle={dirHandle} />
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}

function AsyncImage({ src, alt, dirHandle }) {
    const [imgSrc, setImgSrc] = useState(src);

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
        <figure>
            <img src={imgSrc} alt={alt} className="rounded-lg shadow-md mx-auto" />
            {alt && <figcaption className="text-center text-sm text-gray-500 mt-2 italic">{alt}</figcaption>}
        </figure>
    );
}
