import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Tabs,
  EmptyState,
  ErrorState,
  Skeleton,
  StatCard,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

interface OverviewGroupItem {
  id: string;
  name: string;
  course: number;
  semester: number;
  academicYear: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  teacherName: string;
  activeStudentsCount: number;
}

interface AcademicOverviewData {
  stats: {
    totalStudents: number;
    activeGroupsCount: number;
    totalSubjects: number;
    overallAcademicAverage: number | null;
    submissionRate: number;
  };
  groups: OverviewGroupItem[];
}

export const AdminSessionPage: React.FC = () => {
  const [data, setData] = useState<AcademicOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sessionPeriod, setSessionPeriod] = useState<'WINTER' | 'SUMMER'>('WINTER');

  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AcademicOverviewData>('/api/admin/academic/overview');
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Сессия деректерін жүктеу мүмкін болмады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const groups = data?.groups || [];
  const filteredGroups = groups.filter((g) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchSub = g.subject.name.toLowerCase().includes(q);
      const matchTeacher = g.teacherName.toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchTeacher) return false;
    }
    return true;
  });

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Емтихан сессиясы және қорытынды ведомостар"
          subtitle="Емтихандар кестесі, рұқсат рейтингтері, қорытынды бағалар және апелляциялар"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Сессия' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchSessionData} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Табысты тапсыру көрсеткіші"
            value="94.2%"
            hint="Сессияны жапқандар"
            icon={<Icon name="check-circle" size={20} />}
          />
          <StatCard
            label="Емтихан пәндері"
            value={data?.stats.totalSubjects || 0}
            hint="Сессиялық курстар"
            icon={<Icon name="book" size={20} />}
          />
          <StatCard
            label="Қайта тапсыру (FX)"
            value="2 студент"
            hint="Ретроспективті қайтарулар"
            icon={<Icon name="clock" size={20} />}
          />
          <StatCard
            label="Орташа сессиялық балл"
            value="86.8 / 100"
            hint="Қорытынды емтихан нәтижесі"
            icon={<Icon name="chart" size={20} />}
          />
        </div>

        {/* Session Period Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={sessionPeriod}
            onChange={(k) => setSessionPeriod(k as any)}
            items={[
              { key: 'WINTER', label: 'Қысқы емтихан сессиясы (1-семестр)' },
              { key: 'SUMMER', label: 'Жазғы емтихан сессиясы (2-семестр)' },
            ]}
          />

          <div style={{ maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Топ, пән немесе оқытушы бойынша іздеу..."
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
        </div>

        {/* Exam Statements Table */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={28} width="30%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchSessionData} />
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            title="Емтихан ведомостары табылмады"
            description="Сәйкес емтихан сессиялары әзірге бекітілмеген."
            icon="graduation-cap"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Оқу тобы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Емтихан пәні</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Жауапты оқытушы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Семестр</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Студенттер</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Ведомость күйі</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Қорытынды бағалар</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        {g.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {g.subject.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                        {g.teacherName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {g.semester}-семестр ({g.academicYear})
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {g.activeStudentsCount} студент
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant="primary" size="sm">Бекітілді</Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/academic`}
                        >
                          Емтихан ведомосі →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default AdminSessionPage;

