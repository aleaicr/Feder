import React, { useState, useEffect } from 'react';
import './App.css';
import yaml from 'js-yaml';
import { Layout } from './components/Layout';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { ModeSwitcher } from './components/ModeSwitcher';
import { MetadataForm } from './components/MetadataForm';
import { FileExplorer } from './components/FileExplorer';
import { ImageViewer } from './components/ImageViewer';
import { ResizablePanels } from './components/ResizablePanels';
import { useFileSystem } from './hooks/useFileSystem';
import { generateLatex } from './utils/latexExport';
import { saveProjectHandle, getProjectHandle, saveRecentProject, getRecentProjects, saveSettings, getSettings, saveRecentList } from './utils/db';
import { WelcomeScreen } from './components/WelcomeScreen';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [mode, setMode] = useState('journalist');
  const [content, setContent] = useState(''); // Stores markdown or bib content
  const [metadata, setMetadata] = useState({});
  const [projectMetadata, setProjectMetadata] = useState({ name: 'Untitled Project' });
  const [currentFile, setCurrentFile] = useState({ name: '', kind: 'md', handle: null, src: null });
  const [showMetadata, setShowMetadata] = useState(true);
  const [showExplorer, setShowExplorer] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [viewState, setViewState] = useState('welcome'); // 'welcome' | 'editor'
  const [recentProjects, setRecentProjects] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [settings, setSettings] = useState({ name: '', affiliation: '', company: '', profession: '', email: '', phone: '' });

  const {
    fileHandle,
    dirHandle,
    openFile,
    saveFile,
    saveFileAs,
    openDirectory,
    createSubDir,
    writeFileInDir,
    setFileHandle,
    setDirHandle,
    readFile
  } = useFileSystem();

  // Theme Toggle
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load project metadata if dirHandle changes
  // Load project metadata if dirHandle changes
  useEffect(() => {
    const loadProjectMeta = async () => {
      if (!dirHandle) return;
      try {
        await saveProjectHandle(dirHandle); // Persist handle

        const handle = await dirHandle.getFileHandle('project_metadata.json');
        const file = await handle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        setProjectMetadata(data);
      } catch (e) {
        // No metadata file, maybe create default?
      }
    };
    loadProjectMeta();
  }, [dirHandle]);

  // Load recent projects
  useEffect(() => {
    const loadRecents = async () => {
      try {
        const recents = await getRecentProjects();
        setRecentProjects(recents);

        // Auto open last? User didn't explicitly asking for auto-open, but "show previously used folders"
        // So we just load the list.
      } catch (e) {
        console.error(e);
      }
    };
    loadRecents();
  }, [viewState]); // Reload when going back to welcome

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      const stored = await getSettings();
      setSettings(stored);
    };
    loadSettings();
  }, []);

  const handleOpenRecent = async (project) => {
    if (!project || !project.handle) {
      alert('Selected project data is corrupted.');
      return;
    }

    // AUTOSAVE BEFORE SWITCHING
    if (isDirty) await handleSave();

    setIsLoading(true);
    try {
      // Verify permission
      let permission = await project.handle.queryPermission({ mode: 'readwrite' });

      if (permission !== 'granted') {
        permission = await project.handle.requestPermission({ mode: 'readwrite' });
      }

      if (permission === 'granted') {
        setDirHandle(project.handle);
        setMode(project.mode || 'researcher');
        setViewState('editor');

        await openDirectoryWithHandle(project.handle);
        // Update timestamp
        await saveRecentProject(project.handle, project.name, project.mode);
      } else {
        alert('Permission denied. Cannot open folder.');
      }
    } catch (e) {
      console.error('Failed to open recent', e);
      if (e.name === 'NotFoundError') {
        alert('Folder not found. It may have been moved or deleted.');
      } else {
        alert('Could not open project: ' + e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };


  // Handler for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, metadata, projectMetadata, currentFile, dirHandle, fileHandle]);

  // Dirty state tracking - set to true whenever content or metadata changes
  useEffect(() => {
    // We only want to set dirty if we are NOT in the middle of loading
    if (!isLoading && viewState === 'editor') {
      setIsDirty(true);
    }
  }, [content, metadata, projectMetadata]);

  // Reset dirty state when a new file is explicitly loaded or saved
  // This is handled inside handleSave and handleFileSelect/openDirectoryWithHandle

  // Warning for unsaved changes when closing the tab
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Standard way to show confirmation dialog
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Autosave every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        console.log('Autosaving...');
        handleAutoSave();
      }
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [isDirty, content, metadata, projectMetadata, currentFile, dirHandle, fileHandle, mode]);

  const handleAutoSave = async () => {
    // Only autosave if we have a place to save to without prompting
    const hasHandle = mode === 'researcher' ? !!dirHandle : !!fileHandle;
    if (hasHandle) {
      await handleSave(true); // pass true to indicate it's an internal/silent save
    }
  };

  // Parsing logic
  const parseFileContent = (text, filename) => {
    if (filename.endsWith('.bib') || filename.endsWith('.json') || filename.endsWith('.txt')) {
      setContent(text);
      setMetadata({}); // clear metadata for these files
      return;
    }

    try {
      if (text.startsWith('---')) {
        const parts = text.split('---');
        if (parts.length >= 3) {
          const metaConfig = yaml.load(parts[1]);
          const body = parts.slice(2).join('---').trim();
          setMetadata(metaConfig || {});
          setContent(body);
          return;
        }
      }
      setContent(text);
      setMetadata({});
    } catch (e) {
      console.error('Error parsing frontmatter', e);
      setContent(text);
    }
  };

  const stringifyFileContent = () => {
    if (currentFile.kind !== 'md') return content;

    const metaString = Object.keys(metadata).length > 0 ? yaml.dump(metadata) : '';
    return metaString
      ? `---\n${metaString}---\n\n${content}`
      : content;
  };

  const openDirectoryWithHandle = async (dir) => {
    if (!dir) return;

    let loadedMeta = { name: dir.name, mode: 'researcher' };

    // Try to load metadata first
    try {
      const h = await dir.getFileHandle('project_metadata.json');
      const f = await h.getFile();
      const d = JSON.parse(await f.text());
      loadedMeta = d;
      setProjectMetadata(d);

      // RESTORE MODE FROM METADATA
      if (d.mode) {
        setMode(d.mode);
      }
    } catch (e) {
      setProjectMetadata(loadedMeta);
    }

    // Look for default file based on mode
    let mdFile = null;
    let mdFileName = '';

    try {
      // Strategy based on mode
      const mode = loadedMeta.mode || 'researcher';

      if (mode === 'researcher') {
        mdFile = await dir.getFileHandle('main.md');
        mdFileName = 'main.md';
      } else if (mode === 'journalist') {
        mdFile = await dir.getFileHandle('notes.md');
        mdFileName = 'notes.md';
      } else if (mode === 'engineer') {
        mdFile = await dir.getFileHandle('report.md');
        mdFileName = 'report.md';
      } else if (mode === 'scriptwriter') {
        mdFile = await dir.getFileHandle('script.md');
        mdFileName = 'script.md';
      } else if (mode === 'scholar') {
        // Deep search for todo.md in 'me' folder
        try {
          const meDir = await dir.getDirectoryHandle('me');
          mdFile = await meDir.getFileHandle('todo.md');
          mdFileName = 'me/todo.md';
        } catch {
          // Fallback
        }
      }

      // Universal fallback: check main.md explicitly if mode logic failed
      if (!mdFile) {
        mdFile = await dir.getFileHandle('main.md');
        mdFileName = 'main.md';
      }
    } catch (e) {
      // specific file not found, fall back to search
    }

    if (!mdFile) {
      // Find ANY .md file in root
      for await (const entry of dir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          mdFile = entry;
          mdFileName = entry.name;
          break;
        }
      }
    }

    if (mdFile) {
      const contentObj = await readFile(mdFile);
      setFileHandle(mdFile);
      parseFileContent(contentObj.text, mdFile.name);
      setCurrentFile({ name: mdFile.name, kind: 'md', handle: mdFile });
    } else {
      setContent('');
      setMetadata({});
      setCurrentFile({ name: 'Untitled', kind: 'md', handle: null });
    }
    // Reset dirty state after loading
    setTimeout(() => setIsDirty(false), 100);
  };

  const handleOpen = async () => {
    // AUTOSAVE BEFORE SWITCHING
    if (isDirty) await handleSave();

    setIsLoading(true);
    try {
      const dir = await window.showDirectoryPicker({
        id: 'feder-projects',
        mode: 'readwrite'
      });
      setDirHandle(dir);

      // We don't know the mode yet. setViewState('editor') is fine.
      setViewState('editor');

      // Helper to peek at mode before full open
      let detectedMode = 'researcher';
      try {
        const h = await dir.getFileHandle('project_metadata.json');
        const f = await h.getFile();
        const d = JSON.parse(await f.text());
        if (d.mode) detectedMode = d.mode;
      } catch (e) {
        // No metadata, assume researcher default
      }

      setMode(detectedMode);

      await saveRecentProject(dir, dir.name, detectedMode);
      await openDirectoryWithHandle(dir);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Open failed:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (isSilent = false) => {
    if (currentFile.kind === 'image') return; // Cannot save image changes yet

    const fullContent = stringifyFileContent();

    try {
      if (mode === 'researcher') {
        if (dirHandle) {
          // Save project metadata first
          await writeFileInDir(dirHandle, 'project_metadata.json', JSON.stringify(projectMetadata, null, 2));

          if (currentFile.handle) {
            await saveFile(fullContent, currentFile.handle);
          } else {
            // Fallback / New File in Project
            const name = currentFile.name || 'main.md';
            const handle = await writeFileInDir(dirHandle, name, fullContent);
            setFileHandle(handle);
            setCurrentFile(prev => ({ ...prev, handle }));

            await saveRecentProject(dirHandle, projectMetadata.name, mode);
          }
          setIsDirty(false);
        } else if (!isSilent) {
          // Saving a NEW Research Project - only if NOT silent
          const dir = await window.showDirectoryPicker({
            id: 'feder-projects',
            mode: 'readwrite'
          });

          const safeTitle = projectMetadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

          await writeFileInDir(dir, 'project_metadata.json', JSON.stringify({ name: projectMetadata.name, mode: 'researcher' }, null, 2));

          const mainFileName = `main.md`;

          const mdHandle = await writeFileInDir(dir, mainFileName, fullContent);
          await createSubDir(dir, 'figures');
          await writeFileInDir(dir, 'references.bib', '');

          setDirHandle(dir);
          setFileHandle(mdHandle);
          setCurrentFile({ name: mainFileName, kind: 'md', handle: mdHandle });
          setIsDirty(false);
        }
      } else {
        // Individual file mode
        if (fileHandle) {
          await saveFile(fullContent);
          setIsDirty(false);
        } else if (!isSilent) {
          const success = await saveFileAs(fullContent);
          if (success) setIsDirty(false);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Save failed', err);
        if (!isSilent) alert('Save failed: ' + err.message);
      }
    }
  };

  const handleNew = async () => {
    // AUTOSAVE BEFORE SWITCHING
    if (isDirty) await handleSave();

    // If called from Editor, acts as "Clear/Close Project" or "New Buffer"
    // User asked: "open or new document or continue... if new... create a subfolder"
    // This handleNew is for the button in the Layout.
    // If we are in welcome screen, we use createProject.
    // If we are in editor, maybe we want to go back to welcome screen?
    setIsDirty(false);
  };

  const goToWelcome = async () => {
    if (isDirty) await handleSave();
    setViewState('welcome');
    setDirHandle(null);
    setFileHandle(null);
    setContent('');
    setMetadata({});
    setIsDirty(false);
  };

  const removeRecentProject = async (projToRemove) => {
    const updated = recentProjects.filter(p => p.name !== projToRemove.name);
    setRecentProjects(updated);
    await saveRecentList(updated);
  };

  const createProject = async (name, newMode, useTemplate = true) => {
    // AUTOSAVE BEFORE SWITCHING
    if (isDirty) await handleSave();

    setIsLoading(true);
    try {
      // All modes now use folder-based structure
      // 1. Select Folder
      const parentDir = await window.showDirectoryPicker({
        id: 'feder-projects-root',
        mode: 'readwrite'
      });

      // 2. Create Subfolder
      const safeName = name.trim() || 'Untitled Project';
      const projectDir = await parentDir.getDirectoryHandle(safeName, { create: true });

      setMode(newMode);
      setDirHandle(projectDir);

      await saveRecentProject(projectDir, safeName, newMode);

      // 3. Initialize Files
      const metadata = { name: safeName, mode: newMode };
      await writeFileInDir(projectDir, 'project_metadata.json', JSON.stringify(metadata, null, 2));

      let mainFileHandle = null;
      let mainFileName = '';

      if (useTemplate) {
        switch (newMode) {
          case 'journalist':
            await createSubDir(projectDir, 'figures');
            const cat1 = await createSubDir(projectDir, 'Category 1');
            const cat2 = await createSubDir(projectDir, 'Category 2');

            const journalBoilerplate = (title, author, profession) => `---\ntitle: ${title}\nsubtitle: Subtitle...\nauthor: ${author || 'Author Name'}\nprofession: ${profession || 'Profession'}\nemail: ${settings.email || ''}\nphone: ${settings.phone || ''}\ndate: ${new Date().toISOString().split('T')[0]}\n---\n\n# ${title}\n\nContent...`;

            await writeFileInDir(cat1, 'pressNote1.md', journalBoilerplate('Press Note 1', settings.name, settings.profession));
            await writeFileInDir(cat1, 'pressNote2.md', journalBoilerplate('Press Note 2', settings.name, settings.profession));
            await writeFileInDir(cat2, 'pressNote1.md', journalBoilerplate('Press Note 1', settings.name, settings.profession));
            await writeFileInDir(cat2, 'pressNote2.md', journalBoilerplate('Press Note 2', settings.name, settings.profession));

            const notesHandle = await writeFileInDir(projectDir, 'notes.md', `# Notes: ${safeName}\n\nKey points...`);
            mainFileHandle = notesHandle; // Open notes.md by default
            mainFileName = 'notes.md';
            break;

          case 'engineer':
            await createSubDir(projectDir, 'figures');
            const engBoilerplate = `---\ntitle: ${safeName}\nclient: Placeholder Client\nprojectId: ENG-${new Date().getFullYear()}-001\ndate: ${new Date().toISOString().split('T')[0]}\nrevision: Rev 0\nauthors:\n  - name: Engineer Name\n    affiliation: Structural Department\n---\n\n# Engineer's Report: ${safeName}\n\n## Summary\n\nThis report presents calculation results...`;
            const reportHandle = await writeFileInDir(projectDir, 'report.md', engBoilerplate);
            mainFileHandle = reportHandle;
            mainFileName = 'report.md';
            break;

          case 'scholar':
            const course1Dir = await createSubDir(projectDir, 'course 1');
            await writeFileInDir(course1Dir, 'lecture1.md', `# Lecture 1\n\nNotes...`);

            const course2Dir = await createSubDir(projectDir, 'course 2');
            await writeFileInDir(course2Dir, 'lecture2.md', `# Lecture 2\n\nNotes...`); // Fixed file name from lecture1.md to lecture2.md based on context

            const meDir = await createSubDir(projectDir, 'me');
            const todoHandle = await writeFileInDir(meDir, 'todo.md', `# To Do\n\n- [ ] Task 1`);

            // For nested files, we might need a way to open them easily. 
            // For now, let's open todo.md or just the root? 
            // The prompt says "create these folders". It doesn't specify which to open, but logic suggests opening one.
            // Let's open todo.md for now as it's likely the central hub.
            mainFileHandle = todoHandle; // This might be tricky if the file handle in state expects direct child? 
            // setFileHandle checks if it can read? The state just holds the handle.
            // However, currentFile.name usually expects relative path? 
            // createProject logic sets currentFile usually as simple name.
            // Let's stick to a simple default if nested is complex, but the file system hook should handle deep handles.
            mainFileName = 'me/todo.md';
            break;

          case 'scriptwriter':
            const scriptBoilerplate = `---\ntitle: ${safeName}\nauthor: Writer Name\nbasedOn: \ndate: ${new Date().toLocaleDateString()}\ncontact: |\n  Agent Name\n  Agency Name\n  Phone / Email\n---\n\n# PRELUDE\n[ACTION, LOCATION, ATMOSPHERE]\n\n**CHARACTER NAME**\n(Parenthetical)\nDialogue\n\n**CHARACTER NAME 2**\nDialogue \n\n---\n\n# SCENE 1\n\n...\n\n---\n\n# SCENE 2\n...\n\n---\n\n# THE END`;
            const scriptHandle = await writeFileInDir(projectDir, 'script.md', scriptBoilerplate);
            mainFileHandle = scriptHandle;
            mainFileName = 'script.md';
            break;

          case 'researcher':
          default:
            const mainHandle = await writeFileInDir(projectDir, 'main.md', `# ${safeName}\n\nStart writing...`);
            await createSubDir(projectDir, 'figures');
            await writeFileInDir(projectDir, 'references.bib', '');
            mainFileHandle = mainHandle;
            mainFileName = 'main.md';
            break;
        }

        if (mainFileHandle) {
          const fileData = await readFile(mainFileHandle);
          setFileHandle(mainFileHandle);
          parseFileContent(fileData.text, mainFileName);
          setCurrentFile({ name: mainFileName, kind: 'md', handle: mainFileHandle });
        } else {
          // Fallback if no file created (scolar might be tricky if I don't set one)
          await openDirectoryWithHandle(projectDir);
        }

      } else {
        // Empty project
        setProjectMetadata(metadata);
        setContent('');
        setMetadata({});
        setCurrentFile({ name: 'Untitled', kind: 'md', handle: null });
      }

      // 4. Open
      setViewState('editor');
      setTimeout(() => setIsDirty(false), 100);

    } catch (e) {
      if (e.name !== 'AbortError') console.error('Create Project Failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    const latex = generateLatex(content, metadata);
    const name = (currentFile.name || 'export').replace(/\.md$/, '') + '.tex';
    if (mode === 'researcher' && dirHandle) {
      try {
        const handle = await dirHandle.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        await writable.write(latex);
        await writable.close();
        alert('Exported to ' + name);
        setRefreshTrigger(prev => prev + 1);
      } catch (e) {
        console.error(e);
        alert('Failed to export');
      }
    } else {
      await saveFileAs(latex);
    }
  };

  const handleImport = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'LaTeX Files',
          accept: { 'text/x-tex': ['.tex'] },
        }],
      });
      const file = await handle.getFile();
      const text = await file.text();

      // Simple Import Logic (very basic conversion)
      let md = text;
      md = md.replace(/\\section\{(.*?)\}/g, '# $1');
      md = md.replace(/\\subsection\{(.*?)\}/g, '## $1');
      md = md.replace(/\\subsubsection\{(.*?)\}/g, '### $1');
      md = md.replace(/\\textbf\{(.*?)\}/g, '**$1**');
      md = md.replace(/\\textit\{(.*?)\}/g, '*$1*');
      md = md.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, '> $1');
      md = md.replace(/\\begin\{document\}|\\end\{document\}|\\maketitle|\\tableofcontents/g, '');
      md = md.replace(/\\documentclass\{.*?\}|\\usepackage\{.*?\}/g, '');
      md = md.replace(/\\title\{(.*?)\}/g, '# $1');
      md = md.replace(/\\author\{(.*?)\}/g, '*Author: $1*');

      const importedName = 'main_imported.md';
      if (dirHandle) {
        const newHandle = await writeFileInDir(dirHandle, importedName, md);
        setRefreshTrigger(prev => prev + 1);
        handleFileSelect(newHandle);
        alert('Imported as main_imported.md');
      } else {
        setContent(md);
        setMetadata({});
        setCurrentFile({ name: importedName, kind: 'md', handle: null });
      }
      setTimeout(() => setIsDirty(false), 100);

    } catch (e) {
      if (e.name !== 'AbortError') console.error('Import failed', e);
    }
  };

  // Helper for FileExplorer selection
  const handleFileSelect = async (handle) => {
    // AUTOSAVE BEFORE SWITCHING
    if (isDirty) await handleSave();

    // LOADING REMOVED as requested
    try {
      if (handle.kind === 'file') {
        const name = handle.name;
        if (name.endsWith('.md') || name.endsWith('.bib') || name.endsWith('.txt') || name.endsWith('.json')) {
          const data = await readFile(handle);
          setFileHandle(handle);

          let kind = 'md';
          if (name.endsWith('.bib')) kind = 'bib';
          if (name.endsWith('.json')) kind = 'json';
          if (name.endsWith('.txt')) kind = 'txt';

          parseFileContent(data.text, name);
          setCurrentFile({ name, kind, handle });
        } else if (name.match(/\.(png|jpg|jpeg|svg|gif)$/i)) {
          // Image visualization
          const file = await handle.getFile();
          const src = URL.createObjectURL(file);
          setCurrentFile({ name, kind: 'image', handle, src });
          // We don't change content/metadata, just the view.
        }
      }
      setTimeout(() => setIsDirty(false), 100);
    } finally {
      // No loading state to turn off
    }
  };

  const onUploadImage = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Images',
          accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.gif'] }
        }]
      });
      const file = await handle.getFile();

      let src = '';
      if (mode === 'researcher' && dirHandle) {
        let figuresDir;
        try {
          figuresDir = await dirHandle.getDirectoryHandle('figures', { create: true });
        } catch (e) {
          figuresDir = dirHandle;
        }
        await writeFileInDir(figuresDir, file.name, file);
        src = `figures/${file.name}`;
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise(resolve => reader.onload = resolve);
        src = reader.result;
      }
      return { alt: file.name, src };
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
      return null;
    }
  };

  const handleRename = async (handle, newName) => {
    try {
      if (handle.kind === 'file') {
        if (handle.move) {
          await handle.move(newName);
          // If the renamed file is the one currently open, update state
          if (currentFile.handle && currentFile.handle.name === handle.name) {
            setCurrentFile(prev => ({ ...prev, name: newName }));
          }
        } else {
          alert('Renaming not supported in this browser version (requires handle.move)');
          return;
        }
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error('Rename failed', e);
    }
  };

  const getDefaultMetadata = (currentMode) => {
    if (currentMode === 'engineer') {
      return {
        authors: [{
          name: settings.name || '',
          affiliation: settings.affiliation || '',
          company: settings.company || '',
          email: settings.email || '',
          phone: settings.phone || ''
        }],
        showToC: true,
        client: '',
        projectNumber: '',
        revision: 'Rev 0',
        date: new Date().toISOString().split('T')[0]
      };
    } else if (currentMode === 'researcher' || currentMode === 'scholar') {
      return {
        authors: [{
          name: settings.name || '',
          affiliation: settings.affiliation || '',
          company: settings.company || '',
          email: settings.email || '',
          phone: settings.phone || ''
        }]
      };
    } else if (currentMode === 'journalist') {
      return {
        author: settings.name || '',
        profession: settings.profession || '',
        email: settings.email || '',
        phone: settings.phone || '',
        date: new Date().toISOString().split('T')[0]
      };
    } else if (currentMode === 'scriptwriter') {
      return {
        author: settings.name || '',
        profession: settings.profession || '',
        email: settings.email || '',
        phone: settings.phone || '',
        basedOn: '',
        date: new Date().toISOString().split('T')[0]
      };
    }
    return {};
  };

  const handleCreateFile = async () => {
    if (!dirHandle) return;
    const name = prompt('File name:', 'newfile.md');
    if (name) {
      let initialContent = '';
      if (name.endsWith('.md')) {
        const defaults = getDefaultMetadata(mode);
        if (Object.keys(defaults).length > 0) {
          initialContent = `---\n${yaml.dump(defaults)}---\n\n# ${name.replace('.md', '')}\n\n`;
        }
      }
      await writeFileInDir(dirHandle, name, initialContent);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleCreateFolder = async () => {
    if (!dirHandle) return;
    const name = prompt('Folder name:', 'new-folder');
    if (name) {
      await createSubDir(dirHandle, name);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDelete = async (handle) => {
    try {
      if (handle.kind === 'file') {
        // For files, we use remove() if supported
        if (handle.remove) {
          await handle.remove();
        } else if (dirHandle) {
          await dirHandle.removeEntry(handle.name);
        }
      } else if (handle.kind === 'directory') {
        // For directories, use removeEntry with recursive: true
        if (dirHandle) {
          await dirHandle.removeEntry(handle.name, { recursive: true });
        }
      }

      // If deleted file was open, clear editor
      if (currentFile.handle && currentFile.handle.name === handle.name) {
        setContent('');
        setMetadata({});
        setCurrentFile({ name: '', kind: 'md', handle: null });
        setFileHandle(null);
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error('Delete failed', e);
      alert('Failed to delete: ' + e.message);
    }
  };

  // Render Logic
  const renderLeft = () => (
    <FileExplorer
      dirHandle={dirHandle}
      onFileSelect={handleFileSelect}
      currentFilename={currentFile.name}
      mode={mode}
      onOpenProject={handleOpen}
      onRename={handleRename}
      onDelete={handleDelete}
      onCreateFile={handleCreateFile}
      onCreateFolder={handleCreateFolder}
      refreshTrigger={refreshTrigger}
    />
  );

  const renderCenter = () => (
    <div className="center-panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="controls-bar" style={{ display: 'none' }}>
        {/* Controls moved to Layout header */}
      </div>

      {currentFile.kind === 'md' && showMetadata && (
        <MetadataForm mode={mode} metadata={metadata} onChange={setMetadata} />
      )}

      {currentFile.kind === 'image' ? (
        <ImageViewer src={currentFile.src} alt={currentFile.name} />
      ) : (
        <div className="editor-container" style={{ flex: 1, overflow: 'hidden' }}>
          <Editor
            value={content}
            onChange={setContent}
            mode={mode}
            onUploadImage={onUploadImage}
          />
        </div>
      )}
    </div>
  );

  const renderRight = () => (
    <Preview content={content} metadata={metadata} dirHandle={dirHandle} mode={mode} />
  );

  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          Loading...
        </div>
      )}

      {viewState === 'welcome' ? (
        <WelcomeScreen
          onNewProject={createProject}
          onOpenProject={() => {
            setMode('researcher');
            handleOpen();
          }}
          recentProjects={recentProjects}
          onOpenRecent={handleOpenRecent}
          isDark={isDark}
          settings={settings}
          onUpdateSettings={async (newSettings) => {
            setSettings(newSettings);
            await saveSettings(newSettings);
          }}
          onRemoveRecent={removeRecentProject}
        />
      ) : (
        <Layout
          isDark={isDark}
          toggleTheme={() => setIsDark(!isDark)}
          onOpen={handleOpen}
          onSave={handleSave}
          onNew={handleNew}
          onExport={handleExport}
          onImport={handleImport}
          filename={currentFile.name}
          projectName={projectMetadata.name}
          mode={mode}
          onProjectNameChange={(name) => setProjectMetadata({ ...projectMetadata, name })}
          showExplorer={showExplorer}
          toggleExplorer={() => setShowExplorer(!showExplorer)}
          onLogoClick={goToWelcome}
        >
          <div className="workspace-container" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {isLoading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                Loading...
              </div>
            )}
            {/* Helper to decide layout */}
            {(() => {
              const isMD = currentFile.kind === 'md';
              const isImage = currentFile.kind === 'image';
              const isTextLike = ['bib', 'json', 'txt'].includes(currentFile.kind);

              if (isTextLike) {
                // "It's just the center and right panels that should switch to text editor. But not disappearing the left panel."
                return (
                  <ResizablePanels
                    left={showExplorer ? renderLeft() : null}
                    center={renderCenter()}
                    right={null}
                  />
                );
              }

              if (isImage) {
                // "just two panels (left panel with explorer and right-center panel with the image)"
                return (
                  <ResizablePanels
                    left={showExplorer ? renderLeft() : null}
                    center={renderCenter()}
                    right={null}
                  />
                );
              }

              // Case for .md or default
              const isProjectMode = ['researcher', 'engineer', 'scholar', 'scriptwriter', 'journalist'].includes(mode);

              if (isProjectMode && dirHandle) {
                return (
                  <ResizablePanels
                    left={showExplorer ? renderLeft() : null}
                    center={renderCenter()}
                    right={isMD ? renderRight() : null}
                  />
                );
              } else {
                // Simple layout for Journalist / No Project
                return (
                  <div style={{ flex: 1, display: 'flex' }}>
                    {showExplorer && (
                      <div style={{ width: '250px', borderRight: '1px solid var(--border-color)' }}>
                        {renderLeft()}
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {renderCenter()}
                    </div>
                    {isMD && (
                      <div style={{ width: '50%', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                        {renderRight()}
                      </div>
                    )}
                  </div>
                );
              }
            })()}
          </div>
        </Layout>
      )}
    </>
  );
}

export default App;
