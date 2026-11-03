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

interface AdminJoinRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  respondedAt: string | null;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    major: string | null;
  };
  group: {
    id: string;
    name: string;
    subjectName: string;
    subjectCode: string | null;
  };
}

export const AdminRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<AdminJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== 'ALL') params.append('status', activeStatus);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get<{ requests: AdminJoinRequest[] }>(
        `/api/admin/requests?${params.toString()}`
      );
      setRequests(res.requests || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Өтініштерді жүктеу кезінде қателік туындады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeStatus]);

  const handleResolve = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setActionLoadingId(requestId);
    setActionMessage(null);
    try {
      await api.post(`/api/admin/requests/${requestId}/resolve`, { status });
      setActionMessage(status === 'ACCEPTED' ? 'Өтініш сәтті қабылданды!' : 'Өтініш қабылданбады.');
      fetchRequests();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      alert('Өтініш шешімін сақтау кезінде қате орын алды');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Топқа қосылу өтініштерін модерациялау"
          subtitle="Студенттердің топтар мен пәндерге тіркелу өтініштерінің бірыңғай журналы"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Өтініштер' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchRequests} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Action toast */}
        {actionMessage && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '0.875rem' }}>
            ✓ {actionMessage}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Жалпы өтініштер"
            value={requests.length}
            hint="Жүйеге түскен барлық сұраныстар"
            icon={<Icon name="users" size={20} />}
          />
          <StatCard
            label="Қаралуды күтуде"
            value={requests.filter((r) => r.status === 'PENDING').length}
            hint="Шешім қабылдау қажет"
            icon={<Icon name="clock" size={20} />}
          />
          <StatCard
            label="Қабылданғандар"
            value={requests.filter((r) => r.status === 'ACCEPTED').length}
            hint="Топтарға қосылған студенттер"
            icon={<Icon name="check" size={20} />}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={activeStatus}
            onChange={setActiveStatus}
            items={[
              { key: 'ALL', label: 'Барлығы', count: requests.length },
              {
                key: 'PENDING',
                label: 'Күтуде (Pending)',
                count: requests.filter((r) => r.status === 'PENDING').length,
              },
              {
                key: 'ACCEPTED',
                label: 'Қабылданған',
                count: requests.filter((r) => r.status === 'ACCEPTED').length,
              },
              {
                key: 'REJECTED',
                label: 'Қабылданбаған',
                count: requests.filter((r) => r.status === 'REJECTED').length,
              },
            ]}
          />

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px' }}>
            <input
              type="text"
              placeholder="Студент немесе топ атауы бойынша іздеу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            />
            <Button type="submit" variant="primary" size="md">
              <Icon name="search" size={16} /> Іздеу
            </Button>
          </form>
        </div>

        {/* Requests Table */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={28} width="30%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRequests} />
        ) : requests.length === 0 ? (
          <EmptyState
            title="Өтініштер табылмады"
            description="Бұл санатта қаралатын өтініштер жоқ."
            icon="users"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Студент</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Мамандық</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Сұралған топ</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Пән</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Жіберілген күні</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Мәртебесі</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{r.student.fullName}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.student.email}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {r.student.major || 'Белгіленбеген'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {r.group.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                        {r.group.subjectName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {new Date(r.createdAt).toLocaleDateString('kk-KZ')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge
                          variant={
                            r.status === 'ACCEPTED'
                              ? 'success'
                              : r.status === 'PENDING'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {r.status === 'ACCEPTED'
                            ? 'Қабылданды'
                            : r.status === 'PENDING'
                            ? 'Күтуде'
                            : 'Қабылданбады'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {r.status === 'PENDING' ? (
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <Button
                              variant="success"
                              size="sm"
                              loading={actionLoadingId === r.id}
                              onClick={() => handleResolve(r.id, 'ACCEPTED')}
                            >
                              Қабылдау
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={actionLoadingId === r.id}
                              onClick={() => handleResolve(r.id, 'REJECTED')}
                            >
                              Қабылдамау
                            </Button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            {r.respondedAt ? new Date(r.respondedAt).toLocaleDateString('kk-KZ') : 'Қаралды'}
                          </span>
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

export default AdminRequestsPage;

