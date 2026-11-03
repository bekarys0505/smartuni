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
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

interface AuditLogItem {
  id: string;
  action: string;
  category: string;
  target: string;
  user: string;
  timestamp: string;
  status: string;
}

export const AdminAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ logs: AuditLogItem[] }>('/api/admin/audit-log');
      setLogs(res.logs || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Әрекеттер журналын жүктеу мүмкін болмады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (activeCategory !== 'ALL' && log.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchTarget = log.target.toLowerCase().includes(q);
      const matchUser = log.user.toLowerCase().includes(q);
      if (!matchAction && !matchTarget && !matchUser) return false;
    }
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'AUTH':
        return <Badge variant="primary" size="sm">Аутентификация</Badge>;
      case 'ACADEMIC':
        return <Badge variant="info" size="sm">Академиялық</Badge>;
      case 'ASSESSMENT':
        return <Badge variant="warning" size="sm">Тестілеу</Badge>;
      case 'ATTENDANCE':
        return <Badge variant="success" size="sm">Қатысу</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{cat}</Badge>;
    }
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Уақыты,Әрекет,Санаты,Нысан,Пайдаланушы,Мәртебесі']
        .concat(
          filteredLogs.map(
            (l) =>
              `"${new Date(l.timestamp).toLocaleString('kk-KZ')}","${l.action}","${l.category}","${l.target}","${l.user}","${l.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartuni_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Жүйелік әрекеттер журналы (Audit Log)"
          subtitle="Қауіпсіздік логтары, жүйеге кіру, тапсырмалар мен бағалау оқиғаларының аудиті"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Әрекеттер журналы' }]}
          actions={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" onClick={fetchLogs} loading={loading}>
                <Icon name="refresh" size={16} /> Жаңарту
              </Button>
              <Button variant="primary" size="sm" onClick={handleExport}>
                <Icon name="download" size={16} /> CSV Экспорттау
              </Button>
            </div>
          }
        />

        {/* Tabs & Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={activeCategory}
            onChange={setActiveCategory}
            items={[
              { key: 'ALL', label: 'Барлық оқиғалар', count: logs.length },
              {
                key: 'ACADEMIC',
                label: 'Тапсырмалар',
                count: logs.filter((l) => l.category === 'ACADEMIC').length,
              },
              {
                key: 'ASSESSMENT',
                label: 'Тесттер',
                count: logs.filter((l) => l.category === 'ASSESSMENT').length,
              },
              {
                key: 'ATTENDANCE',
                label: 'Сабаққа қатысу',
                count: logs.filter((l) => l.category === 'ATTENDANCE').length,
              },
              {
                key: 'AUTH',
                label: 'Пайдаланушылар',
                count: logs.filter((l) => l.category === 'AUTH').length,
              },
            ]}
          />

          <div style={{ maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Әрекет, нысан немесе пайдаланушы бойынша іздеу..."
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

        {/* Audit Log Table */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={28} width="30%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={36} />
              <Skeleton height={36} />
              <Skeleton height={36} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchLogs} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="Журнал жазбалары табылмады"
            description="Таңдалған сүзгі критерийлері бойынша журналда оқиғалар жоқ."
            icon="shield"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Уақыты</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Әрекет</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Санаты</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Нысан / Мазмұн</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Орындаушы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Мәртебесі</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString('kk-KZ')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {getCategoryBadge(log.category)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {log.target}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 500 }}>
                        {log.user}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge
                          variant={
                            log.status === 'ACTIVE' || log.status === 'SUBMITTED' || log.status === 'GRADED' || log.status === 'PRESENT'
                              ? 'success'
                              : log.status === 'ABSENT' || log.status === 'BLOCKED'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {log.status}
                        </Badge>
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

export default AdminAuditLogPage;

