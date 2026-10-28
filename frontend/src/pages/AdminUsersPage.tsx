import { useEffect, useState, useCallback } from 'react';
import { api } from '../utils/api';
import { getToken, getUser } from '../utils/auth';
import { AppShell } from '../components/layout/AppShell';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/index';
import '../styles/AdminPage.css';

interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
  studentProfile?: {
    course: number;
    university?: { name: string };
    faculty?: { name: string };
    major?: { name: string };
    _count: { memberships: number; assignmentSubmissions: number };
  } | null;
  teacherProfile?: {
    department: string | null;
    position: string | null;
    _count: { groups: number; tests: number };
  } | null;
}

export default function AdminUsersPage() {
  const currentAdmin = getUser();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadUsers = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Сессия табылмады. Қайта кіріңіз.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParts: string[] = [`page=${page}`, `limit=15`];
      if (search.trim()) queryParts.push(`search=${encodeURIComponent(search.trim())}`);
      if (roleFilter) queryParts.push(`role=${roleFilter}`);
      if (statusFilter) queryParts.push(`status=${statusFilter}`);

      const data = await api.get<{
        data: AdminUserItem[];
        pagination: { total: number; totalPages: number };
      }>(`/api/admin/users?${queryParts.join('&')}`);

      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Пайдаланушыларды жүктеу кезінде қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Status toggle
  const handleToggleStatus = async (user: AdminUserItem) => {
    if (user.id === currentAdmin?.id) {
      setBanner({ type: 'error', message: 'Әкімші өз аккаунтын бұғаттай алмайды' });
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      await api.patch(`/api/admin/users/${user.id}/status`, { status: nextStatus });
      setBanner({
        type: 'success',
        message: `${user.fullName} аккаунты ${nextStatus === 'ACTIVE' ? 'белсендірілді' : 'бұғатталды'}`,
      });
      loadUsers();
    } catch (err) {
      if (err instanceof Error) {
        setBanner({ type: 'error', message: err.message });
      }
    }
  };

  // Change Role
  const handleRoleChangeSubmit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      await api.patch(`/api/admin/users/${selectedUser.id}/role`, { role: newRole });
      setBanner({
        type: 'success',
        message: `${selectedUser.fullName} пайдаланушысының рөлі ${newRole} етіп өзгертілді`,
      });
      setRoleModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      if (err instanceof Error) {
        setBanner({ type: 'error', message: err.message });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      await api.delete(`/api/admin/users/${selectedUser.id}`);
      setBanner({
        type: 'success',
        message: `${selectedUser.fullName} пайдаланушысы жүйеден қауіпсіз жойылды`,
      });
      setDeleteModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      if (err instanceof Error) {
        setBanner({ type: 'error', message: err.message });
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-admin-page">
        {/* Page Header */}
        <div className="su-admin-header">
          <div>
            <h1 className="su-admin-title">Пайдаланушыларды басқару</h1>
            <p className="su-admin-subtitle">
              Жүйедегі барлық студенттер, оқытушылар және әкімшілер тізімі ({totalCount} қолданушы)
            </p>
          </div>
        </div>

        {banner && (
          <div className={`su-admin-banner su-admin-banner--${banner.type}`}>
            <Icon name={banner.type === 'success' ? 'check-circle' : 'alert-circle'} size={20} />
            <span>{banner.message}</span>
          </div>
        )}

        {error && (
          <div className="su-admin-banner su-admin-banner--error">
            <Icon name="alert-circle" size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="su-admin-filter-bar">
          <div className="su-admin-search-wrap">
            <Icon name="search" size={18} className="su-admin-search-icon" />
            <input
              type="text"
              placeholder="Аты-жөні, email немесе телефон бойынша іздеу..."
              className="su-admin-search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="su-admin-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Барлық рөлдер</option>
            <option value="STUDENT">Студенттер</option>
            <option value="TEACHER">Оқытушылар</option>
            <option value="ADMIN">Әкімшілер</option>
          </select>

          <select
            className="su-admin-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Барлық мәртебелер</option>
            <option value="ACTIVE">Белсенді</option>
            <option value="BLOCKED">Бұғатталған</option>
          </select>
        </div>

        {/* Table of Users */}
        <div className="su-admin-card">
          <div className="su-admin-table-wrap">
            <table className="su-admin-table">
              <thead>
                <tr>
                  <th>Қолданушы</th>
                  <th>Байланыс</th>
                  <th>Рөлі</th>
                  <th>Профиль ақпараты</th>
                  <th>Мәртебесі</th>
                  <th style={{ textAlign: 'right' }}>Әрекеттер</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
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
                      {u.role === 'STUDENT' && u.studentProfile && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--su-text-muted)' }}>
                          {u.studentProfile.course}-курс · {u.studentProfile._count.memberships} топ
                        </span>
                      )}
                      {u.role === 'TEACHER' && u.teacherProfile && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--su-text-muted)' }}>
                          {u.teacherProfile.department || 'Кафедра жоқ'} · {u.teacherProfile._count.groups} топ
                        </span>
                      )}
                      {u.role === 'ADMIN' && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--su-primary)' }}>
                          Global Admin
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`su-badge su-badge--${u.status.toLowerCase()}`}>
                        {u.status === 'ACTIVE' ? 'Белсенді' : 'Бұғатталған'}
                      </span>
                    </td>
                    <td>
                      <div className="su-admin-actions-cell">
                        <button
                          type="button"
                          className="su-btn-icon-sm"
                          title="Рөлін өзгерту"
                          onClick={() => {
                            setSelectedUser(u);
                            setNewRole(u.role);
                            setRoleModalOpen(true);
                          }}
                        >
                          <Icon name="settings" size={15} />
                        </button>
                        <button
                          type="button"
                          className="su-btn-icon-sm"
                          title={u.status === 'ACTIVE' ? 'Бұғаттау' : 'Белсендіру'}
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.id === currentAdmin?.id}
                        >
                          <Icon name={u.status === 'ACTIVE' ? 'x' : 'check'} size={15} />
                        </button>
                        <button
                          type="button"
                          className="su-btn-icon-sm su-btn-icon-sm--danger"
                          title="Пайдаланушыны жою"
                          onClick={() => {
                            setSelectedUser(u);
                            setDeleteModalOpen(true);
                          }}
                          disabled={u.id === currentAdmin?.id}
                        >
                          <Icon name="x-circle" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--su-text-muted)' }}>
                      Сүзгіге сәйкес пайдаланушылар табылмады
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="su-admin-pagination">
              <span>
                Бет {page} / {totalPages} (Барлығы {totalCount})
              </span>
              <div className="su-admin-pagination-btns">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Алдыңғы
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Келесі →
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Change Role Modal */}
        {roleModalOpen && selectedUser && (
          <div className="su-modal-overlay">
            <div className="su-modal-container">
              <div className="su-modal-header">
                <h3 className="su-modal-title">Рөлді өзгерту</h3>
                <button
                  type="button"
                  className="su-btn-icon-sm"
                  onClick={() => setRoleModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
              <div className="su-modal-body">
                <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem' }}>
                  <strong>{selectedUser.fullName}</strong> ({selectedUser.email}) үшін жаңа рөл таңдаңыз:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="role"
                      value="STUDENT"
                      checked={newRole === 'STUDENT'}
                      onChange={() => setNewRole('STUDENT')}
                    />
                    <span>STUDENT (Студент)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="role"
                      value="TEACHER"
                      checked={newRole === 'TEACHER'}
                      onChange={() => setNewRole('TEACHER')}
                    />
                    <span>TEACHER (Оқытушы)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={newRole === 'ADMIN'}
                      onChange={() => setNewRole('ADMIN')}
                    />
                    <span>ADMIN (Жүйе әкімшісі)</span>
                  </label>
                </div>
              </div>
              <div className="su-modal-footer">
                <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
                  Болдырмау
                </Button>
                <Button variant="primary" loading={actionLoading} onClick={handleRoleChangeSubmit}>
                  Рөлді сақтау
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedUser && (
          <div className="su-modal-overlay">
            <div className="su-modal-container">
              <div className="su-modal-header">
                <h3 className="su-modal-title">Пайдаланушыны жою</h3>
                <button
                  type="button"
                  className="su-btn-icon-sm"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
              <div className="su-modal-body">
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--su-text-main)' }}>
                  Сіз шынымен <strong>{selectedUser.fullName}</strong> пайдаланушысын жойғыңыз келе ме?
                </p>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--su-warning-light)',
                    color: 'var(--su-warning-text)',
                    fontSize: '0.85rem',
                  }}
                >
                  Ескерту: Егер бұл пайдаланушының топтары, тапсырмалары немесе бағалары бар болса,
                  деректер тұтастығын сақтау мақсатында жою операциясы бұғатталады.
                </div>
              </div>
              <div className="su-modal-footer">
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                  Болдырмау
                </Button>
                <Button variant="danger" loading={actionLoading} onClick={handleDeleteSubmit}>
                  Жоюды растау
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
