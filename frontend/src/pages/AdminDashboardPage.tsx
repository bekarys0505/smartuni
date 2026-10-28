import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';
import { AppShell } from '../components/layout/AppShell';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/index';
import '../styles/AdminPage.css';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalSubjects: number;
  totalGroups: number;
  activeGroupsCount: number;
  activeMembershipsCount: number;
}

interface RecentUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Сессия табылмады. Қайта жүйеге кіріңіз.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.get<{ stats: DashboardStats; recentUsers: RecentUser[] }>(
        '/api/admin/dashboard',
      );
      setStats(data.stats);
      setRecentUsers(data.recentUsers || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Деректерді жүктеу кезінде белгісіз қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('kk-KZ', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-admin-page">
        {/* Page Header */}
        <div className="su-admin-header">
          <div>
            <h1 className="su-admin-title">Әкімшілік Басқару Панелі</h1>
            <p className="su-admin-subtitle">
              SmartUni LMS білім беру жүйесінің орталықтандырылған көрсеткіштері мен мониторингі
            </p>
          </div>
          <Button
            variant="outline"
            icon={<Icon name="clock" size={16} />}
            onClick={loadData}
            loading={loading}
          >
            Жаңарту
          </Button>
        </div>

        {error && (
          <div className="su-admin-banner su-admin-banner--error">
            <Icon name="alert-circle" size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Real Stats Cards */}
        {stats && (
          <div className="su-admin-stats-grid">
            <div className="su-admin-stat-card">
              <div className="su-admin-stat-icon su-stat-icon--primary">
                <Icon name="users" size={24} />
              </div>
              <div className="su-admin-stat-meta">
                <span className="su-admin-stat-label">Барлық пайдаланушы</span>
                <span className="su-admin-stat-value">{stats.totalUsers}</span>
                <span className="su-admin-stat-hint">
                  {stats.totalStudents} студент · {stats.totalTeachers} оқытушы
                </span>
              </div>
            </div>

            <div className="su-admin-stat-card">
              <div className="su-admin-stat-icon su-stat-icon--success">
                <Icon name="book" size={24} />
              </div>
              <div className="su-admin-stat-meta">
                <span className="su-admin-stat-label">Оқу пәндері</span>
                <span className="su-admin-stat-value">{stats.totalSubjects}</span>
                <span className="su-admin-stat-hint">Базадағы академиялық курстар</span>
              </div>
            </div>

            <div className="su-admin-stat-card">
              <div className="su-admin-stat-icon su-stat-icon--warning">
                <Icon name="layers" size={24} />
              </div>
              <div className="su-admin-stat-meta">
                <span className="su-admin-stat-label">Академиялық топтар</span>
                <span className="su-admin-stat-value">{stats.totalGroups}</span>
                <span className="su-admin-stat-hint">
                  {stats.activeGroupsCount} белсенді оқу тобы
                </span>
              </div>
            </div>

            <div className="su-admin-stat-card">
              <div className="su-admin-stat-icon su-stat-icon--info">
                <Icon name="graduation-cap" size={24} />
              </div>
              <div className="su-admin-stat-meta">
                <span className="su-admin-stat-label">Тіркелген студенттер</span>
                <span className="su-admin-stat-value">{stats.activeMembershipsCount}</span>
                <span className="su-admin-stat-hint">Топтардағы нақты оқушылар</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Navigation */}
        <div className="su-admin-card">
          <div className="su-admin-card-header">
            <h2 className="su-admin-card-title">
              <Icon name="settings" size={20} />
              Басқару бөлімдеріне жылдам өту
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <Link
              to="/admin/users"
              style={{
                textDecoration: 'none',
                padding: 16,
                border: '1px solid var(--su-border)',
                borderRadius: 10,
                background: 'var(--su-bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                color: 'var(--su-text-main)',
              }}
            >
              <div style={{ padding: 10, borderRadius: 8, background: '#e0f2fe', color: '#0369a1' }}>
                <Icon name="users" size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>Пайдаланушылар</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--su-text-muted)' }}>
                  Студенттер, оқытушылар және рөлдерді басқару
                </p>
              </div>
            </Link>

            <Link
              to="/admin/subjects"
              style={{
                textDecoration: 'none',
                padding: 16,
                border: '1px solid var(--su-border)',
                borderRadius: 10,
                background: 'var(--su-bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                color: 'var(--su-text-main)',
              }}
            >
              <div style={{ padding: 10, borderRadius: 8, background: '#dcfce7', color: '#15803d' }}>
                <Icon name="book" size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>Пәндер каталогы</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--su-text-muted)' }}>
                  Жаңа пән қосу, кодтарын және ақпаратын түзету
                </p>
              </div>
            </Link>

            <Link
              to="/admin/groups"
              style={{
                textDecoration: 'none',
                padding: 16,
                border: '1px solid var(--su-border)',
                borderRadius: 10,
                background: 'var(--su-bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                color: 'var(--su-text-main)',
              }}
            >
              <div style={{ padding: 10, borderRadius: 8, background: '#fef3c7', color: '#b45309' }}>
                <Icon name="layers" size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>Оқу топтары</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--su-text-muted)' }}>
                  Барлық топтардың контингенті және оқытушылары
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Registered Users Table */}
        <div className="su-admin-card">
          <div className="su-admin-card-header">
            <h2 className="su-admin-card-title">
              <Icon name="clock" size={20} />
              Соңғы тіркелген пайдаланушылар
            </h2>
            <Link to="/admin/users" style={{ fontSize: '0.85rem', color: 'var(--su-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Барлығын қарау →
            </Link>
          </div>

          <div className="su-admin-table-wrap">
            <table className="su-admin-table">
              <thead>
                <tr>
                  <th>Қолданушы</th>
                  <th>Байланыс</th>
                  <th>Рөлі</th>
                  <th>Статусы</th>
                  <th>Тіркелген күні</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="su-admin-user-cell">
                        <div className="su-admin-user-avatar">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="su-admin-user-name">{u.fullName}</div>
                          <div className="su-admin-user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={`su-badge su-badge--${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`su-badge su-badge--${u.status.toLowerCase()}`}>
                        {u.status === 'ACTIVE' ? 'Белсенді' : 'Бұғатталған'}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
                {recentUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--su-text-muted)' }}>
                      Әзірге тіркелген пайдаланушылар жоқ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

