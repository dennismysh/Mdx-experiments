import { useState, useEffect, useCallback } from 'react';
import { authApi, keysApi, detectDemoMode, isDemoMode } from '../utils/api.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [hasEncryptionKeys, setHasEncryptionKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      // Detect if backend is available
      await detectDemoMode();
      setDemoMode(isDemoMode());

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

  const demoLogin = useCallback(async () => {
    try {
      setError(null);
      const data = await authApi.demoLogin();
      setUser(data.user);
      setHasEncryptionKeys(data.hasEncryptionKeys || false);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const demoLoginFresh = useCallback(async () => {
    try {
      setError(null);
      await keysApi.reset();
      const data = await authApi.demoLogin();
      setUser(data.user);
      setHasEncryptionKeys(false);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setHasEncryptionKeys(false);
  }, []);

  return {
    user, hasEncryptionKeys, setHasEncryptionKeys,
    loading, error, demoMode,
    devLogin, demoLogin, demoLoginFresh, logout, refresh: checkAuth,
  };
}
