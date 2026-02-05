import React from 'react';
import { VscNote, VscChevronDown } from 'react-icons/vsc';

export default function TitleBar({ user, onLogout }) {
  return (
    <div style={styles.titleBar}>
      <div style={styles.left}>
        <VscNote size={14} color="var(--accent-primary)" />
        <span style={styles.appName}>Encrypted Notes</span>
        <div style={styles.menuItems}>
          <span style={styles.menuItem}>File</span>
          <span style={styles.menuItem}>Edit</span>
          <span style={styles.menuItem}>View</span>
          <span style={styles.menuItem}>Help</span>
        </div>
      </div>
      <div style={styles.center}>
        <span style={styles.title}>Encrypted Notes — MDX Editor</span>
      </div>
      <div style={styles.right}>
        <div style={styles.userMenu}>
          {user.avatar_url && (
            <img src={user.avatar_url} alt="" style={styles.avatar} />
          )}
          <span style={styles.userName}>{user.display_name}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  titleBar: {
    height: 'var(--titlebar-height)',
    background: 'var(--bg-titlebar)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    WebkitAppRegion: 'drag',
    userSelect: 'none',
    borderBottom: '1px solid var(--border-primary)',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    WebkitAppRegion: 'no-drag',
  },
  appName: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-active)',
    marginRight: 8,
  },
  menuItems: {
    display: 'flex',
    gap: 2,
  },
  menuItem: {
    padding: '2px 8px',
    fontSize: 12,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    borderRadius: 3,
  },
  center: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  title: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    WebkitAppRegion: 'no-drag',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: '50%',
  },
  userName: {
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  logoutBtn: {
    padding: '2px 8px',
    fontSize: 11,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: 3,
    border: '1px solid var(--border-primary)',
    background: 'transparent',
  },
};
