import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { NavSection } from '../../config/navigation';
import { Icon } from '../ui/Icon';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navSections: NavSection[];
  onLogout: () => void;
  roleBadgeText?: string;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  navSections,
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

  if (!isOpen) return null;

  return (
    <>
      <div className="su-mobile-backdrop" onClick={onClose} />
      <div className="su-mobile-sidebar">
        <div className="su-sidebar-brand">
          <div className="su-sidebar-logo">
            <div className="su-sidebar-logo-mark">S</div>
            <div className="su-sidebar-logo-text">
              <span className="su-sidebar-logo-title">SmartUni</span>
              {roleBadgeText && (
                <span className="su-sidebar-logo-subtitle">{roleBadgeText}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="su-sidebar-collapse-btn"
            onClick={onClose}
            aria-label="Жабу"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="su-sidebar-nav-container">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="su-nav-section">
              {section.title && (
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
                      onClick={onClose}
                    >
                      <span className="su-nav-icon">
                        <Icon name={item.icon} size={18} />
                      </span>
                      <span className="su-nav-label">{item.label}</span>
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

        <div className="su-sidebar-footer">
          <button
            type="button"
            className="su-sidebar-logout-btn"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <Icon name="logout" size={18} />
            <span>Жүйеден шығу</span>
          </button>
        </div>
      </div>
    </>
  );
};
