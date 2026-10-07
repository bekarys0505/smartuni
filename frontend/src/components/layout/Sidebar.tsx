import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { NavSection } from '../../config/navigation';
import { Icon } from '../ui/Icon';

interface SidebarProps {
  navSections: NavSection[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  roleBadgeText?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navSections,
  collapsed,
  onToggleCollapse,
  onLogout,
  roleBadgeText,
}) => {
  const location = useLocation();

  const isItemActive = (path: string, defaultActive: boolean) => {
    if (defaultActive) return true;
    if (path === '/student/subjects') {
      return (
        location.pathname.startsWith('/student/subjects') ||
        location.pathname.startsWith('/student/topics')
      );
    }
    if (path === '/teacher/subjects') {
      return (
        location.pathname.startsWith('/teacher/subjects') ||
        location.pathname.startsWith('/teacher/topics')
      );
    }
    return false;
  };
  return (
    <aside className={`su-sidebar ${collapsed ? 'su-sidebar--collapsed' : ''}`}>
      {/* Brand area */}
      <div className="su-sidebar-brand">
        <a href="/" className="su-sidebar-logo">
          <div className="su-sidebar-logo-mark">S</div>
          {!collapsed && (
            <div className="su-sidebar-logo-text">
              <span className="su-sidebar-logo-title">SmartUni</span>
              {roleBadgeText && (
                <span className="su-sidebar-logo-subtitle">{roleBadgeText}</span>
              )}
            </div>
          )}
        </a>
        <button
          type="button"
          className="su-sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Кеңейту' : 'Жию'}
          aria-label={collapsed ? 'Кеңейту' : 'Жию'}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} />
        </button>
      </div>

      {/* Navigation sections */}
      <div className="su-sidebar-nav-container">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="su-nav-section">
            {section.title && !collapsed && (
              <div className="su-nav-section-title">{section.title}</div>
            )}
            <ul className="su-nav-list">
              {section.items.map((item) => (
                <li key={item.id} className="su-nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `su-nav-item-link ${isItemActive(item.path, isActive) ? 'active' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="su-nav-icon">
                      <Icon name={item.icon} size={18} />
                    </span>
                    {!collapsed && (
                      <span className="su-nav-label">{item.label}</span>
                    )}
                    {item.badge && (
                      <span className="su-nav-badge">{item.badge}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="su-sidebar-footer">
        <button
          type="button"
          className="su-sidebar-logout-btn"
          onClick={onLogout}
          title={collapsed ? 'Жүйеден шығу' : undefined}
        >
          <Icon name="logout" size={18} />
          {!collapsed && <span>Жүйеден шығу</span>}
        </button>
      </div>
    </aside>
  );
};
