import React, { useState, useCallback } from 'react';
import { VscKey, VscCopy, VscCheck, VscWarning } from 'react-icons/vsc';
import {
  generateMasterKey,
  generateRecoveryKey,
  encryptMasterKey,
  hashRecoveryKey,
} from '../utils/crypto.js';
import { keysApi } from '../utils/api.js';

export default function OnboardingScreen({ user, onComplete }) {
  const [step, setStep] = useState(0); // 0=intro, 1=show key, 2=confirm
  const [recoveryKey, setRecoveryKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const masterKey = await generateMasterKey();
      const recovery = generateRecoveryKey();
      setRecoveryKey(recovery);

      // Encrypt master key with recovery key
      const { encryptedMasterKey, salt, iv } = await encryptMasterKey(masterKey, recovery);
      const recoveryKeyHash = await hashRecoveryKey(recovery);

      // Store on server
      await keysApi.storeMasterKey({
        encryptedMasterKey,
        salt,
        iv,
        recoveryKeyHash,
      });

      setStep(1);
    } catch (err) {
      setError('Failed to generate encryption keys: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [recoveryKey]);

  const handleVerify = useCallback(() => {
    // Check last 8 characters match
    const lastSegment = recoveryKey.split('-').pop();
    if (verifyInput.trim().toLowerCase() === lastSegment.toLowerCase()) {
      setConfirmed(true);
      onComplete();
    } else {
      setError('Does not match. Enter the last segment of your recovery key.');
    }
  }, [verifyInput, recoveryKey, onComplete]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {step === 0 && (
          <>
            <VscKey size={48} color="var(--accent-primary)" />
            <h2 style={styles.title}>Set Up Encryption</h2>
            <p style={styles.text}>
              Welcome, {user.display_name}. Your notes will be encrypted with a
              master key that only you control. A recovery key will be generated
              that you must save securely — it's the only way to recover your
              data if you lose access.
            </p>
            <div style={styles.warningBox}>
              <VscWarning size={16} color="var(--accent-warning)" />
              <span>
                If you lose your recovery key, your notes cannot be recovered.
                We have zero access to your encryption keys.
              </span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={styles.primaryBtn}
            >
              {generating ? 'Generating...' : 'Generate Encryption Keys'}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <VscKey size={48} color="var(--accent-success)" />
            <h2 style={styles.title}>Save Your Recovery Key</h2>
            <p style={styles.text}>
              Write this down or store it in a password manager. This key is
              required to access your notes on new devices or if you get locked out.
            </p>

            <div style={styles.keyBox}>
              <code style={styles.keyText}>{recoveryKey}</code>
              <button onClick={handleCopy} style={styles.copyBtn}>
                {copied ? <VscCheck size={16} /> : <VscCopy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div style={styles.warningBox}>
              <VscWarning size={16} color="var(--accent-error)" />
              <span>
                This key will NOT be shown again. Make sure you've saved it
                before continuing.
              </span>
            </div>

            <p style={styles.verifyLabel}>
              Enter the last segment of your recovery key to confirm:
            </p>
            <input
              type="text"
              value={verifyInput}
              onChange={(e) => { setVerifyInput(e.target.value); setError(''); }}
              placeholder="Last 8 characters..."
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            {error && <p style={styles.error}>{error}</p>}

            <button onClick={handleVerify} style={styles.primaryBtn}>
              Verify & Continue
            </button>
          </>
        )}
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
    maxWidth: 520,
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
  text: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    lineHeight: 1.6,
    maxWidth: 400,
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(204, 167, 0, 0.1)',
    border: '1px solid rgba(204, 167, 0, 0.3)',
    borderRadius: 4,
    padding: '12px 16px',
    fontSize: 12,
    color: 'var(--accent-warning)',
    textAlign: 'left',
    lineHeight: 1.5,
    width: '100%',
  },
  keyBox: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 4,
    padding: 20,
    width: '100%',
    position: 'relative',
  },
  keyText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    color: 'var(--accent-success)',
    wordBreak: 'break-all',
    lineHeight: 1.8,
    letterSpacing: '0.5px',
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    top: 8,
    right: 8,
    padding: '4px 10px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 3,
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
  },
  verifyLabel: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    borderRadius: 3,
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
    marginTop: 8,
  },
};
