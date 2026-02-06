const API_BASE = '';

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

// Auth
export const authApi = {
  me: () => request('/auth/me'),
  devLogin: () => request('/auth/dev-login', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// Keys
export const keysApi = {
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

// Notes
export const notesApi = {
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
