import React from 'react';
import { VscLock, VscNote } from 'react-icons/vsc';
import { FcGoogle } from 'react-icons/fc';

export default function LoginScreen({ onDevLogin, onDemoLogin, demoMode, error }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <VscNote size={48} color="var(--accent-primary)" />
        </div>
        <h1 style={styles.title}>Encrypted Notes</h1>
        <p style={styles.subtitle}>
          End-to-end encrypted MDX notes with VS Code editing experience
        </p>

        <div style={styles.features}>
          <div style={styles.feature}>
            <VscLock size={16} color="var(--accent-success)" />
            <span>AES-256-GCM encryption</span>
          </div>
          <div style={styles.feature}>
            <VscLock size={16} color="var(--accent-success)" />
            <span>Zero-knowledge architecture</span>
          </div>
          <div style={styles.feature}>
            <VscLock size={16} color="var(--accent-success)" />
            <span>TEE-backed key management</span>
          </div>
        </div>

        {demoMode ? (
          <>
            <button onClick={onDemoLogin} style={styles.demoBtn}>
              Try Demo
            </button>
            <p style={styles.demoNote}>
              Running in demo mode — notes are encrypted and stored locally in
              your browser. No server required.
            </p>
          </>
        ) : (
          <>
            <a href="/auth/google" style={styles.googleBtn}>
              <FcGoogle size={20} />
              <span>Sign in with Google</span>
            </a>
            <button onClick={onDevLogin} style={styles.devBtn}>
              Dev Login (local only)
            </button>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.footer}>
          Your notes are encrypted before leaving your device.
          <br />We cannot read your data.
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
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--text-active)',
    marginBottom: 8,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 28,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 32,
    textAlign: 'left',
    padding: '0 20px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 16px',
    background: '#ffffff',
    color: '#333333',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
    marginBottom: 12,
  },
  demoBtn: {
    width: '100%',
    padding: '10px 16px',
    background: 'var(--accent-primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: 12,
  },
  demoNote: {
    color: 'var(--text-muted)',
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 16,
    padding: '0 8px',
  },
  devBtn: {
    width: '100%',
    padding: '8px 16px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    marginBottom: 24,
  },
  error: {
    color: 'var(--accent-error)',
    fontSize: 12,
    marginBottom: 12,
  },
  footer: {
    color: 'var(--text-muted)',
    fontSize: 11,
    lineHeight: 1.6,
  },
};
