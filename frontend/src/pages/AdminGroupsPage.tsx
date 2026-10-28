import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';
import { AppShell } from '../components/layout/AppShell';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/index';
import '../styles/AdminPage.css';

interface AdminGroupItem {
  id: string;
  name: string;
  course: number;
  capacity: number;
  semester: number;
  academicYear: string;
  lessonDay: string | null;
  lessonTime: string | null;
  classroom: string | null;
  status: string;
  createdAt: string;
  activeStudentsCount: number;
  pendingRequestsCount: number;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  teacher: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface GroupDetailData {
  id: string;
  name: string;
  course: number;
  capacity: number;
  semester: number;
  academicYear: string;
  lessonDay: string | null;
  lessonTime: string | null;
  classroom: string | null;
  status: string;
  subject: { name: string; code: string | null };
  teacher: { fullName: string; email: string; phone: string | null };
  students: Array<{
    membershipId: string;
    fullName: string;
    email: string;
    course: number;
    faculty?: string;
    major?: string;
    joinedAt: string;
  }>;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<AdminGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [groupDetail, setGroupDetail] = useState<GroupDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroupItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState(30);
  const [editClassroom, setEditClassroom] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadGroups = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Сессия табылмады. Қайта кіріңіз.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parts: string[] = [];
      if (search.trim()) parts.push(`search=${encodeURIComponent(search.trim())}`);
      if (statusFilter) parts.push(`status=${statusFilter}`);
      if (courseFilter) parts.push(`course=${courseFilter}`);

      const qs = parts.length > 0 ? `?${parts.join('&')}` : '';
      const data = await api.get<{ groups: AdminGroupItem[] }>(`/api/admin/groups${qs}`);
      setGroups(data.groups || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Топтарды жүктеу кезінде белгісіз қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, courseFilter]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Open Details Modal
  const handleOpenDetails = async (group: AdminGroupItem) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const data = await api.get<{ group: GroupDetailData }>(`/api/admin/groups/${group.id}`);
      setGroupDetail(data.group);
    } catch (err) {
      if (err instanceof Error) {
        setBanner({ type: 'error', message: err.message });
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (group: AdminGroupItem) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditCapacity(group.capacity);
    setEditClassroom(group.classroom || '');
    setEditStatus(group.status);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    setSaving(true);
    try {
      await api.patch(`/api/admin/groups/${editingGroup.id}`, {
        name: editName.trim(),
        capacity: editCapacity,
        classroom: editClassroom.trim() || undefined,
        status: editStatus,
      });

      setBanner({ type: 'success', message: 'Топ ақпараты сәтті жаңартылды' });
      setEditModalOpen(false);
      loadGroups();
    } catch (err) {
      if (err instanceof Error) {
        setBanner({ type: 'error', message: err.message });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-admin-page">
        {/* Header */}
        <div className="su-admin-header">
          <div>
            <h1 className="su-admin-title">Академиялық топтарды бақылау</h1>
            <p className="su-admin-subtitle">
              Университеттегі барлық топтар, жетекші мұғалімдер және студенттер контингенті ({groups.length} топ)
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
              placeholder="Топ, пән немесе оқытушы аты бойынша іздеу..."
              className="su-admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="su-admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Барлық мәртебелер</option>
            <option value="ACTIVE">Белсенді</option>
            <option value="ARCHIVED">Архивтелген</option>
          </select>

          <select
            className="su-admin-select"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="">Барлық курстар</option>
            <option value="1">1-курс</option>
            <option value="2">2-курс</option>
            <option value="3">3-курс</option>
            <option value="4">4-курс</option>
          </select>
        </div>

        {/* Groups Table */}
        <div className="su-admin-card">
          <div className="su-admin-table-wrap">
            <table className="su-admin-table">
              <thead>
                <tr>
                  <th>Топ атауы</th>
                  <th>Пән</th>
                  <th>Оқытушы</th>
                  <th>Курс / Семестр</th>
                  <th>Контингент</th>
                  <th>Статусы</th>
                  <th style={{ textAlign: 'right' }}>Әрекеттер</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((grp) => (
                  <tr key={grp.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--su-text-main)' }}>
                        {grp.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--su-text-muted)' }}>
                        {grp.classroom ? `Аудитория: ${grp.classroom}` : 'Аудитория көрсетілмеген'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{grp.subject.name}</span>
                      {grp.subject.code && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--su-text-muted)', display: 'block' }}>
                          {grp.subject.code}
                        </span>
                      )}
                    </td>
                    <td>
                      <div>{grp.teacher.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--su-text-muted)' }}>
                        {grp.teacher.email}
                      </div>
                    </td>
                    <td>
                      {grp.course}-курс · {grp.semester}-сем ({grp.academicYear})
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>
                          {grp.activeStudentsCount} / {grp.capacity}
                        </span>
                        {grp.pendingRequestsCount > 0 && (
                          <span
                            className="su-badge"
                            style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.7rem' }}
                          >
                            +{grp.pendingRequestsCount} өтініш
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`su-badge su-badge--${grp.status.toLowerCase()}`}>
                        {grp.status === 'ACTIVE' ? 'Белсенді' : grp.status}
                      </span>
                    </td>
                    <td>
                      <div className="su-admin-actions-cell">
                        <button
                          type="button"
                          className="su-btn-icon-sm"
                          title="Топ құрамын көру"
                          onClick={() => handleOpenDetails(grp)}
                        >
                          <Icon name="users" size={15} />
                        </button>
                        <button
                          type="button"
                          className="su-btn-icon-sm"
                          title="Топты өңдеу"
                          onClick={() => handleOpenEdit(grp)}
                        >
                          <Icon name="settings" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--su-text-muted)' }}>
                      Топтар табылмады
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Group Details Modal */}
        {detailModalOpen && (
          <div className="su-modal-overlay">
            <div className="su-modal-container" style={{ maxWidth: 680 }}>
              <div className="su-modal-header">
                <h3 className="su-modal-title">
                  {groupDetail ? `«${groupDetail.name}» тобының құрамы` : 'Жүктелуде...'}
                </h3>
                <button
                  type="button"
                  className="su-btn-icon-sm"
                  onClick={() => setDetailModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
              <div className="su-modal-body">
                {detailLoading && <p>Деректер жүктелуде...</p>}
                {groupDetail && !detailLoading && (
                  <>
                    <div style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--su-text-body)' }}>
                      <strong>Пән:</strong> {groupDetail.subject.name} | <strong>Оқытушы:</strong>{' '}
                      {groupDetail.teacher.fullName} ({groupDetail.teacher.email})
                    </div>

                    <h4 style={{ margin: '14px 0 8px 0', fontSize: '0.95rem' }}>
                      Тіркелген студенттер тізімі ({groupDetail.students.length} / {groupDetail.capacity}):
                    </h4>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      <table className="su-admin-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Студент</th>
                            <th>Email</th>
                            <th>Курс / Факультет</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupDetail.students.map((st) => (
                            <tr key={st.membershipId}>
                              <td style={{ fontWeight: 600 }}>{st.fullName}</td>
                              <td>{st.email}</td>
                              <td>
                                {st.course}-курс {st.faculty ? `· ${st.faculty}` : ''}
                              </td>
                            </tr>
                          ))}
                          {groupDetail.students.length === 0 && (
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'center', padding: 16, color: 'var(--su-text-muted)' }}>
                                Топта әзірге студенттер жоқ
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              <div className="su-modal-footer">
                <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Жабу
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Group Modal */}
        {editModalOpen && editingGroup && (
          <div className="su-modal-overlay">
            <div className="su-modal-container">
              <div className="su-modal-header">
                <h3 className="su-modal-title">Топ параметрлерін өңдеу</h3>
                <button
                  type="button"
                  className="su-btn-icon-sm"
                  onClick={() => setEditModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="su-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                      Топ атауы *
                    </label>
                    <input
                      type="text"
                      className="su-admin-search-input"
                      style={{ paddingLeft: 12 }}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                      Сыйымдылық (орын саны)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="su-admin-search-input"
                      style={{ paddingLeft: 12 }}
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(parseInt(e.target.value, 10))}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                      Аудитория
                    </label>
                    <input
                      type="text"
                      className="su-admin-search-input"
                      style={{ paddingLeft: 12 }}
                      placeholder="Мысалы: 402 ГУК"
                      value={editClassroom}
                      onChange={(e) => setEditClassroom(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                      Статусы
                    </label>
                    <select
                      className="su-admin-select"
                      style={{ width: '100%' }}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE (Белсенді)</option>
                      <option value="ARCHIVED">ARCHIVED (Архивтелген)</option>
                    </select>
                  </div>
                </div>

                <div className="su-modal-footer">
                  <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)}>
                    Болдырмау
                  </Button>
                  <Button variant="primary" type="submit" loading={saving}>
                    Сақтау
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
