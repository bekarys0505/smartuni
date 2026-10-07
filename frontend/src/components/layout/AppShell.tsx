import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../../utils/auth';
import { getNavForRole } from '../../config/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import '../../styles/tokens.css';
import '../../styles/app-shell.css';
import '../ui/ui.css';

interface AppShellProps {
  children: React.ReactNode;
  userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export const AppShell: React.FC<AppShellProps> = ({ children, userRole }) => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const effectiveRole = userRole || (currentUser?.role as 'STUDENT' | 'TEACHER' | 'ADMIN') || 'STUDENT';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navSections = getNavForRole(effectiveRole);

  const roleBadgeMap: Record<string, string> = {
    STUDENT: 'Студент',
    TEACHER: 'Оқытушы',
    ADMIN: 'Әкімші',
  };

  const roleBadgeText = roleBadgeMap[effectiveRole] || effectiveRole;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="su-app-shell">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        navSections={navSections}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
        roleBadgeText={roleBadgeText}
      />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        navSections={navSections}
        onLogout={handleLogout}
        roleBadgeText={roleBadgeText}
      />

      {/* Content wrapper */}
      <div className="su-main-wrapper">
        <Header
          userName={currentUser?.fullName || 'Қолданушы'}
          userEmail={currentUser?.email || ''}
          userRole={effectiveRole}
          roleBadgeText={roleBadgeText}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="su-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;

