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

interface AdminTestItem {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  status: string;
  maxScore: number;
  scheduledAt: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  teacherName: string;
  questionsCount: number;
  attemptsCount: number;
  createdAt: string;
}

export const AdminTestsPage: React.FC = () => {
  const [tests, setTests] = useState<AdminTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (selectedSubject !== 'ALL') params.append('subjectId', selectedSubject);

      const res = await api.get<{ tests: AdminTestItem[] }>(
        `/api/admin/tests?${params.toString()}`
      );
      setTests(res.tests || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Тесттер тізімін жүктеу кезінде қателік туындады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [statusFilter, selectedSubject]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTests();
  };

  const subjects = Array.from(
    new Map(tests.map((t) => [t.subjectId, { id: t.subjectId, name: t.subjectName }])).values()
  );

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Тестілеу қоры және мониторинг"
          subtitle="Орталықтандырылған тесттер каталогы, сұрақтар саны, студенттер әрекеті және статус"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Тесттер' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchTests} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Жалпы тесттер"
            value={tests.length}
            hint="Барлық пәндер бойынша"
            icon={<Icon name="check-circle" size={20} />}
          />
          <StatCard
            label="Белсенді тесттер"
            value={tests.filter((t) => t.status === 'PUBLISHED' || t.status === 'ACTIVE').length}
            hint="Студенттерге ашық"
            icon={<Icon name="check" size={20} />}
          />
          <StatCard
            label="Студенттер әрекеттері"
            value={tests.reduce((sum, t) => sum + t.attemptsCount, 0)}
            hint="Тапсырылған рет"
            icon={<Icon name="users" size={20} />}
          />
          <StatCard
            label="Орташа уақыт"
            value="15-20 мин"
            hint="Тест ұзақтығы"
            icon={<Icon name="clock" size={20} />}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={statusFilter}
            onChange={setStatusFilter}
            items={[
              { key: 'ALL', label: 'Барлығы', count: tests.length },
              { key: 'PUBLISHED', label: 'Жарияланғандар' },
              { key: 'DRAFT', label: 'Жобалар (Draft)' },
              { key: 'ARCHIVED', label: 'Мұрағат' },
            ]}
          />

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Тест атауы бойынша іздеу..."
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

            <div style={{ minWidth: '200px' }}>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  background: '#fff',
                }}
              >
                <option value="ALL">Барлық пәндер</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="primary" size="md">
              <Icon name="search" size={16} /> Іздеу
            </Button>
          </form>
        </div>

        {/* Tests Table */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={28} width="30%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTests} />
        ) : tests.length === 0 ? (
          <EmptyState
            title="Тесттер табылмады"
            description="Сүзгі критерийлеріне сәйкес тесттер жоқ."
            icon="check-circle"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Тест атауы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Пән</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Оқытушы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Ұзақтығы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Сұрақтар</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Тапсырулар</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Мәртебесі</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Күні</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{t.title}</strong>
                        {t.description && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {t.description.slice(0, 50)}...
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {t.subjectName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                        {t.teacherName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        ⏱ {t.durationMinutes} мин
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2563eb', fontWeight: 600 }}>
                        {t.questionsCount} сұрақ
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#059669' }}>
                        {t.attemptsCount} әрекет
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge
                          variant={
                            t.status === 'PUBLISHED'
                              ? 'success'
                              : t.status === 'DRAFT'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {t.status === 'PUBLISHED' ? 'Жарияланды' : t.status === 'DRAFT' ? 'Жоба' : t.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {new Date(t.createdAt).toLocaleDateString('kk-KZ')}
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

export default AdminTestsPage;

