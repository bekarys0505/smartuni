import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { api } from '../utils/api';
import { getToken } from '../utils/auth';
import { AppShell } from '../components/layout/AppShell';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/index';
import '../styles/AdminPage.css';

interface SubjectItem {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  createdAt: string;
  groupsCount: number;
  topicsCount: number;
  testsCount: number;
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetSubject, setTargetSubject] = useState<SubjectItem | null>(null);

  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSubjects = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Сессия табылмады. Қайта кіріңіз.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const data = await api.get<{ subjects: SubjectItem[] }>(`/api/admin/subjects${q}`);
      setSubjects(data.subjects || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Пәндерді жүктеу кезінде белгісіз қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code || '');
    setDescription(sub.description || '');
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setBanner(null);

    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (editingSubject) {
        await api.patch(`/api/admin/subjects/${editingSubject.id}`, payload);
        setBanner({ type: 'success', message: 'Пән мәліметтері сәтті жаңартылды' });
      } else {
        await api.post('/api/admin/subjects', payload);
        setBanner({ type: 'success', message: 'Жаңа пән сәтті қосылды' });
      }

      setIsModalOpen(false);
      loadSubjects();
    } catch (err) {
      if (err instanceof Error) {
        setBanner({ type: 'error', message: err.message });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!targetSubject) return;
    setSaving(true);

    try {
      await api.delete(`/api/admin/subjects/${targetSubject.id}`);
      setBanner({ type: 'success', message: `«${targetSubject.name}» пәні сәтті жойылды` });
      setDeleteModalOpen(false);
      setTargetSubject(null);
      loadSubjects();
    } catch (err) {
      if (err instanceof Error) {
        setBanner({ type: 'error', message: err.message });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-admin-page">
        {/* Page Header */}
        <div className="su-admin-header">
          <div>
            <h1 className="su-admin-title">Оқу пәндерін басқару</h1>
            <p className="su-admin-subtitle">
              Университет пәндерінің орталықтандырылған каталогы мен кодтары ({subjects.length} пән)
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Icon name="plus" size={16} />}
            onClick={handleOpenCreateModal}
          >
            Жаңа пән қосу
          </Button>
        </div>

        {banner && (
          <div className={`su-admin-banner su-admin-banner--${banner.type}`}>
            <Icon name={banner.type === 'success' ? 'check-circle' : 'alert-circle'} size={20} />
            <span>{banner.message}</span>
          </div>
        )}

        {error && (
          <div className="su-admin-banner su-admin-banner--error">
            <Icon name="alert-circle" size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="su-admin-filter-bar">
          <div className="su-admin-search-wrap">
            <Icon name="search" size={18} className="su-admin-search-icon" />
            <input
              type="text"
              placeholder="Пән атауы немесе коды бойынша іздеу..."
              className="su-admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Subjects Table */}
        <div className="su-admin-card">
          <div className="su-admin-table-wrap">
            <table className="su-admin-table">
              <thead>
                <tr>
                  <th>Пән атауы</th>
                  <th>Коды</th>
                  <th>Байланысқан деректер</th>
                  <th>Сипаттамасы</th>
                  <th style={{ textAlign: 'right' }}>Әрекеттер</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--su-text-main)' }}>
                        {sub.name}
                      </div>
                    </td>
                    <td>
                      {sub.code ? (
                        <span className="su-badge" style={{ background: '#f1f5f9', color: '#1565c0' }}>
                          {sub.code}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--su-text-muted)' }}>
                        {sub.groupsCount} топ · {sub.topicsCount} тақырып · {sub.testsCount} тест
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--su-text-body)' }}>
                        {sub.description || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="su-admin-actions-cell">
                        <button
                          type="button"
                          className="su-btn-icon-sm"
                          title="Пәнді өңдеу"
                          onClick={() => handleOpenEditModal(sub)}
                        >
                          <Icon name="settings" size={15} />
                        </button>
                        <button
                          type="button"
                          className="su-btn-icon-sm su-btn-icon-sm--danger"
                          title="Пәнді жою"
                          onClick={() => {
                            setTargetSubject(sub);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Icon name="x-circle" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--su-text-muted)' }}>
                      Пәндер табылмады
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="su-modal-overlay">
            <div className="su-modal-container">
              <div className="su-modal-header">
                <h3 className="su-modal-title">
                  {editingSubject ? 'Пән ақпаратын өңдеу' : 'Жаңа пән қосу'}
                </h3>
                <button
                  type="button"
                  className="su-btn-icon-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
              <form onSubmit={handleSaveSubject}>
                <div className="su-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                      Пән атауы *
                    </label>
                    <input
                      type="text"
                      className="su-admin-search-input"
                      style={{ paddingLeft: 12 }}
                      placeholder="Мысалы: Дискретті математика"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                      Пән коды (бірегей)
                    </label>
                    <input
                      type="text"
                      className="su-admin-search-input"
                      style={{ paddingLeft: 12 }}
                      placeholder="Мысалы: MATH201"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                      Сипаттамасы
                    </label>
                    <textarea
                      rows={3}
                      className="su-admin-search-input"
                      style={{ paddingLeft: 12, height: 'auto', resize: 'vertical' }}
                      placeholder="Пән туралы қысқаша ақпарат..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="su-modal-footer">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                    Болдырмау
                  </Button>
                  <Button variant="primary" type="submit" loading={saving}>
                    Сақтау
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModalOpen && targetSubject && (
          <div className="su-modal-overlay">
            <div className="su-modal-container">
              <div className="su-modal-header">
                <h3 className="su-modal-title">Пәнді жоюды растау</h3>
                <button
                  type="button"
                  className="su-btn-icon-sm"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
              <div className="su-modal-body">
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>
                  Сіз шынымен <strong>{targetSubject.name}</strong> ({targetSubject.code || 'Кодсыз'}) пәнін жойғыңыз келе ме?
                </p>
                {targetSubject.groupsCount > 0 || targetSubject.topicsCount > 0 ? (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: 'var(--su-warning-light)',
                      color: 'var(--su-warning-text)',
                      fontSize: '0.85rem',
                    }}
                  >
                    Ескерту: Бұл пәнге байланысты {targetSubject.groupsCount} топ немесе{' '}
                    {targetSubject.topicsCount} тақырып бар. Сервер деректер тұтастығын қорғау үшін жоюды бұғаттайды.
                  </div>
                ) : null}
              </div>
              <div className="su-modal-footer">
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                  Болдырмау
                </Button>
                <Button variant="danger" loading={saving} onClick={handleDeleteSubject}>
                  Жоюды растау
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
