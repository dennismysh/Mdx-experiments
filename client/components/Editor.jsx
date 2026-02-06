import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VscSplitHorizontal, VscEdit, VscPreview, VscSave } from 'react-icons/vsc';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import MdxPreview from './MdxPreview.jsx';

const SAVE_DEBOUNCE_MS = 1500;

export default function Editor({ note, onSave }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [viewMode, setViewMode] = useState('split'); // 'editor' | 'preview' | 'split'
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [dirty, setDirty] = useState(false);
  const hasNote = !!note;

  // Sync note to editor
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setDirty(false);

      if (viewRef.current) {
        const currentContent = viewRef.current.state.doc.toString();
        if (currentContent !== (note.content || '')) {
          viewRef.current.dispatch({
            changes: { from: 0, to: currentContent.length, insert: note.content || '' },
          });
        }
      }
    }
  }, [note?.id]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString();
        setContent(newContent);
        setDirty(true);
      }
    });

    const state = EditorState.create({
      doc: note?.content || '',
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        markdown(),
        oneDark,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        updateListener,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: 'var(--font-size-editor)',
            fontFamily: 'var(--font-mono)',
          },
          '.cm-content': {
            padding: '16px 0',
            lineHeight: 'var(--line-height-editor)',
            minHeight: '100%',
            touchAction: 'manipulation',
          },
          '.cm-scroller': {
            overflow: 'auto',
            touchAction: 'manipulation',
          },
          '.cm-gutters': {
            background: 'var(--bg-editor)',
            border: 'none',
            color: 'var(--editor-line-number)',
          },
          '.cm-activeLineGutter': {
            color: 'var(--editor-line-number-active)',
            background: 'transparent',
          },
          '.cm-cursor': {
            borderLeftColor: 'var(--editor-cursor)',
          },
        }),
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [hasNote]);

  // Auto-save debounce
  useEffect(() => {
    if (!dirty || !note) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSave(title, content);
      setDirty(false);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimerRef.current);
  }, [content, title, dirty, note, onSave]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (!note) return;
    clearTimeout(saveTimerRef.current);
    onSave(title, content);
    setDirty(false);
  }, [note, title, content, onSave]);

  // Ctrl+S handler
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleManualSave]);

  if (!note) {
    return (
      <div style={styles.welcome}>
        <div style={styles.welcomeContent}>
          <h2 style={styles.welcomeTitle}>Encrypted Notes</h2>
          <p style={styles.welcomeText}>Open a note from the sidebar or create a new one.</p>
          <div style={styles.shortcuts}>
            <div style={styles.shortcut}>
              <kbd style={styles.kbd}>Ctrl+S</kbd>
              <span>Save note</span>
            </div>
            <div style={styles.shortcut}>
              <kbd style={styles.kbd}>Ctrl+N</kbd>
              <span>New note</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            style={styles.titleInput}
            placeholder="Note title..."
          />
          {dirty && <span style={styles.dirtyIndicator}>Modified</span>}
        </div>
        <div style={styles.toolbarRight}>
          <button onClick={handleManualSave} style={styles.toolBtn} title="Save (Ctrl+S)">
            <VscSave size={16} />
          </button>
          <div style={styles.separator} />
          <button
            onClick={() => setViewMode('editor')}
            style={{ ...styles.toolBtn, ...(viewMode === 'editor' ? styles.toolBtnActive : {}) }}
            title="Editor only"
          >
            <VscEdit size={16} />
          </button>
          <button
            onClick={() => setViewMode('split')}
            style={{ ...styles.toolBtn, ...(viewMode === 'split' ? styles.toolBtnActive : {}) }}
            title="Split view"
          >
            <VscSplitHorizontal size={16} />
          </button>
          <button
            onClick={() => setViewMode('preview')}
            style={{ ...styles.toolBtn, ...(viewMode === 'preview' ? styles.toolBtnActive : {}) }}
            title="Preview only"
          >
            <VscPreview size={16} />
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={styles.editorArea}>
        <div
          ref={editorRef}
          onClick={() => viewRef.current?.focus()}
          style={{
            ...styles.editorPane,
            width: viewMode === 'split' ? '50%' : '100%',
            borderRight: viewMode === 'split' ? '1px solid var(--border-primary)' : 'none',
            display: viewMode === 'preview' ? 'none' : 'block',
          }}
        />
        <div style={{
          ...styles.previewPane,
          width: viewMode === 'split' ? '50%' : '100%',
          display: viewMode === 'editor' ? 'none' : 'block',
        }}>
          <MdxPreview content={content} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg-editor)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 12px',
    borderBottom: '1px solid var(--border-primary)',
    background: 'var(--bg-secondary)',
    flexShrink: 0,
    minHeight: 34,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  titleInput: {
    background: 'none',
    border: 'none',
    color: 'var(--text-active)',
    fontSize: 13,
    fontWeight: 500,
    padding: '2px 4px',
    flex: 1,
    maxWidth: 400,
    outline: 'none',
  },
  dirtyIndicator: {
    fontSize: 10,
    color: 'var(--accent-warning)',
    padding: '1px 6px',
    background: 'rgba(204, 167, 0, 0.15)',
    borderRadius: 3,
  },
  toolBtn: {
    padding: 6,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
  },
  toolBtnActive: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-active)',
  },
  separator: {
    width: 1,
    height: 16,
    background: 'var(--border-primary)',
    margin: '0 4px',
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  editorPane: {
    height: '100%',
    overflow: 'hidden',
  },
  previewPane: {
    height: '100%',
    overflow: 'auto',
    padding: '24px 32px',
    background: 'var(--bg-editor)',
  },
  welcome: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-editor)',
  },
  welcomeContent: {
    textAlign: 'center',
    maxWidth: 400,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 300,
    color: 'var(--text-muted)',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: 'var(--text-muted)',
    marginBottom: 32,
  },
  shortcuts: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  shortcut: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    color: 'var(--text-muted)',
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
