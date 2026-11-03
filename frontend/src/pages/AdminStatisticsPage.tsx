import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  Button,
  ErrorState,
  Skeleton,
  StatCard,
  ProgressBar,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

interface PlatformStats {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  totalSubjects: number;
  totalMaterials: number;
  totalAssignments: number;
  totalSubmissions: number;
  totalTests: number;
  totalAttempts: number;
  attendanceRate: number;
  submissionRate: number;
}

export const AdminStatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ stats: PlatformStats }>('/api/admin/statistics');
      setStats(res.stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Статистика деректерін жүктеу мүмкін болмады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Платформа статистикасы және KPI"
          subtitle="Жүйелік белсенділік, пайдаланушылар көрсеткіштері, сабаққа қатысу және үлгерім аналитикасы"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Статистика' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchStats} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} padding="md">
                <Skeleton height={20} width="50%" />
                <div style={{ margin: '0.75rem 0' }}>
                  <Skeleton height={32} width="40%" />
                </div>
                <Skeleton height={14} width="80%" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStats} />
        ) : stats ? (
          <>
            {/* Top KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard
                label="Студенттер"
                value={stats.totalStudents}
                hint="Тіркелген белсенді контингент"
                icon={<Icon name="graduation-cap" size={20} />}
              />
              <StatCard
                label="Оқытушылар"
                value={stats.totalTeachers}
                hint="Профессорлық-оқытушылық құрам"
                icon={<Icon name="users" size={20} />}
              />
              <StatCard
                label="Академиялық топтар"
                value={stats.totalGroups}
                hint="Курстар бойынша топтар"
                icon={<Icon name="layers" size={20} />}
              />
              <StatCard
                label="Пәндер каталогы"
                value={stats.totalSubjects}
                hint="Бекітілген оқу пәндері"
                icon={<Icon name="book" size={20} />}
              />
            </div>

            {/* Academic Content & Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard
                label="Оқу материалдары"
                value={stats.totalMaterials}
                hint="Дәрістер мен файлдар"
                icon={<Icon name="folder" size={20} />}
              />
              <StatCard
                label="Тапсырмалар"
                value={stats.totalAssignments}
                hint="Берілген жұмыстар"
                icon={<Icon name="file-text" size={20} />}
              />
              <StatCard
                label="Тапсырылған есептер"
                value={stats.totalSubmissions}
                hint="Студенттердің жауаптары"
                icon={<Icon name="check" size={20} />}
              />
              <StatCard
                label="Тестілеу қоры"
                value={`${stats.totalTests} тест (${stats.totalAttempts} рет)`}
                hint="Өткізілген тестілеулер"
                icon={<Icon name="check-circle" size={20} />}
              />
            </div>

            {/* Performance Ratios */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <Card padding="lg">
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Сабаққа қатысу көрсеткіші (Attendance Rate)
                </h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>
                  {stats.attendanceRate}%
                </div>
                <ProgressBar value={stats.attendanceRate} variant="success" size="lg" />
                <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                  Электронды журналдағы қатысу белгілерінің жалпы арақатынасы бойынша есептелді.
                </p>
              </Card>

              <Card padding="lg">
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Тапсырмаларды орындау белсенділігі
                </h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.5rem' }}>
                  {stats.submissionRate}%
                </div>
                <ProgressBar value={stats.submissionRate} variant="primary" size="lg" />
                <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                  Студенттердің тапсырмаларды уақытылы орындауы мен жүктеу коэффициенті.
                </p>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
};

export default AdminStatisticsPage;
