import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Modal,
  EmptyState,
  ErrorState,
  Skeleton,
  StatCard,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

interface TeacherItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
  teacherProfile?: {
    department: string | null;
    position: string | null;
    _count: { groups: number; tests: number };
  } | null;
}

export const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);
  const [statusToggling, setStatusToggling] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('role', 'TEACHER');
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get<{ users: TeacherItem[]; totalCount: number }>(
        `/api/admin/users?${params.toString()}`
      );
      setTeachers(res.users || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Оқытушылар тізімін жүктеу кезінде қателік туындады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleToggleStatus = async (teacher: TeacherItem) => {
    setStatusToggling(true);
    const newStatus = teacher.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      await api.patch(`/api/admin/users/${teacher.id}/status`, { status: newStatus });
      fetchTeachers();
      if (selectedTeacher?.id === teacher.id) {
        setSelectedTeacher({ ...selectedTeacher, status: newStatus });
      }
    } catch (err: unknown) {
      alert('Мәртебені өзгерту мүмкін болмады');
    } finally {
      setStatusToggling(false);
    }
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Оқытушылар құрамы"
          subtitle="Профессорлық-оқытушылық құрам, кафедралар және педагогикалық жүктеме"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Оқытушылар' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchTeachers} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Жалпы оқытушылар"
            value={teachers.length}
            hint="Кафедра қызметкерлері"
            icon={<Icon name="users" size={20} />}
          />
          <StatCard
            label="Белсенді оқытушылар"
            value={teachers.filter((t) => t.status === 'ACTIVE').length}
            hint="Сабақ беруде"
            icon={<Icon name="check" size={20} />}
          />
          <StatCard
            label="Орташа топтар жүктемесі"
            value="3-4 топ"
            hint="Бір оқытушыға"
            icon={<Icon name="layers" size={20} />}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Оқытушының аты-жөні немесе кафедрасы бойынша іздеу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                background: '#fff',
              }}
            >
              <option value="">Барлық мәртебелер</option>
              <option value="ACTIVE">Белсенді (Active)</option>
              <option value="BLOCKED">Бұғатталған (Blocked)</option>
            </select>
          </div>
        </div>

        {/* Teachers Table */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={28} width="30%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTeachers} />
        ) : teachers.length === 0 ? (
          <EmptyState
            title="Оқытушылар табылмады"
            description="Іздеу критерийлеріне сәйкес оқытушылар тіркелмеген."
            icon="users"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Оқытушы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Кафедра</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Лауазымы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Топтар саны</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Құрастырған тесттері</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Мәртебе</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{t.fullName}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.email}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {t.teacherProfile?.department || 'Ақпараттық жүйелер кафедрасы'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                        {t.teacherProfile?.position || 'Аға оқытушы'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {t.teacherProfile?._count.groups || 0} топ
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {t.teacherProfile?._count.tests || 0} тест
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={t.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                          {t.status === 'ACTIVE' ? 'Белсенді' : 'Бұғатталған'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTeacher(t)}>
                            Жүктемесі
                          </Button>
                          <Button
                            variant={t.status === 'ACTIVE' ? 'danger' : 'success'}
                            size="sm"
                            loading={statusToggling && selectedTeacher?.id === t.id}
                            onClick={() => handleToggleStatus(t)}
                          >
                            {t.status === 'ACTIVE' ? 'Бұғаттау' : 'Қалпына келтіру'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Workload Modal */}
        <Modal
          isOpen={!!selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          title={selectedTeacher ? `Оқытушы жүктемесі: ${selectedTeacher.fullName}` : 'Жүктеме'}
        >
          {selectedTeacher && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div><strong>Аты-жөні:</strong> {selectedTeacher.fullName}</div>
              <div><strong>Email:</strong> {selectedTeacher.email}</div>
              <div><strong>Кафедра:</strong> {selectedTeacher.teacherProfile?.department || 'Ақпараттық технологиялар'}</div>
              <div><strong>Лауазымы:</strong> {selectedTeacher.teacherProfile?.position || 'Аға оқытушы / Профессор'}</div>
              <div><strong>Бекітілген топтар саны:</strong> {selectedTeacher.teacherProfile?._count.groups || 0}</div>
              <div><strong>Жарияланған тесттер:</strong> {selectedTeacher.teacherProfile?._count.tests || 0}</div>
              <div><strong>Тіркелген күні:</strong> {new Date(selectedTeacher.createdAt).toLocaleDateString('kk-KZ')}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="primary" onClick={() => setSelectedTeacher(null)}>
                  Жабу
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
};

export default AdminTeachersPage;

