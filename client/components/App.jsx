import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useNotes } from '../hooks/useNotes.js';
import LoginScreen from './LoginScreen.jsx';
import OnboardingScreen from './OnboardingScreen.jsx';
import UnlockScreen from './UnlockScreen.jsx';
import TitleBar from './TitleBar.jsx';
import ActivityBar from './ActivityBar.jsx';
import Sidebar from './Sidebar.jsx';
import EditorTabs from './EditorTabs.jsx';
import Editor from './Editor.jsx';
import StatusBar from './StatusBar.jsx';
import { importMasterKey } from '../utils/crypto.js';

export default function App() {
  const auth = useAuth();
  const [masterKey, setMasterKey] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activePanel, setActivePanel] = useState('explorer');
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const notes = useNotes(masterKey);

  // Load notes when master key is available
  useEffect(() => {
    if (masterKey) notes.loadNotes();
  }, [masterKey]);

  const handleUnlock = useCallback((key) => {
    setMasterKey(key);
  }, []);

  const handleLogout = useCallback(async () => {
    await auth.logout();
    setMasterKey(null);
    setOpenTabs([]);
    setActiveTabId(null);
  }, [auth]);

  const handleKeysCreated = useCallback(() => {
    auth.setHasEncryptionKeys(true);
    auth.refresh();
  }, [auth]);

  const handleOpenNote = useCallback(async (noteId) => {
    await notes.openNote(noteId);
    const note = notes.notes.find(n => n.id === noteId);
    if (note && !openTabs.find(t => t.id === noteId)) {
      setOpenTabs(prev => [...prev, { id: noteId, title: note.title }]);
    }
    setActiveTabId(noteId);
  }, [notes, openTabs]);

  const handleCloseTab = useCallback((tabId) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        const lastTab = next[next.length - 1];
        setActiveTabId(lastTab?.id || null);
        if (lastTab) notes.openNote(lastTab.id);
        else notes.setActiveNote(null);
      }
      return next;
    });
  }, [activeTabId, notes]);

  const handleCreateNote = useCallback(async () => {
    const id = await notes.createNote();
    if (id) {
      setOpenTabs(prev => [...prev, { id, title: 'Untitled' }]);
      setActiveTabId(id);
    }
  }, [notes]);

  const handleSave = useCallback(async (title, content) => {
    if (!notes.activeNote) return;
    const id = await notes.saveNote(notes.activeNote.id, title, content);
    setOpenTabs(prev => prev.map(t => t.id === id ? { ...t, title } : t));
  }, [notes]);

  // Close the currently active tab
  const handleCloseActiveTab = useCallback(() => {
    if (activeTabId) handleCloseTab(activeTabId);
  }, [activeTabId, handleCloseTab]);

  // Menu bar actions
  const menuActions = useMemo(() => ({
    onCreateNote: handleCreateNote,
    onSave: () => {
      if (notes.activeNote) {
        // Trigger save via keyboard event so the editor handles it
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 's', ctrlKey: true, bubbles: true,
        }));
      }
    },
    onCloseTab: handleCloseActiveTab,
    onUndo: () => document.execCommand('undo'),
    onRedo: () => document.execCommand('redo'),
    onCut: () => document.execCommand('cut'),
    onCopy: () => document.execCommand('copy'),
    onPaste: () => {
      navigator.clipboard.readText().then((text) => {
        document.execCommand('insertText', false, text);
      }).catch(() => document.execCommand('paste'));
    },
    onShowExplorer: () => { setActivePanel('explorer'); setSidebarVisible(true); },
    onShowSearch: () => { setActivePanel('search'); setSidebarVisible(true); },
    onShowSecurity: () => { setActivePanel('security'); setSidebarVisible(true); },
    onToggleSidebar: () => setSidebarVisible((v) => !v),
    onShowShortcuts: () => setShowShortcutsModal(true),
    onShowAbout: () => setShowAboutModal(true),
  }), [handleCreateNote, handleCloseActiveTab, notes.activeNote]);

  // Render auth states
  if (auth.loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--text-secondary)',
      }}>
        Loading...
      </div>
    );
  }

  if (!auth.user) {
    return (
      <LoginScreen
        onDevLogin={auth.devLogin}
        onDemoLogin={auth.demoLogin}
        onDemoFresh={auth.demoLoginFresh}
        demoMode={auth.demoMode}
        error={auth.error}
      />
    );
  }

  if (!auth.hasEncryptionKeys) {
    return <OnboardingScreen user={auth.user} onComplete={handleKeysCreated} />;
  }

  if (!masterKey) {
    return <UnlockScreen user={auth.user} onUnlock={handleUnlock} onLogout={handleLogout} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar user={auth.user} onLogout={handleLogout} actions={menuActions} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ActivityBar
          activePanel={activePanel}
          onPanelChange={(panel) => {
            if (panel === activePanel) setSidebarVisible(!sidebarVisible);
            else { setActivePanel(panel); setSidebarVisible(true); }
          }}
        />
        {sidebarVisible && (
          <Sidebar
            activePanel={activePanel}
            notes={notes.notes}
            activeNoteId={notes.activeNote?.id}
            onOpenNote={handleOpenNote}
            onCreateNote={handleCreateNote}
            onDeleteNote={notes.deleteNote}
            loading={notes.loading}
          />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <EditorTabs
            tabs={openTabs}
            activeTabId={activeTabId}
            onSelectTab={(id) => { setActiveTabId(id); notes.openNote(id); }}
            onCloseTab={handleCloseTab}
          />
          <Editor
            note={notes.activeNote}
            onSave={handleSave}
          />
        </div>
      </div>
      <StatusBar
        user={auth.user}
        noteCount={notes.notes.length}
        activeNote={notes.activeNote}
        encrypted={true}
      />
      {showShortcutsModal && (
        <div style={modalStyles.overlay} onClick={() => setShowShortcutsModal(false)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <span style={modalStyles.title}>Keyboard Shortcuts</span>
              <button style={modalStyles.closeBtn} onClick={() => setShowShortcutsModal(false)}>×</button>
            </div>
            <div style={modalStyles.body}>
              {[
                ['Ctrl+N', 'New Note'],
                ['Ctrl+S', 'Save'],
                ['Ctrl+W', 'Close Tab'],
                ['Ctrl+B', 'Toggle Sidebar'],
                ['Ctrl+Z', 'Undo'],
                ['Ctrl+Shift+Z', 'Redo'],
              ].map(([key, desc]) => (
                <div key={key} style={modalStyles.row}>
                  <kbd style={modalStyles.kbd}>{key}</kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showAboutModal && (
        <div style={modalStyles.overlay} onClick={() => setShowAboutModal(false)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <span style={modalStyles.title}>About</span>
              <button style={modalStyles.closeBtn} onClick={() => setShowAboutModal(false)}>×</button>
            </div>
            <div style={{ ...modalStyles.body, textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text-active)' }}>Encrypted Notes</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>MDX Editor with E2E Encryption</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    background: 'var(--bg-modal)',
    border: '1px solid var(--border-primary)',
    borderRadius: 6,
    boxShadow: 'var(--shadow-widget)',
    minWidth: 320,
    maxWidth: 480,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border-primary)',
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-active)',
  },
  closeBtn: {
    fontSize: 18,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    lineHeight: 1,
    padding: '0 4px',
  },
  body: {
    padding: 16,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: 12,
    color: 'var(--text-primary)',
  },
  kbd: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    padding: '2px 8px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 3,
    color: 'var(--text-secondary)',
  },
};
