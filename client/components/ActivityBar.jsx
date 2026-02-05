import React from 'react';
import {
  VscFiles,
  VscSearch,
  VscLock,
  VscSettingsGear,
} from 'react-icons/vsc';

const panels = [
  { id: 'explorer', icon: VscFiles, label: 'Explorer' },
  { id: 'search', icon: VscSearch, label: 'Search' },
  { id: 'security', icon: VscLock, label: 'Security' },
];

export default function ActivityBar({ activePanel, onPanelChange }) {
  return (
    <div style={styles.activityBar}>
      <div style={styles.top}>
        {panels.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onPanelChange(id)}
            style={{
              ...styles.iconBtn,
              ...(activePanel === id ? styles.iconBtnActive : {}),
            }}
            title={label}
          >
            <Icon size={24} />
            {activePanel === id && <div style={styles.activeIndicator} />}
          </button>
        ))}
      </div>
      <div style={styles.bottom}>
        <button style={styles.iconBtn} title="Settings">
          <VscSettingsGear size={24} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  activityBar: {
    width: 'var(--activitybar-width)',
    background: 'var(--bg-activitybar)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    flexShrink: 0,
    borderRight: '1px solid var(--border-primary)',
  },
  top: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  bottom: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconBtn: {
    position: 'relative',
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--icon-inactive)',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    transition: 'color var(--transition-fast)',
  },
  iconBtnActive: {
    color: 'var(--icon-active)',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 2,
    background: 'var(--icon-active)',
    borderRadius: 1,
  },
};
