import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/index';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  roleBadgeText?: string;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Қолданушы',
  userEmail = '',
  userRole = '',
  roleBadgeText = '',
  onOpenMobileSidebar,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="su-header">
      {/* Left side: mobile toggle & academic identity */}
      <div className="su-header-left">
        <button
          type="button"
          className="su-header-mobile-toggle"
          onClick={onOpenMobileSidebar}
          aria-label="Мәзірді ашу"
        >
          <Icon name="menu" size={22} />
        </button>
        <div className="su-header-title">SmartUni Академиялық Кеңістік</div>
      </div>

      {/* Right side: Notifications & User profile dropdown */}
      <div className="su-header-right">
        {/* Notifications */}
        <div className="su-header-notifications" ref={notificationsRef}>
          <button
            type="button"
            className="su-header-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Хабарламалар"
            title="Хабарламалар"
          >
            <Icon name="bell" size={19} />
            <span className="su-header-badge-dot" />
          </button>

          {showNotifications && (
            <div className="su-notifications-dropdown">
              <div className="su-notifications-header">
                <h4>Хабарламалар</h4>
                <span className="su-badge su-badge--primary su-badge--sm">Жаңа</span>
              </div>
              <div className="su-notifications-list">
                <div className="su-notification-item">
                  <span style={{ color: 'var(--su-primary)' }}>
                    <Icon name="book" size={18} />
                  </span>
                  <div className="su-notification-content">
                    <p>Жаңа оқу семестрі басталды. Кестені тексеріңіз.</p>
                    <div className="su-notification-time">Бүгін, 09:30</div>
                  </div>
                </div>
                <div className="su-notification-item">
                  <span style={{ color: 'var(--su-success)' }}>
                    <Icon name="check-circle" size={18} />
                  </span>
                  <div className="su-notification-content">
                    <p>Жүйедегі профиль деректері расталды.</p>
                    <div className="su-notification-time">Кеше, 16:45</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="su-header-user-menu" ref={userMenuRef}>
          <button
            type="button"
            className="su-header-user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Қолданушы мәзірі"
          >
            <Avatar name={userName} size="sm" />
            <div className="su-header-user-meta">
              <span className="su-header-user-name">{userName}</span>
              <span className="su-header-user-role">
                {roleBadgeText || userRole}
              </span>
            </div>
            <Icon name="chevron-down" size={14} />
          </button>

          {showUserMenu && (
            <div className="su-user-dropdown">
              <div className="su-user-dropdown-header">
                <div className="su-user-dropdown-name">{userName}</div>
                {userEmail && (
                  <div className="su-user-dropdown-email">{userEmail}</div>
                )}
              </div>

              <a
                href={
                  userRole === 'STUDENT'
                    ? '/student/profile'
                    : userRole === 'TEACHER'
                    ? '/teacher/profile'
                    : '/admin/profile'
                }
                className="su-user-dropdown-item"
                onClick={() => setShowUserMenu(false)}
              >
                <Icon name="user" size={16} />
                <span>Жеке профиль</span>
              </a>

              <a
                href={
                  userRole === 'STUDENT'
                    ? '/student/settings'
                    : userRole === 'TEACHER'
                    ? '/teacher/settings'
                    : '/admin/settings'
                }
                className="su-user-dropdown-item"
                onClick={() => setShowUserMenu(false)}
              >
                <Icon name="settings" size={16} />
                <span>Баптаулар</span>
              </a>

              <div className="su-user-dropdown-divider" />

              <button
                type="button"
                className="su-user-dropdown-item su-user-dropdown-item--danger"
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
              >
                <Icon name="logout" size={16} />
                <span>Шығу</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

