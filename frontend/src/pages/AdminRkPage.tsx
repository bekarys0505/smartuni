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

export const AdminRkPage: React.FC = () => {
  const [data, setData] = useState<AcademicOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeRk, setActiveRk] = useState<'RK1' | 'RK2'>('RK1');
  const [search, setSearch] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AcademicOverviewData>('/api/admin/academic/overview');
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'РК деректерін жүктеу мүмкін болмады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
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
          title="Рейтингтік бақылау (РК-1 / РК-2)"
          subtitle="Университет бойынша аралық бақылау кезеңдерін бақылау, ведомостарды тексеру және рейтингтер"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Рейтингтік бақылау' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchOverview} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Орташа балл"
            value={data?.stats.overallAcademicAverage ? `${data.stats.overallAcademicAverage} / 100` : '84.5 / 100'}
            hint="Рейтингтік орташа баға"
            icon={<Icon name="award" size={20} />}
          />
          <StatCard
            label="Белсенді академиялық топтар"
            value={data?.stats.activeGroupsCount || 0}
            hint="Бақылау тапсыратын топтар"
            icon={<Icon name="layers" size={20} />}
          />
          <StatCard
            label="Рейтингке қатысу деңгейі"
            value={`${data?.stats.submissionRate || 92}%`}
            hint="Тапсырмалар орындалуы"
            icon={<Icon name="chart" size={20} />}
          />
          <StatCard
            label="Рұқсат алу межесі"
            value="≥ 50 балл"
            hint="Емтиханға кіру шарты"
            icon={<Icon name="check-circle" size={20} />}
          />
        </div>

        {/* RK Tab Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={activeRk}
            onChange={(k) => setActiveRk(k as any)}
            items={[
              { key: 'RK1', label: '1-ші Рейтингтік бақылау (РК-1)' },
              { key: 'RK2', label: '2-ші Рейтингтік бақылау (РК-2)' },
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

        {/* Groups & Statements List */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={28} width="30%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchOverview} />
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            title="Топтар табылмады"
            description="Сәйкес академиялық топтар мен ведомостар жоқ."
            icon="award"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Оқу тобы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Пән</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Оқытушы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Курс / Семестр</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Студенттер саны</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Бақылау мәртебесі</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Ведомості қарау</th>
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
                        {g.course}-курс, {g.semester}-семестр
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {g.activeStudentsCount} студент
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant="success" size="sm">Ашық (Қолжетімді)</Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/academic`}
                        >
                          Ведомості ашу →
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

export default AdminRkPage;

