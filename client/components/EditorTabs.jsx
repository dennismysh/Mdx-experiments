import React from 'react';
import { VscClose, VscMarkdown } from 'react-icons/vsc';

export default function EditorTabs({ tabs, activeTabId, onSelectTab, onCloseTab }) {
  if (tabs.length === 0) return null;

  return (
    <div style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : styles.tabInactive),
            }}
          >
            <VscMarkdown size={14} color="#519aba" />
            <span style={{
              ...styles.tabTitle,
              color: isActive ? 'var(--text-tab-active)' : 'var(--text-tab-inactive)',
            }}>
              {tab.title || 'Untitled'}.mdx
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
              style={styles.closeBtn}
            >
              <VscClose size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  tabBar: {
    display: 'flex',
    background: 'var(--bg-tertiary)',
    borderBottom: '1px solid var(--border-primary)',
    height: 'var(--tab-height)',
    flexShrink: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 12px',
    minWidth: 120,
    maxWidth: 200,
    cursor: 'pointer',
    borderRight: '1px solid var(--border-primary)',
    position: 'relative',
    fontSize: 13,
    flexShrink: 0,
  },
  tabActive: {
    background: 'var(--bg-tab-active)',
    borderBottom: '1px solid var(--bg-tab-active)',
    marginBottom: -1,
  },
  tabInactive: {
    background: 'var(--bg-tab-inactive)',
  },
  tabTitle: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 12,
  },
  closeBtn: {
    padding: 2,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 3,
  },
};
