import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export function MetadataForm({ metadata, onChange, mode }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...metadata, [name]: value });
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

    return (
        <div className="metadata-panel compact">
            <div className="metadata-header" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="meta-summary">
                    <strong>{metadata.title || 'Untitled'}</strong>
                    <span className="meta-pipe"> | </span>
                    <span className="meta-author">
                        {(mode === 'researcher' || mode === 'engineer')
                            ? (metadata.authors ? metadata.authors.map(a => (typeof a === 'string' ? a : a.name)).join(', ') : 'No Authors')
                            : (metadata.author || 'No Author')
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
                            value={metadata.title || ''}
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
                                    value={metadata.subtitle || ''}
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
                                    value={metadata.date || ''}
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
                                            value={metadata.date || ''}
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
                                    value={metadata.abstract || ''}
                                    onChange={handleChange}
                                    rows={2}
                                    className="form-input"
                                    placeholder={mode === 'engineer' ? "Executive summary of calculations..." : "Abstract..."}
                                />
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
                                    value={metadata.author || ''}
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
                                    value={metadata.date || ''}
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
                </div>
            )}
        </div>
    );
}
