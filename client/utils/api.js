import { localAuthApi, localKeysApi, localNotesApi } from './localStorageBackend.js';

const API_BASE = '';

// Detect demo mode: no backend available (GitHub Pages, static hosting)
let _demoMode = null;

export async function detectDemoMode() {
  if (_demoMode !== null) return _demoMode;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
      signal: AbortSignal.timeout(3000),
    });
    _demoMode = !res.ok && res.status !== 200;
    // Even a 200 with {user:null} is fine — server is reachable
    if (res.ok) _demoMode = false;
  } catch {
    _demoMode = true;
  }
  return _demoMode;
}

export function isDemoMode() {
  return _demoMode === true;
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Server-backed API
const serverAuthApi = {
  me: () => request('/auth/me'),
  devLogin: () => request('/auth/dev-login', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

const serverKeysApi = {
  storeMasterKey: (data) => request('/api/keys/store-master-key', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMasterKey: () => request('/api/keys/master-key'),
  verifyRecovery: (recoveryKey) => request('/api/keys/verify-recovery', {
    method: 'POST',
    body: JSON.stringify({ recoveryKey }),
  }),
  reset: (data) => request('/api/keys/reset', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

const serverNotesApi = {
  list: () => request('/api/notes'),
  get: (id) => request(`/api/notes/${id}`),
  create: (data) => request('/api/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/api/notes/${id}`, { method: 'DELETE' }),
};

// Export proxies that switch between server and local based on demo mode
function createProxy(serverApi, localApi) {
  return new Proxy({}, {
    get(_, prop) {
      return (...args) => {
        if (_demoMode) return localApi[prop](...args);
        return serverApi[prop](...args);
      };
    },
  });
}

export const authApi = createProxy(serverAuthApi, localAuthApi);
export const keysApi = createProxy(serverKeysApi, localKeysApi);
export const notesApi = createProxy(serverNotesApi, localNotesApi);
