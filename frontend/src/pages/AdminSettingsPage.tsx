import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  Button,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { api } from '../utils/api';

interface UniversitySettings {
  id: string;
  name: string;
  shortName: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  academicYear: string;
  currentSemester: string;
  facultiesCount: number;
  studentsCount: number;
  teachersCount: number;
  faculties: Array<{
    id: string;
    name: string;
    majors: Array<{ id: string; name: string }>;
  }>;
}

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UniversitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ settings: UniversitySettings }>('/api/admin/settings');
      const s = res.settings;
      setSettings(s);
      setName(s.name || '');
      setShortName(s.shortName || '');
      setCode(s.code || '');
      setPhone(s.phone || '');
      setEmail(s.email || '');
      setAddress(s.address || '');
      setWebsite(s.website || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Параметрлерді жүктеу кезінде қате орын алды';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await api.put('/api/admin/settings', {
        name,
        shortName,
        code,
        phone,
        email,
        address,
        website,
      });
      setSaveSuccess(true);
      fetchSettings();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Өзгерістерді сақтау кезінде қателік туындады';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-page-container">
        <PageHeader
          title="Жүйелік параметрлер және университет"
          subtitle="Университеттің ресми деректері, байланыс ақпараты, академиялық күнтізбе және құрылымы"
          breadcrumbs={[{ label: 'Әкімші', path: '/admin/dashboard' }, { label: 'Жүйе параметрлері' }]}
        />

        {loading ? (
          <Card padding="md">
            <Skeleton height={32} width="40%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchSettings} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Left: Settings Form */}
            <Card padding="lg">
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Университет туралы негізгі ақпарат
              </h3>

              {saveSuccess && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '0.875rem' }}>
                  ✓ Университет параметрлері сәтті сақталды!
                </div>
              )}

              {saveError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.875rem' }}>
                  ⚠️ {saveError}
                </div>
              )}

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                    Университеттің толық атауы
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                      Қысқаша атауы
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                      Университет коды
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                      Байланыс телефоны
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                      Ресми Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                    Заңды мекенжайы
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                    Веб-сайт
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <Button type="submit" variant="primary" loading={saving}>
                    Өзгерістерді сақтау
                  </Button>
                </div>
              </form>
            </Card>

            {/* Right: Structure & Academic info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card padding="md">
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Академиялық күнтізбе мәртебесі
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span>Оқу жылы:</span>
                    <strong>{settings?.academicYear || '2026-2027'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span>Ағымдағы кезең:</span>
                    <strong>{settings?.currentSemester || 'Күзгі семестр'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                    <span>Университеттік ID:</span>
                    <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{settings?.id}</span>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Факультеттер мен мамандықтар
                </h4>
                {settings?.faculties && settings.faculties.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {settings.faculties.map((fac) => (
                      <div key={fac.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.9rem' }}>{fac.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Мамандықтар: {fac.majors.map((m) => m.name).join(', ') || 'Тіркелмеген'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    Факультеттер құрылымы базада тіркелген.
                  </p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default AdminSettingsPage;
