import React, { useState, useCallback } from 'react';
import { VscLock, VscKey } from 'react-icons/vsc';
import { keysApi } from '../utils/api.js';
import { decryptMasterKey } from '../utils/crypto.js';

export default function UnlockScreen({ user, onUnlock, onLogout }) {
  const [recoveryKey, setRecoveryKey] = useState('');
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (!recoveryKey.trim()) {
      setError('Please enter your recovery key');
      return;
    }

    setUnlocking(true);
    setError('');

    try {
      // Fetch encrypted master key from server
      const keyData = await keysApi.getMasterKey();
      if (!keyData.hasKey) {
        setError('No encryption key found. Please contact support.');
        return;
      }

      // Decrypt master key using recovery key
      const masterKey = await decryptMasterKey(keyData, recoveryKey.trim());
      onUnlock(masterKey);
    } catch (err) {
      setError('Invalid recovery key. Please check and try again.');
    } finally {
      setUnlocking(false);
    }
  }, [recoveryKey, onUnlock]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <VscLock size={48} color="var(--accent-primary)" />
        <h2 style={styles.title}>Unlock Your Notes</h2>
        <p style={styles.subtitle}>
          Welcome back, {user.display_name}. Enter your recovery key to
          decrypt your notes.
        </p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Recovery Key</label>
          <input
            type="text"
            value={recoveryKey}
            onChange={(e) => { setRecoveryKey(e.target.value); setError(''); }}
            placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
            style={styles.input}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            autoFocus
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleUnlock}
          disabled={unlocking}
          style={styles.primaryBtn}
        >
          {unlocking ? 'Decrypting...' : 'Unlock'}
        </button>

        <button onClick={onLogout} style={styles.secondaryBtn}>
          Sign out
        </button>

        <p style={styles.footer}>
          <VscKey size={12} />
          <span>Your recovery key was shown when you first set up encryption.</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    padding: 20,
  },
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 8,
    padding: '48px 40px',
    maxWidth: 460,
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--text-active)',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    lineHeight: 1.5,
  },
  inputGroup: {
    width: '100%',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    borderRadius: 3,
    letterSpacing: '0.5px',
  },
  error: {
    color: 'var(--accent-error)',
    fontSize: 12,
  },
  primaryBtn: {
    width: '100%',
    padding: '10px 20px',
    background: 'var(--accent-primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '6px 16px',
    background: 'none',
    color: 'var(--text-secondary)',
    border: 'none',
    fontSize: 12,
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-muted)',
    fontSize: 11,
  },
};
