import { BookOpen, FlaskConical, PenTool, GraduationCap, Film } from 'lucide-react';

export function ModeSwitcher({ mode, onModeChange }) {
    return (
        <div className="mode-switcher">
            <button
                onClick={() => onModeChange('journalist')}
                className={`mode-btn ${mode === 'journalist' ? 'active' : ''}`}
                title="Journalist"
            >
                <BookOpen size={16} />
                <span>Journalist</span>
            </button>
            <button
                onClick={() => onModeChange('researcher')}
                className={`mode-btn ${mode === 'researcher' ? 'active' : ''}`}
                title="Researcher"
            >
                <FlaskConical size={16} />
                <span>Researcher</span>
            </button>
            <button
                onClick={() => onModeChange('engineer')}
                className={`mode-btn ${mode === 'engineer' ? 'active' : ''}`}
                title="Engineer"
            >
                <PenTool size={16} />
                <span>Engineer</span>
            </button>
            <button
                onClick={() => onModeChange('scholar')}
                className={`mode-btn ${mode === 'scholar' ? 'active' : ''}`}
                title="Scholar"
            >
                <GraduationCap size={16} />
                <span>Scholar</span>
            </button>
            <button
                onClick={() => onModeChange('scriptwriter')}
                className={`mode-btn ${mode === 'scriptwriter' ? 'active' : ''}`}
                title="Scriptwriter"
            >
                <Film size={16} />
                <span>Scriptwriter</span>
            </button>
        </div>
    );
}
