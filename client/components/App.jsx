import React, { useState, useEffect, useCallback } from 'react';
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

  const notes = useNotes(masterKey);

  // Load notes when master key is available
  useEffect(() => {
    if (masterKey) notes.loadNotes();
  }, [masterKey]);

  const handleUnlock = useCallback((key) => {
    setMasterKey(key);
  }, []);

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
    return <LoginScreen onDevLogin={auth.devLogin} error={auth.error} />;
  }

  if (!auth.hasEncryptionKeys) {
    return <OnboardingScreen user={auth.user} onComplete={handleKeysCreated} />;
  }

  if (!masterKey) {
    return <UnlockScreen user={auth.user} onUnlock={handleUnlock} onLogout={auth.logout} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar user={auth.user} onLogout={auth.logout} />
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
    </div>
  );
}
