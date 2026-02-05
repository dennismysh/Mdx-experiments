import React, { useState } from 'react';
import {
  VscNewFile,
  VscRefresh,
  VscChevronRight,
  VscChevronDown,
  VscFile,
  VscTrash,
  VscMarkdown,
  VscSearch,
  VscLock,
  VscShield,
} from 'react-icons/vsc';

function ExplorerPanel({ notes, activeNoteId, onOpenNote, onCreateNote, onDeleteNote, loading }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div style={styles.sectionHeader}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={styles.sectionToggle}
        >
          {expanded ? <VscChevronDown size={16} /> : <VscChevronRight size={16} />}
          <span style={styles.sectionTitle}>NOTES</span>
          <span style={styles.badge}>{notes.length}</span>
        </button>
        <div style={styles.sectionActions}>
          <button onClick={onCreateNote} style={styles.actionBtn} title="New Note">
            <VscNewFile size={16} />
          </button>
          <button onClick={() => {}} style={styles.actionBtn} title="Refresh">
            <VscRefresh size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={styles.fileList}>
          {loading && (
            <div style={styles.emptyMsg}>Loading notes...</div>
          )}
          {!loading && notes.length === 0 && (
            <div style={styles.emptyMsg}>
              No notes yet. Click + to create one.
            </div>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onOpenNote(note.id)}
              style={{
                ...styles.fileItem,
                ...(note.id === activeNoteId ? styles.fileItemActive : {}),
              }}
            >
              <VscMarkdown size={16} color="#519aba" />
              <span style={styles.fileName}>{note.title || 'Untitled'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                style={styles.deleteBtn}
                title="Delete"
              >
                <VscTrash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchPanel() {
  const [query, setQuery] = useState('');
  return (
    <div style={{ padding: '8px 12px' }}>
      <div style={styles.searchBox}>
        <VscSearch size={14} color="var(--text-muted)" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in notes..."
          style={styles.searchInput}
        />
      </div>
      <p style={{ ...styles.emptyMsg, marginTop: 12 }}>
        Search is performed client-side on decrypted content.
      </p>
    </div>
  );
}

function SecurityPanel() {
  return (
    <div style={{ padding: '12px 16px' }}>
      <h4 style={styles.panelTitle}>
        <VscShield size={16} color="var(--accent-success)" />
        <span>Encryption Status</span>
      </h4>
      <div style={styles.securityItem}>
        <VscLock size={14} color="var(--accent-success)" />
        <span>AES-256-GCM at rest</span>
      </div>
      <div style={styles.securityItem}>
        <VscLock size={14} color="var(--accent-success)" />
        <span>PBKDF2 key derivation (600K iter)</span>
      </div>
      <div style={styles.securityItem}>
        <VscLock size={14} color="var(--accent-success)" />
        <span>Client-side encryption</span>
      </div>
      <div style={styles.securityItem}>
        <VscLock size={14} color="var(--accent-success)" />
        <span>TEE-backed key ops</span>
      </div>
      <div style={styles.securityItem}>
        <VscLock size={14} color="var(--accent-success)" />
        <span>Zero-knowledge server</span>
      </div>
    </div>
  );
}

export default function Sidebar({
  activePanel, notes, activeNoteId,
  onOpenNote, onCreateNote, onDeleteNote, loading,
}) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarTitle}>
        {activePanel === 'explorer' ? 'EXPLORER' :
         activePanel === 'search' ? 'SEARCH' : 'SECURITY'}
      </div>
      {activePanel === 'explorer' && (
        <ExplorerPanel
          notes={notes}
          activeNoteId={activeNoteId}
          onOpenNote={onOpenNote}
          onCreateNote={onCreateNote}
          onDeleteNote={onDeleteNote}
          loading={loading}
        />
      )}
      {activePanel === 'search' && <SearchPanel />}
      {activePanel === 'security' && <SecurityPanel />}
    </div>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-primary)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    padding: '10px 20px',
    letterSpacing: '0.8px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px 0 0',
    background: 'var(--bg-tertiary)',
    minHeight: 22,
  },
  sectionToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 4px',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.5px',
    flex: 1,
    textAlign: 'left',
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  badge: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginLeft: 6,
  },
  sectionActions: {
    display: 'flex',
    gap: 2,
  },
  actionBtn: {
    padding: 4,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
  },
  fileList: {
    flex: 1,
    overflowY: 'auto',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px 4px 24px',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--text-primary)',
    position: 'relative',
  },
  fileItemActive: {
    background: 'var(--bg-selection)',
    color: 'var(--text-active)',
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    padding: 2,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    opacity: 0,
    transition: 'opacity var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
  },
  emptyMsg: {
    padding: '12px 24px',
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    borderRadius: 3,
    padding: '4px 8px',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    padding: '2px 0',
  },
  panelTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-active)',
    marginBottom: 16,
  },
  securityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 12,
    color: 'var(--text-secondary)',
    padding: '6px 0',
  },
};
