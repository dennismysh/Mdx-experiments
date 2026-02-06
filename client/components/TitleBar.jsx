import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VscNote } from 'react-icons/vsc';

const MENU_DEFINITIONS = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'newNote', label: 'New Note', shortcut: 'Ctrl+N', action: 'onCreateNote' },
      { id: 'save', label: 'Save', shortcut: 'Ctrl+S', action: 'onSave' },
      { type: 'separator' },
      { id: 'closeTab', label: 'Close Tab', shortcut: 'Ctrl+W', action: 'onCloseTab' },
      { type: 'separator' },
      { id: 'signOut', label: 'Sign Out', action: 'onLogout' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', action: 'onUndo' },
      { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: 'onRedo' },
      { type: 'separator' },
      { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', action: 'onCut' },
      { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', action: 'onCopy' },
      { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', action: 'onPaste' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'explorer', label: 'Explorer', action: 'onShowExplorer' },
      { id: 'search', label: 'Search', action: 'onShowSearch' },
      { id: 'security', label: 'Security', action: 'onShowSecurity' },
      { type: 'separator' },
      { id: 'toggleSidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: 'onToggleSidebar' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'shortcuts', label: 'Keyboard Shortcuts', action: 'onShowShortcuts' },
      { type: 'separator' },
      { id: 'about', label: 'About', action: 'onShowAbout' },
    ],
  },
];

export default function TitleBar({ user, onLogout, actions }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPositions, setMenuPositions] = useState({});
  const menuBarRef = useRef(null);
  const menuItemRefs = useRef({});

  const closeMenu = useCallback(() => {
    setOpenMenu(null);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!openMenu) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openMenu, closeMenu]);

  // Close on click outside
  useEffect(() => {
    if (!openMenu) return;
    const handleClick = (e) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    // Use timeout so the current click event doesn't immediately close
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClick);
    };
  }, [openMenu, closeMenu]);

  const handleMenuClick = useCallback((menuId) => {
    if (openMenu === menuId) {
      setOpenMenu(null);
    } else {
      // Calculate position from the menu item element
      const el = menuItemRefs.current[menuId];
      if (el) {
        const rect = el.getBoundingClientRect();
        setMenuPositions((prev) => ({
          ...prev,
          [menuId]: { top: rect.bottom, left: rect.left },
        }));
      }
      setOpenMenu(menuId);
    }
  }, [openMenu]);

  const handleMenuHover = useCallback((menuId) => {
    if (openMenu && openMenu !== menuId) {
      const el = menuItemRefs.current[menuId];
      if (el) {
        const rect = el.getBoundingClientRect();
        setMenuPositions((prev) => ({
          ...prev,
          [menuId]: { top: rect.bottom, left: rect.left },
        }));
      }
      setOpenMenu(menuId);
    }
  }, [openMenu]);

  const handleAction = useCallback((actionName) => {
    closeMenu();
    if (actionName === 'onLogout') {
      onLogout?.();
    } else if (actions?.[actionName]) {
      actions[actionName]();
    }
  }, [actions, onLogout, closeMenu]);

  return (
    <div style={styles.titleBar} className="titlebar">
      <div style={styles.left}>
        <VscNote size={14} color="var(--accent-primary)" />
        <span style={styles.appName}>Encrypted Notes</span>
        <div style={styles.menuItems} className="titlebar-menu" ref={menuBarRef}>
          {MENU_DEFINITIONS.map((menu) => (
            <div
              key={menu.id}
              style={styles.menuItemWrapper}
              ref={(el) => { menuItemRefs.current[menu.id] = el; }}
            >
              <span
                style={{
                  ...styles.menuItem,
                  ...(openMenu === menu.id ? styles.menuItemActive : {}),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClick(menu.id);
                }}
                onMouseEnter={() => handleMenuHover(menu.id)}
              >
                {menu.label}
              </span>
              {openMenu === menu.id && menuPositions[menu.id] && (
                <DropdownMenu
                  items={menu.items}
                  position={menuPositions[menu.id]}
                  onAction={handleAction}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={styles.center} className="titlebar-center">
        <span style={styles.title}>Encrypted Notes — MDX Editor</span>
      </div>
      <div style={styles.right}>
        <div style={styles.userMenu}>
          {user.avatar_url && (
            <img src={user.avatar_url} alt="" style={styles.avatar} />
          )}
          <span style={styles.userName} className="titlebar-username">{user.display_name}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

function DropdownMenu({ items, position, onAction }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <div
      style={{
        ...styles.dropdown,
        top: position.top,
        left: position.left,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={`sep-${index}`} style={styles.dropdownSeparator} />;
        }
        return (
          <div
            key={item.id}
            style={{
              ...styles.dropdownItem,
              ...(hoveredItem === item.id ? styles.dropdownItemHover : {}),
            }}
            onClick={() => onAction(item.action)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span style={styles.dropdownLabel}>{item.label}</span>
            {item.shortcut && (
              <span style={styles.dropdownShortcut}>{item.shortcut}</span>
            )}
          </div>
        );
      })}
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
    position: 'relative',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    WebkitAppRegion: 'no-drag',
    minWidth: 0,
  },
  appName: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-active)',
    marginRight: 8,
    whiteSpace: 'nowrap',
  },
  menuItems: {
    display: 'flex',
    gap: 2,
    position: 'relative',
  },
  menuItemWrapper: {
    position: 'relative',
  },
  menuItem: {
    padding: '2px 8px',
    fontSize: 12,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    borderRadius: 3,
    display: 'inline-block',
  },
  menuItemActive: {
    background: 'var(--bg-hover)',
    color: 'var(--text-active)',
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
    flexShrink: 0,
    whiteSpace: 'nowrap',
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
  // Dropdown styles
  dropdown: {
    position: 'fixed',
    minWidth: 200,
    background: 'var(--bg-dropdown)',
    border: '1px solid var(--border-primary)',
    borderRadius: 4,
    boxShadow: 'var(--shadow-dropdown)',
    padding: '4px 0',
    zIndex: 9999,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 24px 4px 12px',
    fontSize: 12,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dropdownItemHover: {
    background: 'var(--accent-primary)',
    color: 'var(--text-active)',
  },
  dropdownLabel: {
    flex: 1,
  },
  dropdownShortcut: {
    marginLeft: 32,
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  dropdownSeparator: {
    height: 1,
    background: 'var(--border-primary)',
    margin: '4px 0',
  },
};
