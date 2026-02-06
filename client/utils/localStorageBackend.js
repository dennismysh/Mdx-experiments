/**
 * localStorage-based backend for GitHub Pages demo mode.
 * Provides the same API shape as the server endpoints but stores
 * everything in the browser's localStorage. Encryption still happens
 * client-side with real AES-256-GCM — the only difference is storage location.
 */

const STORAGE_PREFIX = 'enc-notes:';
const k = (name) => `${STORAGE_PREFIX}${name}`;

function getJSON(name, fallback = null) {
  try {
    const raw = localStorage.getItem(k(name));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJSON(name, value) {
  localStorage.setItem(k(name), JSON.stringify(value));
}

function uuid() {
  return crypto.randomUUID?.() ||
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

// --- Demo raw master key (for auto-unlock on refresh) ---

export function storeDemoRawKey(base64Key) {
  setJSON('demo-raw-master-key', base64Key);
}

export function getDemoRawKey() {
  return getJSON('demo-raw-master-key', null);
}

function clearDemoRawKey() {
  localStorage.removeItem(k('demo-raw-master-key'));
}

// --- Demo user ---

const DEMO_USER = {
  id: 'demo-local-user',
  google_id: 'demo',
  email: 'demo@local',
  display_name: 'Demo User',
  avatar_url: '',
};

// --- Auth API (local) ---

export const localAuthApi = {
  me: async () => {
    const loggedIn = getJSON('logged-in', false);
    if (!loggedIn) return { user: null };
    const hasKey = !!getJSON('master-key-data');
    return { user: DEMO_USER, hasEncryptionKeys: hasKey };
  },

  devLogin: async () => {
    setJSON('logged-in', true);
    const hasKey = !!getJSON('master-key-data');
    return { user: DEMO_USER, hasEncryptionKeys: hasKey };
  },

  demoLogin: async () => {
    setJSON('logged-in', true);
    const hasKey = !!getJSON('master-key-data');
    return { user: DEMO_USER, hasEncryptionKeys: hasKey };
  },

  logout: async () => {
    setJSON('logged-in', false);
    clearDemoRawKey();
    return { ok: true };
  },
};

// --- Keys API (local) ---

export const localKeysApi = {
  storeMasterKey: async (data) => {
    setJSON('master-key-data', data);
    return { ok: true };
  },

  getMasterKey: async () => {
    const data = getJSON('master-key-data');
    if (!data) return { hasKey: false };
    return { hasKey: true, ...data };
  },

  verifyRecovery: async (recoveryKey) => {
    return { valid: true };
  },

  reset: async () => {
    localStorage.removeItem(k('master-key-data'));
    localStorage.removeItem(k('notes'));
    clearDemoRawKey();
    return { ok: true };
  },
};

// --- Notes API (local) ---

function getAllNotes() {
  return getJSON('notes', []);
}

function saveAllNotes(notes) {
  setJSON('notes', notes);
}

export const localNotesApi = {
  list: async () => {
    const notes = getAllNotes().map(({ contentEncrypted, contentIv, ...rest }) => rest);
    return { notes };
  },

  get: async (id) => {
    const notes = getAllNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) throw new Error('Note not found');
    return note;
  },

  create: async (data) => {
    const notes = getAllNotes();
    const id = uuid();
    const now = new Date().toISOString();
    notes.unshift({
      id,
      ...data,
      folder: data.folder || '/',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
    saveAllNotes(notes);
    return { id, createdAt: now };
  },

  update: async (id, data) => {
    const notes = getAllNotes();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error('Note not found');
    notes[idx] = {
      ...notes[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveAllNotes(notes);
    return { ok: true };
  },

  delete: async (id) => {
    const notes = getAllNotes().filter((n) => n.id !== id);
    saveAllNotes(notes);
    return { ok: true };
  },
};
