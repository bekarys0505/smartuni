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
import { api, getDownloadUrl } from '../utils/api';

interface AdminMaterialItem {
  id: string;
  title: string;
  type: string;
  contentUrl: string | null;
  contentText: string | null;
  topicId: string;
  topicTitle: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  completedStudentsCount: number;
  createdAt: string;
}

export const AdminMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<AdminMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (selectedSubject !== 'ALL') params.append('subjectId', selectedSubject);

      const res = await api.get<{ materials: AdminMaterialItem[] }>(
        `/api/admin/materials?${params.toString()}`
      );
      setMaterials(res.materials || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Оқу материалдарын жүктеу кезінде қате орын алды';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [typeFilter, selectedSubject]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMaterials();
  };

  const subjects = Array.from(
    new Map(materials.map((m) => [m.subjectId, { id: m.subjectId, name: m.subjectName }])).values()
  );

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Цифрлық кітапхана және оқу материалдары"
          subtitle="Жүйе бойынша жүктелген барлық дәрістер, зертханалар, видеолар және конспектілер"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Материалдар' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchMaterials} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Жалпы материалдар"
            value={materials.length}
            hint="Дәрістер мен файлдар"
            icon={<Icon name="folder" size={20} />}
          />
          <StatCard
            label="Дәрістер (Lectures)"
            value={materials.filter((m) => m.type === 'LECTURE').length}
            hint="Теориялық модульдер"
            icon={<Icon name="book" size={20} />}
          />
          <StatCard
            label="Практика және лаборатория"
            value={materials.filter((m) => m.type === 'PRACTICE' || m.type === 'LAB').length}
            hint="Зертханалық нұсқаулықтар"
            icon={<Icon name="layers" size={20} />}
          />
          <StatCard
            label="Оқу белсенділігі"
            value={materials.reduce((sum, m) => sum + m.completedStudentsCount, 0)}
            hint="Студенттер оқыған рет"
            icon={<Icon name="check" size={20} />}
          />
        </div>

        {/* Tabs & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={typeFilter}
            onChange={setTypeFilter}
            items={[
              { key: 'ALL', label: 'Барлығы', count: materials.length },
              { key: 'LECTURE', label: 'Дәрістер' },
              { key: 'PRACTICE', label: 'Практика' },
              { key: 'LAB', label: 'Зертханалар' },
              { key: 'DOCUMENT', label: 'Құжаттар' },
            ]}
          />

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Материал атауы бойынша іздеу..."
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

        {/* Materials Table */}
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
          <ErrorState message={error} onRetry={fetchMaterials} />
        ) : materials.length === 0 ? (
          <EmptyState
            title="Оқу материалдары табылмады"
            description="Сүзгі бойынша сәйкес материалдар жоқ."
            icon="folder"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Материал атауы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Түрі</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Пән</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Тақырып</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Оқыған студенттер</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Күні</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{m.title}</strong>
                        {m.contentText && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {m.contentText.slice(0, 60)}...
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant="primary" size="sm">{m.type}</Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {m.subjectName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {m.topicTitle}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#059669' }}>
                        {m.completedStudentsCount} студент
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {new Date(m.createdAt).toLocaleDateString('kk-KZ')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {m.contentUrl ? (
                          <a
                            href={getDownloadUrl(m.contentUrl)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.35rem 0.65rem',
                              background: '#eff6ff',
                              color: '#2563eb',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <Icon name="download" size={14} /> Ашу / Жүктеу
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Мәтіндік дәріс</span>
                        )}
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

export default AdminMaterialsPage;

