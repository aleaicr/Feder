import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export function MetadataForm({ metadata, onChange, mode }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...metadata, [name]: value });
    };

    // Helper to safely render values or pass to inputs
    const safeStr = (val) => {
        if (val === null || val === undefined) return '';
        if (val instanceof Date) return val.toLocaleDateString();
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    const handleAuthorChange = (index, field, value) => {
        const newAuthors = [...(metadata.authors || [])];
        if (!newAuthors[index]) newAuthors[index] = {};

        // Handle direct string authors if legacy
        if (typeof newAuthors[index] === 'string') {
            newAuthors[index] = { name: newAuthors[index] };
        }

        newAuthors[index][field] = value;
        onChange({ ...metadata, authors: newAuthors });
    };

    const addAuthor = () => {
        onChange({ ...metadata, authors: [...(metadata.authors || []), { name: '', affiliation: '', email: '' }] });
    };

    const removeAuthor = (index) => {
        const newAuthors = (metadata.authors || []).filter((_, i) => i !== index);
        onChange({ ...metadata, authors: newAuthors });
    };

    const handleObjectiveChange = (index, value) => {
        const newObjs = [...(metadata.objectives || [])];
        newObjs[index] = value;
        onChange({ ...metadata, objectives: newObjs });
    };

    const addObjective = () => {
        onChange({ ...metadata, objectives: [...(metadata.objectives || []), ''] });
    };

    const removeObjective = (index) => {
        const newObjs = (metadata.objectives || []).filter((_, i) => i !== index);
        onChange({ ...metadata, objectives: newObjs });
    };

    return (
        <div className="metadata-panel compact">
            <div className="metadata-header" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="meta-summary">
                    <strong>{safeStr(metadata.title) || 'Untitled'}</strong>
                    <span className="meta-pipe"> | </span>
                    <span className="meta-author">
                        {(mode === 'researcher' || mode === 'engineer')
                            ? (metadata.authors ? metadata.authors.map(a => (typeof a === 'string' ? a : a.name)).join(', ') : 'No Authors')
                            : (mode === 'scholar' ? safeStr(metadata.author || 'Student') : safeStr(metadata.author || 'No Author'))
                        }
                    </span>
                </span>
                <button className="btn-icon">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {isExpanded && (
                <div className="form-grid compact-grid">
                    <div className="form-group full-width">
                        <label>Title</label>
                        <input
                            type="text"
                            name="title"
                            value={safeStr(metadata.title)}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Document Title"
                        />
                    </div>

                    {mode === 'journalist' && (
                        <>
                            <div className="form-group full-width">
                                <label>Subtitle</label>
                                <input
                                    type="text"
                                    name="subtitle"
                                    value={safeStr(metadata.subtitle)}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Subtitle"
                                />
                            </div>
                            <div className="form-group">
                                <label>Author</label>
                                <input
                                    type="text"
                                    name="author"
                                    value={metadata.author || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Author Name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Profession</label>
                                <input
                                    type="text"
                                    name="profession"
                                    value={metadata.profession || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g. Journalist, Reporter"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="text"
                                    name="date"
                                    value={safeStr(metadata.date)}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="YYYY-MM-DD"
                                />
                            </div>
                        </>
                    )}

                    {(mode === 'researcher' || mode === 'engineer') && (
                        <>
                            <div className="form-group full-width">
                                <label>{mode === 'engineer' ? 'Engineers / Authors' : 'Authors'}</label>
                                <div className="authors-list">
                                    {(metadata.authors || [{ name: '', affiliation: '', email: '' }]).map((author, idx) => {
                                        const authName = typeof author === 'string' ? author : author.name || '';
                                        const authAff = author.affiliation || '';
                                        const authEmail = author.email || '';
                                        return (
                                            <div key={idx} className="author-entry" style={{ marginBottom: 10, padding: 8, background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 4, position: 'relative' }}>
                                                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                                    <input
                                                        type="text"
                                                        value={authName}
                                                        onChange={(e) => handleAuthorChange(idx, 'name', e.target.value)}
                                                        className="form-input"
                                                        placeholder={`Author ${idx + 1}`}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        onClick={() => removeAuthor(idx)}
                                                        className="btn-icon small remove-author-btn"
                                                        title="Remove Author"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                                    <input
                                                        type="text"
                                                        value={authAff}
                                                        onChange={(e) => handleAuthorChange(idx, 'affiliation', e.target.value)}
                                                        className="form-input small"
                                                        placeholder={mode === 'engineer' ? "Department" : "Affiliation"}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={authEmail}
                                                        onChange={(e) => handleAuthorChange(idx, 'email', e.target.value)}
                                                        className="form-input small"
                                                        placeholder="Email"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <button onClick={addAuthor} className="text-btn smaller">+ Add Author</button>
                                </div>
                            </div>

                            {mode === 'engineer' && (
                                <>
                                    <div className="form-group">
                                        <label>Client</label>
                                        <input
                                            type="text"
                                            name="client"
                                            value={metadata.client || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="Client Name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Project Number</label>
                                        <input
                                            type="text"
                                            name="projectNumber"
                                            value={metadata.projectNumber || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="ENG-2024-001"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input
                                            type="text"
                                            name="date"
                                            value={safeStr(metadata.date)}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Revision</label>
                                        <input
                                            type="text"
                                            name="revision"
                                            value={metadata.revision || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="Rev 0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Table of Contents</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 35 }}>
                                            <label className="switch small">
                                                <input
                                                    type="checkbox"
                                                    name="showToC"
                                                    checked={metadata.showToC ?? true}
                                                    onChange={(e) => onChange({ ...metadata, showToC: e.target.checked })}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Enable ToC</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Checked By</label>
                                        <input
                                            type="text"
                                            name="checkedBy"
                                            value={metadata.checkedBy || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="Verifier Name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Approved By</label>
                                        <input
                                            type="text"
                                            name="approvedBy"
                                            value={metadata.approvedBy || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="Approver Name"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group full-width">
                                <label>{mode === 'engineer' ? 'Summary' : 'Abstract'}</label>
                                <textarea
                                    name="abstract"
                                    value={safeStr(metadata.abstract)}
                                    onChange={handleChange}
                                    rows={2}
                                    className="form-input"
                                    placeholder={mode === 'engineer' ? "Executive summary of calculations..." : "Abstract..."}
                                />
                            </div>
                            <div className="form-group">
                                <label>References</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 35 }}>
                                    <label className="switch small">
                                        <input
                                            type="checkbox"
                                            name="showReferences"
                                            checked={metadata.showReferences ?? false}
                                            onChange={(e) => onChange({ ...metadata, showReferences: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Append References (APA)</span>
                                </div>
                            </div>
                        </>
                    )}

                    {mode === 'scriptwriter' && (
                        <>
                            <div className="form-group full-width">
                                <label>Writer</label>
                                <input
                                    type="text"
                                    name="author"
                                    value={safeStr(metadata.author)}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Writer Name"
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Based On</label>
                                <input
                                    type="text"
                                    name="basedOn"
                                    value={metadata.basedOn || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Based on the novel by..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Draft Date</label>
                                <input
                                    type="text"
                                    name="date"
                                    value={safeStr(metadata.date)}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Draft Date"
                                />
                            </div>
                            <div className="form-group">
                                <label>Contact Info</label>
                                <textarea
                                    name="contact"
                                    value={metadata.contact || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    className="form-input"
                                    placeholder="Agent / Contact Details"
                                />
                            </div>
                        </>
                    )}

                    {mode === 'scholar' && (
                        <>
                            <div className="form-group full-width">
                                <label>Course Name</label>
                                <input
                                    type="text"
                                    name="course"
                                    value={metadata.course || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g. Introduction to Physics"
                                />
                            </div>
                            <div className="form-group">
                                <label>Student Name</label>
                                <input
                                    type="text"
                                    name="author"
                                    value={metadata.author || ''}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Student Name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="text"
                                    name="date"
                                    value={safeStr(metadata.date)}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="YYYY-MM-DD"
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Lecture Objectives</label>
                                <div className="authors-list">
                                    {(metadata.objectives || ['']).map((obj, idx) => (
                                        <div key={idx} className="author-entry" style={{ marginBottom: 6, display: 'flex', gap: 6 }}>
                                            <input
                                                type="text"
                                                value={obj}
                                                onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                                                className="form-input"
                                                placeholder={`Objective ${idx + 1}`}
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                onClick={() => removeObjective(idx)}
                                                className="btn-icon small remove-author-btn"
                                                title="Remove Objective"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={addObjective} className="text-btn smaller">+ Add Objective</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Lecture Materials Cover</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 35 }}>
                                    <label className="switch small">
                                        <input
                                            type="checkbox"
                                            name="showCover"
                                            checked={metadata.showCover ?? true}
                                            onChange={(e) => onChange({ ...metadata, showCover: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Enable Cover</span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group full-width">
                        <label>Accent Color</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[
                                '#9747ff', // Default Purple
                                '#ff6b6b', // Red
                                '#20c997', // Green
                                '#339af0', // Blue
                                '#fcc419', // Yellow
                                '#ff922b', // Orange
                                '#f06595', // Pink
                                '#845ef7', // Violet
                                '#51cf66', // Lime
                                '#66d9e8'  // Cyan
                            ].map(color => (
                                <button
                                    key={color}
                                    onClick={() => onChange({ ...metadata, accentColor: color })}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: color,
                                        border: metadata.accentColor === color ? '2px solid var(--text-primary)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}