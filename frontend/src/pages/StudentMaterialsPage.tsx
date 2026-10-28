import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  Modal,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api, getDownloadUrl } from '../utils/api';

type MaterialType = 'LECTURE' | 'VIDEO' | 'ADDITIONAL_RESOURCE';
type ProgressStatus = 'UNREAD' | 'STARTED' | 'COMPLETED';

interface MaterialSubject {
  id: string;
  name: string;
  code: string | null;
}

interface MaterialTopic {
  id: string;
  title: string;
  order: number;
}

interface StudentMaterialItem {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  contentUrl: string | null;
  hasTextContent: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  status: ProgressStatus;
  topic: MaterialTopic;
  subject: MaterialSubject;
}

interface StudentMaterialsResponse {
  message: string;
  materials: StudentMaterialItem[];
  subjects: MaterialSubject[];
}

export const StudentMaterialsPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [materials, setMaterials] = useState<StudentMaterialItem[]>([]);
  const [subjects, setSubjects] = useState<MaterialSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal / Preview state
  const [selectedMaterial, setSelectedMaterial] = useState<StudentMaterialItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<StudentMaterialsResponse>('/api/student/materials');
      setMaterials(res.materials || []);
      setSubjects(res.subjects || []);
    } catch (err: any) {
      setError(err.message || 'Оқу материалдарын жүктеу кезінде қате орын алды');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      // Subject filter
      if (selectedSubjectId !== 'ALL' && item.subject.id !== selectedSubjectId) {
        return false;
      }
      // Type filter
      if (selectedType !== 'ALL' && item.type !== selectedType) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inDesc = item.description?.toLowerCase().includes(q) ?? false;
        const inSubject = item.subject.name.toLowerCase().includes(q);
        const inTopic = item.topic.title.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inSubject && !inTopic) {
          return false;
        }
      }
      return true;
    });
  }, [materials, selectedSubjectId, selectedType, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = materials.length;
    const completed = materials.filter((m) => m.status === 'COMPLETED').length;
    const lectures = materials.filter((m) => m.type === 'LECTURE').length;
    const videos = materials.filter((m) => m.type === 'VIDEO').length;
    const resources = materials.filter((m) => m.type === 'ADDITIONAL_RESOURCE').length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, lectures, videos, resources, progressPercent };
  }, [materials]);

  // Helper for type styling
  const getTypeConfig = (type: MaterialType) => {
    switch (type) {
      case 'LECTURE':
        return {
          label: 'Дәріс тезисі',
          icon: 'book' as const,
          badgeVariant: 'primary' as const,
          color: 'var(--su-primary, #2563eb)',
          bg: 'rgba(37, 99, 235, 0.08)',
        };
      case 'VIDEO':
        return {
          label: 'Бейнедәріс',
          icon: 'sparkles' as const,
          badgeVariant: 'warning' as const,
          color: 'var(--su-warning, #d97706)',
          bg: 'rgba(217, 119, 6, 0.08)',
        };
      case 'ADDITIONAL_RESOURCE':
        return {
          label: 'Қосымша материал',
          icon: 'folder' as const,
          badgeVariant: 'info' as const,
          color: 'var(--su-info, #0284c7)',
          bg: 'rgba(2, 132, 199, 0.08)',
        };
    }
  };

  const handleOpenMaterial = async (item: StudentMaterialItem) => {
    setSelectedMaterial(item);

    // If UNREAD, start it
    if (item.status === 'UNREAD') {
      try {
        await api.patch(`/api/student/materials/${item.id}/start`);
        setMaterials((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, status: 'STARTED' } : m)),
        );
        setSelectedMaterial((prev) => (prev ? { ...prev, status: 'STARTED' } : null));
      } catch {
        // Non-critical, ignore
      }
    }
  };

  const handleCompleteMaterial = async () => {
    if (!selectedMaterial) return;
    setActionLoading(true);
    try {
      await api.patch(`/api/student/materials/${selectedMaterial.id}/complete`);
      setMaterials((prev) =>
        prev.map((m) => (m.id === selectedMaterial.id ? { ...m, status: 'COMPLETED' } : m)),
      );
      setSelectedMaterial((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
    } catch (err: any) {
      alert(err.message || 'Материалды аяқтау сәтсіз аяқталды');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell userRole="STUDENT">
      <div className="su-content-container">
        <PageHeader
          title="Менің оқу материалдарым"
          subtitle="Сіз тіркелген барлық пәндер мен сабақтардың бірыңғай оқу ресурстары"
          breadcrumbs={[
            { label: 'Басты бет', path: '/student/dashboard' },
            { label: 'Менің материалдарым' },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMaterials}
            >
              Жаңарту
            </Button>
          }
        />

        {/* 1. Loading State */}
        {loading && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <Skeleton height="90px" />
              <Skeleton height="90px" />
              <Skeleton height="90px" />
              <Skeleton height="90px" />
            </div>
            <Skeleton height="56px" style={{ marginBottom: '24px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Skeleton height="85px" />
              <Skeleton height="85px" />
              <Skeleton height="85px" />
            </div>
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <ErrorState
            title="Материалдарды жүктеу мүмкін болмады"
            message={error}
            onRetry={fetchMaterials}
          />
        )}

        {/* 3. Main Content */}
        {!loading && !error && (
          <>
            {/* KPI Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <Card>
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                    Барлық материалдар
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--su-text-main)' }}>
                    {stats.total}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                    Дәрістер (Тезистер)
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--su-primary)' }}>
                    {stats.lectures}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                    Бейнедәрістер
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--su-warning)' }}>
                    {stats.videos}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                    Қосымша ресурстар
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--su-info)' }}>
                    {stats.resources}
                  </div>
                </CardBody>
              </Card>

              <Card
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.06) 0%, rgba(34, 197, 94, 0.12) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                }}
              >
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginBottom: '4px' }}>
                    Меңгерілгені
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>
                    {stats.completed} <span style={{ fontSize: '15px', fontWeight: 500 }}>({stats.progressPercent}%)</span>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Filters Bar */}
            <Card style={{ marginBottom: '24px' }}>
              <CardBody style={{ padding: '18px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                    alignItems: 'center',
                  }}
                >
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Материал немесе тақырып бойынша іздеу..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: 'var(--su-radius-md, 8px)',
                        border: '1px solid var(--su-border, #e2e8f0)',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--su-bg-surface, #ffffff)',
                        color: 'var(--su-text-main, #1e293b)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--su-text-muted, #94a3b8)',
                        pointerEvents: 'none',
                      }}
                    >
                      <Icon name="search" size={16} />
                    </div>
                  </div>

                  {/* Subject Filter */}
                  <div>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--su-radius-md, 8px)',
                        border: '1px solid var(--su-border, #e2e8f0)',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--su-bg-surface, #ffffff)',
                        color: 'var(--su-text-main, #1e293b)',
                      }}
                    >
                      <option value="ALL">Барлық пәндер ({subjects.length})</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code ? `${s.code} — ` : ''}{s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--su-radius-md, 8px)',
                        border: '1px solid var(--su-border, #e2e8f0)',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--su-bg-surface, #ffffff)',
                        color: 'var(--su-text-main, #1e293b)',
                      }}
                    >
                      <option value="ALL">Барлық түрлері</option>
                      <option value="LECTURE">Тек Дәрістер (Тезистер)</option>
                      <option value="VIDEO">Тек Бейнедәрістер</option>
                      <option value="ADDITIONAL_RESOURCE">Тек Қосымша ресурстар</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--su-radius-md, 8px)',
                        border: '1px solid var(--su-border, #e2e8f0)',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--su-bg-surface, #ffffff)',
                        color: 'var(--su-text-main, #1e293b)',
                      }}
                    >
                      <option value="ALL">Барлық күйлер</option>
                      <option value="COMPLETED">Оқылған (Аяқталған)</option>
                      <option value="STARTED">Оқылу үстінде</option>
                      <option value="UNREAD">Оқылмаған</option>
                    </select>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Materials List */}
            {filteredMaterials.length === 0 ? (
              <EmptyState
                title="Материалдар табылмады"
                description={
                  materials.length === 0
                    ? 'Сіз тіркелген оқу топтарында әзірге ешқандай оқу материалдары жарияланбаған.'
                    : 'Таңдалған сүзгі критерийлеріне сәйкес келетін оқу материалдары жоқ.'
                }
                icon={<Icon name="folder" size={48} />}
                action={
                  (selectedSubjectId !== 'ALL' ||
                    selectedType !== 'ALL' ||
                    selectedStatus !== 'ALL' ||
                    searchQuery) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubjectId('ALL');
                        setSelectedType('ALL');
                        setSelectedStatus('ALL');
                        setSearchQuery('');
                      }}
                    >
                      Сүзгілерді тазарту
                    </Button>
                  )
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredMaterials.map((item) => {
                  const cfg = getTypeConfig(item.type);
                  const isCompleted = item.status === 'COMPLETED';
                  const isStarted = item.status === 'STARTED';

                  return (
                    <Card
                      key={item.id}
                      hoverable
                      style={{
                        border: '1px solid var(--su-border, #e2e8f0)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CardBody style={{ padding: '18px 20px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Left: Icon & Titles */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              flex: '1 1 340px',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleOpenMaterial(item)}
                          >
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                background: cfg.bg,
                                color: cfg.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon name={cfg.icon} size={22} />
                            </div>

                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '4px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Badge variant={cfg.badgeVariant} size="sm">
                                  {cfg.label}
                                </Badge>
                                <Badge variant="neutral" size="sm">
                                  {item.subject.code || item.subject.name}
                                </Badge>
                                <span style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                                  Тақырып #{item.topic.order}: {item.topic.title}
                                </span>
                              </div>

                              <h3
                                style={{
                                  fontSize: '16px',
                                  fontWeight: 600,
                                  color: 'var(--su-text-main)',
                                  margin: '0 0 4px 0',
                                }}
                              >
                                {item.title}
                              </h3>

                              {item.description && (
                                <p
                                  style={{
                                    fontSize: '13px',
                                    color: 'var(--su-text-muted)',
                                    margin: 0,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Status badge & Actions */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginLeft: 'auto',
                            }}
                          >
                            <Badge
                              variant={isCompleted ? 'success' : isStarted ? 'warning' : 'neutral'}
                              size="sm"
                            >
                              {isCompleted ? 'Оқылған' : isStarted ? 'Оқылуда' : 'Оқылмаған'}
                            </Badge>

                            {/* View / Download Direct Button if has file */}
                            {item.contentUrl && (
                              <a
                                href={getDownloadUrl(item.contentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={<Icon name="download" size={14} />}
                                >
                                  Жүктеу
                                </Button>
                              </a>
                            )}

                            {/* Open Modal Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMaterial(item)}
                            >
                              Қарау
                            </Button>

                            {/* Jump to Topic Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Icon name="chevron-right" size={16} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/topics/${item.topic.id}`);
                              }}
                              title="Осы тақырыптың барлық материалдарына өту"
                            />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 4. Material Detail Modal */}
        {selectedMaterial && (
          <Modal
            isOpen={Boolean(selectedMaterial)}
            onClose={() => setSelectedMaterial(null)}
            title={selectedMaterial.title}
            maxWidth="640px"
            footer={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  {selectedMaterial.status === 'COMPLETED' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--su-success, #16a34a)',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <Icon name="check-circle" size={16} /> Бұл оқу материалы меңгерілді
                    </span>
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--su-text-muted)' }}>
                      Материалды танысып болған соң аяқтау батырмасын басыңыз
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedMaterial(null)}
                  >
                    Жабу
                  </Button>

                  {selectedMaterial.status !== 'COMPLETED' && (
                    <Button
                      variant="success"
                      size="sm"
                      loading={actionLoading}
                      onClick={handleCompleteMaterial}
                      icon={<Icon name="check" size={16} />}
                    >
                      Оқуды аяқтадым
                    </Button>
                  )}
                </div>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Type, Subject, and Status Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant={getTypeConfig(selectedMaterial.type).badgeVariant} size="sm">
                  {getTypeConfig(selectedMaterial.type).label}
                </Badge>
                <Badge variant="primary" size="sm">
                  {selectedMaterial.subject.name}
                </Badge>
                <Badge variant="neutral" size="sm">
                  Тақырып #{selectedMaterial.topic.order}: {selectedMaterial.topic.title}
                </Badge>
                <Badge
                  variant={selectedMaterial.status === 'COMPLETED' ? 'success' : 'warning'}
                  size="sm"
                >
                  {selectedMaterial.status === 'COMPLETED' ? 'Аяқталған' : 'Оқылуда'}
                </Badge>
              </div>

              {/* Description */}
              {selectedMaterial.description && (
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--su-text-muted)',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  {selectedMaterial.description}
                </div>
              )}

              {/* External / File resource link */}
              {selectedMaterial.contentUrl && (
                <div
                  style={{
                    padding: '14px 16px',
                    background: 'var(--su-primary-subtle, rgba(37, 99, 235, 0.05))',
                    borderRadius: 'var(--su-radius-md, 8px)',
                    border: '1px solid var(--su-border-light, #e2e8f0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon name="file-text" size={22} style={{ color: 'var(--su-primary)' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--su-text-main)' }}>
                        Тіркелген оқу файлы немесе сыртқы ресурс
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                        Файлды қарау немесе жүктеп алу үшін сілтемені ашыңыз
                      </div>
                    </div>
                  </div>

                  <a
                    href={getDownloadUrl(selectedMaterial.contentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="primary" size="sm" icon={<Icon name="external" size={14} />}>
                      Файлды ашу / Жүктеу
                    </Button>
                  </a>
                </div>
              )}

              {/* Direct Topic Navigation Card */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--su-bg-muted, #f8fafc)',
                  borderRadius: 'var(--su-radius-md, 8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--su-text-muted)' }}>
                  Осы тақырыптың барлық тапсырмалары мен тесттерін көру:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Icon name="chevron-right" size={14} />}
                  onClick={() => {
                    setSelectedMaterial(null);
                    navigate(`/student/topics/${selectedMaterial.topic.id}`);
                  }}
                >
                  Тақырыпқа өту
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
};
