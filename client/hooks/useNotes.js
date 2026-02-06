import { useState, useCallback } from 'react';
import { notesApi } from '../utils/api.js';
import { encryptNote, decryptNote, decryptText } from '../utils/crypto.js';

export function useNotes(masterKey) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!masterKey) return;
    setLoading(true);
    try {
      const { notes: encrypted } = await notesApi.list();
      const decrypted = await Promise.all(
        encrypted.map(async (n) => {
          try {
            const title = await decryptText(n.titleEncrypted, n.titleIv, masterKey);
            return { ...n, title, decryptionFailed: false };
          } catch {
            return { ...n, title: '[Decryption Failed]', decryptionFailed: true };
          }
        })
      );
      setNotes(decrypted);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  }, [masterKey]);

  const openNote = useCallback(async (noteId) => {
    if (!masterKey) return;
    try {
      const encrypted = await notesApi.get(noteId);
      const { title, content } = await decryptNote(encrypted, masterKey);
      setActiveNote({ id: noteId, title, content, folder: encrypted.folder });
    } catch (err) {
      console.error('Failed to open note:', err);
    }
  }, [masterKey]);

  const saveNote = useCallback(async (noteId, title, content) => {
    if (!masterKey) return;
    const encrypted = await encryptNote(title, content, masterKey);
    if (noteId) {
      await notesApi.update(noteId, encrypted);
    } else {
      const { id } = await notesApi.create(encrypted);
      noteId = id;
    }
    setActiveNote((prev) => prev ? { ...prev, id: noteId, title, content } : null);
    await loadNotes();
    return noteId;
  }, [masterKey, loadNotes]);

  const createNote = useCallback(async () => {
    if (!masterKey) return;
    const title = 'Untitled';
    const content = '# Untitled\n\nStart writing...';
    const encrypted = await encryptNote(title, content, masterKey);
    const { id } = await notesApi.create(encrypted);
    await loadNotes();
    setActiveNote({ id, title, content, folder: '/' });
    return id;
  }, [masterKey, loadNotes]);

  const deleteNote = useCallback(async (noteId) => {
    await notesApi.delete(noteId);
    if (activeNote?.id === noteId) setActiveNote(null);
    await loadNotes();
  }, [activeNote, loadNotes]);

  return {
    notes, activeNote, setActiveNote, loading,
    loadNotes, openNote, saveNote, createNote, deleteNote,
  };
}
