import React from 'react';
import {
  VscLock,
  VscShield,
  VscFile,
  VscBracketError,
} from 'react-icons/vsc';

export default function StatusBar({ user, noteCount, activeNote, encrypted }) {
  return (
    <div style={styles.statusBar}>
      <div style={styles.left}>
        <div style={styles.item}>
          <VscShield size={14} />
          <span>TEE Secured</span>
        </div>
        <div style={styles.item}>
          <VscLock size={14} />
          <span>AES-256-GCM</span>
        </div>
        {encrypted && (
          <div style={styles.item}>
            <span>E2E Encrypted</span>
          </div>
        )}
      </div>
      <div style={styles.right}>
        <div style={styles.item}>
          <VscFile size={14} />
          <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
        </div>
        {activeNote && (
          <div style={styles.item}>
            <VscBracketError size={14} />
            <span>MDX</span>
          </div>
        )}
        <div style={styles.item}>
          <span>{user.email || user.display_name}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  statusBar: {
    height: 'var(--statusbar-height)',
    background: 'var(--bg-statusbar)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: 'var(--text-statusbar)',
    cursor: 'default',
  },
};
