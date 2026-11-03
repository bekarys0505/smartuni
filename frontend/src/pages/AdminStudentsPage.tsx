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

interface StudentItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
  studentProfile?: {
    course: number;
    university?: { name: string };
    faculty?: { name: string };
    major?: { name: string };
    _count: { memberships: number; assignmentSubmissions: number };
  } | null;
}

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected student modal
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [statusToggling, setStatusToggling] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('role', 'STUDENT');
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get<{ users: StudentItem[]; totalCount: number }>(
        `/api/admin/users?${params.toString()}`
      );
      setStudents(res.users || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Студенттер тізімін жүктеу кезінде қателік туындады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleToggleStatus = async (student: StudentItem) => {
    setStatusToggling(true);
    const newStatus = student.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      await api.patch(`/api/admin/users/${student.id}/status`, { status: newStatus });
      fetchStudents();
      if (selectedStudent?.id === student.id) {
        setSelectedStudent({ ...selectedStudent, status: newStatus });
      }
    } catch (err: unknown) {
      alert('Мәртебені өзгерту мүмкін болмады');
    } finally {
      setStatusToggling(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (courseFilter && s.studentProfile && String(s.studentProfile.course) !== courseFilter) {
      return false;
    }
    return true;
  });

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Студенттер контингенті"
          subtitle="Студенттер базасы, курстар, мамандықтар бойынша мониторинг және басқару"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Студенттер' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchStudents} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Жалпы студенттер"
            value={students.length}
            hint="Тіркелген контингент"
            icon={<Icon name="graduation-cap" size={20} />}
          />
          <StatCard
            label="Белсенді мәртебеде"
            value={students.filter((s) => s.status === 'ACTIVE').length}
            hint="Сабаққа қатысушылар"
            icon={<Icon name="check" size={20} />}
          />
          <StatCard
            label="Бұғатталғандар"
            value={students.filter((s) => s.status === 'BLOCKED').length}
            hint="Шектелген есептік жазбалар"
            icon={<Icon name="shield" size={20} />}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Студенттің аты-жөні немесе email бойынша іздеу..."
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

          <div style={{ minWidth: '160px' }}>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                background: '#fff',
              }}
            >
              <option value="">Барлық курстар</option>
              <option value="1">1-курс</option>
              <option value="2">2-курс</option>
              <option value="3">3-курс</option>
              <option value="4">4-курс</option>
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
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

        {/* Students Table */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={28} width="30%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStudents} />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="Студенттер табылмады"
            description="Сүзгі критерийлеріне сәйкес студенттер жоқ."
            icon="graduation-cap"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Студент</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Факультет / Мамандық</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Курс</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Топтары</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Мәртебе</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{s.fullName}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.email}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {s.studentProfile?.major?.name || s.studentProfile?.faculty?.name || 'Белгіленбеген'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {s.studentProfile?.course ? `${s.studentProfile.course}-курс` : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {s.studentProfile?._count.memberships || 0} топ
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                          {s.status === 'ACTIVE' ? 'Белсенді' : 'Бұғатталған'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Button variant="outline" size="sm" onClick={() => setSelectedStudent(s)}>
                            Мәліметтер
                          </Button>
                          <Button
                            variant={s.status === 'ACTIVE' ? 'danger' : 'success'}
                            size="sm"
                            loading={statusToggling && selectedStudent?.id === s.id}
                            onClick={() => handleToggleStatus(s)}
                          >
                            {s.status === 'ACTIVE' ? 'Бұғаттау' : 'Қалпына келтіру'}
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

        {/* Student Details Modal */}
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={selectedStudent ? `Студент карточкасы: ${selectedStudent.fullName}` : 'Мәліметтер'}
        >
          {selectedStudent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div><strong>Аты-жөні:</strong> {selectedStudent.fullName}</div>
              <div><strong>Email:</strong> {selectedStudent.email}</div>
              <div><strong>Телефон:</strong> {selectedStudent.phone || 'Көрсетілмеген'}</div>
              <div><strong>Университет:</strong> {selectedStudent.studentProfile?.university?.name || 'Көкшетау университеті'}</div>
              <div><strong>Факультет:</strong> {selectedStudent.studentProfile?.faculty?.name || 'Ақпараттық технологиялар'}</div>
              <div><strong>Мамандық:</strong> {selectedStudent.studentProfile?.major?.name || 'Ақпараттық жүйелер'}</div>
              <div><strong>Курс:</strong> {selectedStudent.studentProfile?.course || 1}-курс</div>
              <div><strong>Тіркелу күні:</strong> {new Date(selectedStudent.createdAt).toLocaleDateString('kk-KZ')}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="primary" onClick={() => setSelectedStudent(null)}>
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

export default AdminStudentsPage;

