import { useState, useEffect, useCallback } from 'react';
import { authApi, keysApi } from '../utils/api.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [hasEncryptionKeys, setHasEncryptionKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authApi.me();
      setUser(data.user);
      setHasEncryptionKeys(data.hasEncryptionKeys || false);
    } catch (err) {
      setUser(null);
      setHasEncryptionKeys(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    const handler = () => {
      setUser(null);
      setHasEncryptionKeys(false);
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [checkAuth]);

  const devLogin = useCallback(async () => {
    try {
      setError(null);
      const data = await authApi.devLogin();
      setUser(data.user);
      setHasEncryptionKeys(data.hasEncryptionKeys || false);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setHasEncryptionKeys(false);
  }, []);

  return { user, hasEncryptionKeys, setHasEncryptionKeys, loading, error, devLogin, logout, refresh: checkAuth };
}
