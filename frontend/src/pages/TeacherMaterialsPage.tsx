import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

interface TeacherSubject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  topicsCount: number;
  groupsCount: number;
}

interface TeacherTopic {
  id: string;
  title: string;
  description: string | null;
  order: number;
  materialsCount: number;
  assignmentsCount: number;
  testsCount: number;
}

interface MaterialItem {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  type: MaterialType;
  contentUrl: string | null;
  contentText: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const TeacherMaterialsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSubjectId = searchParams.get('subjectId') || '';
  const initialTopicId = searchParams.get('topicId') || '';

  // Data states
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [topics, setTopics] = useState<TeacherTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Filter & Search states
  const [typeFilter, setTypeFilter] = useState<'ALL' | MaterialType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading & error states
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<MaterialType>('LECTURE');
  const [formContentText, setFormContentText] = useState('');
  const [formContentUrl, setFormContentUrl] = useState('');
  const [formOrder, setFormOrder] = useState<number | ''>('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // File upload state in modal
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Expanded text content modal state
  const [viewingMaterial, setViewingMaterial] = useState<MaterialItem | null>(null);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // 1. Function definitions
  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    setError(null);
    try {
      const data = await api.get<{ subjects: TeacherSubject[] }>('/api/teacher/subjects');
      const list = data.subjects || [];
      setSubjects(list);

      // Pick default subject if none selected
      if (!selectedSubjectId && list.length > 0) {
        setSelectedSubjectId(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Пәндерді жүктеу сәтсіз аяқталды');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    setLoadingTopics(true);
    try {
      const data = await api.get<{ topics: TeacherTopic[] }>(`/api/teacher/subjects/${subjectId}/topics`);
      const list = data.topics || [];
      setTopics(list);

      // Verify or set selected topic
      if (selectedTopicId) {
        const exists = list.some((t) => t.id === selectedTopicId);
        if (!exists) {
          setSelectedTopicId(list.length > 0 ? list[0].id : '');
        }
      } else if (list.length > 0) {
        setSelectedTopicId(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Тақырыптарды жүктеу сәтсіз аяқталды');
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchMaterials = async (topicId: string) => {
    setLoadingMaterials(true);
    setActionError(null);
    try {
      const data = await api.get<{ materials: MaterialItem[] }>(`/api/teacher/topics/${topicId}/materials`);
      setMaterials(data.materials || []);
    } catch (err: any) {
      setActionError(err.message || 'Материалдарды жүктеу сәтсіз аяқталды');
    } finally {
      setLoadingMaterials(false);
    }
  };

  // 2. Fetch Teacher Subjects on Mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // 3. Fetch Topics when selectedSubjectId changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setTopics([]);
      setSelectedTopicId('');
      return;
    }

    fetchTopics(selectedSubjectId);
  }, [selectedSubjectId]);

  // 4. Fetch Materials when selectedTopicId changes
  useEffect(() => {
    if (!selectedTopicId) {
      setMaterials([]);
      return;
    }

    // Keep URL search params in sync
    setSearchParams({
      subjectId: selectedSubjectId,
      topicId: selectedTopicId,
    });

    fetchMaterials(selectedTopicId);
  }, [selectedTopicId]);

  // Subject change handler
  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId);
    setSelectedTopicId('');
    setSearchParams({ subjectId: newSubjectId });
  };

  // Topic change handler
  const handleTopicChange = (newTopicId: string) => {
    setSelectedTopicId(newTopicId);
    setSearchParams({ subjectId: selectedSubjectId, topicId: newTopicId });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingMaterial(null);
    setFormTitle('');
    setFormDescription('');
    setFormType('LECTURE');
    setFormContentText('');
    setFormContentUrl('');
    setFormOrder(materials.length + 1);
    setUploadedFileName(null);
    setUploadError(null);
    setActionError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (material: MaterialItem) => {
    setEditingMaterial(material);
    setFormTitle(material.title);
    setFormDescription(material.description || '');
    setFormType(material.type);
    setFormContentText(material.contentText || '');
    setFormContentUrl(material.contentUrl || '');
    setFormOrder(material.order);

    if (material.contentUrl && material.contentUrl.startsWith('/api/files/')) {
      const parts = material.contentUrl.split('/');
      setUploadedFileName(parts[parts.length - 1]);
    } else {
      setUploadedFileName(null);
    }

    setUploadError(null);
    setActionError(null);
    setIsFormModalOpen(true);
  };

  // Handle File Input and Upload via api.upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Файл көлемі 25 МБ-тан аспауы тиіс');
      return;
    }

    setUploadingFile(true);
    setUploadError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          // Extract pure base64 without prefix if needed
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await api.upload<{ url: string; fileName?: string; originalName?: string }>(
        '/api/upload',
        {
          fileName: file.name,
          fileBase64: base64,
          fileSize: file.size,
        },
      );

      setFormContentUrl(res.url);
      setUploadedFileName(file.name);
    } catch (err: any) {
      setUploadError(err.message || 'Файлды жүктеу сәтсіз аяқталды');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveUploadedFile = () => {
    setFormContentUrl('');
    setUploadedFileName(null);
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) return;

    if (!formTitle.trim()) {
      setActionError('Материал атауын толтырыңыз');
      return;
    }

    setFormSubmitting(true);
    setActionError(null);

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      type: formType,
      contentText: formContentText.trim() || undefined,
      contentUrl: formContentUrl.trim() || undefined,
      order: formOrder !== '' ? Number(formOrder) : undefined,
    };

    try {
      if (editingMaterial) {
        await api.patch(`/api/teacher/materials/${editingMaterial.id}`, payload);
      } else {
        await api.post(`/api/teacher/topics/${selectedTopicId}/materials`, payload);
      }
      setIsFormModalOpen(false);
      await fetchMaterials(selectedTopicId);
    } catch (err: any) {
      setActionError(err.message || 'Материалды сақтау қатесі');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (material: MaterialItem) => {
    setMaterialToDelete(material);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/api/teacher/materials/${materialToDelete.id}`);
      setIsDeleteModalOpen(false);
      setMaterialToDelete(null);
      await fetchMaterials(selectedTopicId);
    } catch (err: any) {
      alert(err.message || 'Материалды өшіру сәтсіз аяқталды');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Reorder Material (Move Up / Down)
  const handleMoveMaterial = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= materials.length) return;

    const newMaterials = [...materials];
    const temp = newMaterials[index];
    newMaterials[index] = newMaterials[targetIndex];
    newMaterials[targetIndex] = temp;

    // Optimistic UI update
    setMaterials(newMaterials);

    try {
      const materialIds = newMaterials.map((m) => m.id);
      await api.put(`/api/teacher/topics/${selectedTopicId}/materials/reorder`, { materialIds });
      await fetchMaterials(selectedTopicId);
    } catch (err: any) {
      alert(err.message || 'Материалдар ретін жаңарту қатесі');
      await fetchMaterials(selectedTopicId);
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  const getTypeBadge = (type: MaterialType) => {
    switch (type) {
      case 'LECTURE':
        return <Badge variant="primary" size="sm">📘 Дәріс</Badge>;
      case 'VIDEO':
        return <Badge variant="warning" size="sm">🎥 Бейнедәріс</Badge>;
      case 'ADDITIONAL_RESOURCE':
        return <Badge variant="neutral" size="sm">📎 Қосымша ресурс</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container" style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <PageHeader
          title="Оқу материалдарын басқару"
          subtitle="Дәрістер, бейне сабақтар, әдістемелік файлдар мен сыртқы ресурстарды басқару"
          breadcrumbs={[
            { label: 'Басты бет', path: '/teacher/dashboard' },
            {
              label: selectedSubject ? selectedSubject.name : 'Тақырыптар',
              path: selectedSubjectId ? `/teacher/topics?subjectId=${selectedSubjectId}` : '/teacher/topics',
            },
            { label: selectedTopic ? selectedTopic.title : 'Материалдар' },
          ]}
          actions={
            <Button
              variant="primary"
              icon={<Icon name="plus" size={16} />}
              onClick={handleOpenCreateModal}
              disabled={!selectedTopicId || loadingMaterials}
            >
              Жаңа материал
            </Button>
          }
        />

        {/* Selection Bar (Subject & Topic Dropdowns) */}
        <Card style={{ marginBottom: '24px' }}>
          <CardBody style={{ padding: '16px 20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              {/* Subject Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="book" size={20} style={{ color: 'var(--su-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--su-text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    ПӘН:
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    disabled={loadingSubjects || subjects.length === 0}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--su-radius-md)',
                      border: '1px solid var(--su-border)',
                      background: 'var(--su-bg-surface)',
                      color: 'var(--su-text-main)',
                      fontSize: '14px',
                      fontWeight: 500,
                      outline: 'none',
                    }}
                  >
                    {subjects.length === 0 && <option value="">Пәндер табылмады</option>}
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''} — {s.topicsCount} тақырып
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="layers" size={20} style={{ color: 'var(--su-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--su-text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    ТАҚЫРЫП:
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    disabled={loadingTopics || topics.length === 0}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--su-radius-md)',
                      border: '1px solid var(--su-border)',
                      background: 'var(--su-bg-surface)',
                      color: 'var(--su-text-main)',
                      fontSize: '14px',
                      fontWeight: 500,
                      outline: 'none',
                    }}
                  >
                    {topics.length === 0 && (
                      <option value="">
                        {loadingTopics ? 'Жүктелуде...' : 'Бұл пәнде тақырып жоқ'}
                      </option>
                    )}
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.order} {t.title} ({t.materialsCount} материал)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick jump to Topics Page */}
            {selectedSubjectId && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--su-border-light)',
                  fontSize: '13px',
                  color: 'var(--su-text-muted)',
                }}
              >
                <div>
                  <span>
                    Таңдалған тақырып: <strong>{selectedTopic ? selectedTopic.title : 'Таңдалмаған'}</strong>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Icon name="chevron-right" size={14} />}
                  onClick={() => navigate(`/teacher/topics?subjectId=${selectedSubjectId}`)}
                >
                  Тақырыптарды реттеу бетіне өту
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Global Error Banner */}
        {error && (
          <div style={{ marginBottom: '24px' }}>
            <ErrorState title="Қате туындады" message={error} onRetry={fetchSubjects} />
          </div>
        )}

        {/* Type Filter & Search Bar */}
        {selectedTopicId && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant={typeFilter === 'ALL' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('ALL')}
              >
                Барлығы ({materials.length})
              </Button>
              <Button
                variant={typeFilter === 'LECTURE' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('LECTURE')}
                icon={<Icon name="book" size={14} />}
              >
                Дәрістер ({materials.filter((m) => m.type === 'LECTURE').length})
              </Button>
              <Button
                variant={typeFilter === 'VIDEO' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('VIDEO')}
                icon={<Icon name="external" size={14} />}
              >
                Бейнелер ({materials.filter((m) => m.type === 'VIDEO').length})
              </Button>
              <Button
                variant={typeFilter === 'ADDITIONAL_RESOURCE' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('ADDITIONAL_RESOURCE')}
                icon={<Icon name="folder" size={14} />}
              >
                Ресурстар ({materials.filter((m) => m.type === 'ADDITIONAL_RESOURCE').length})
              </Button>
            </div>

            {/* Search Input */}
            <div style={{ minWidth: '240px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Материалдарды іздеу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--su-radius-md)',
                  border: '1px solid var(--su-border)',
                  background: 'var(--su-bg-surface)',
                  color: 'var(--su-text-main)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loadingMaterials && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Skeleton height="88px" />
            <Skeleton height="88px" />
            <Skeleton height="88px" />
          </div>
        )}

        {/* Empty State: No Topic */}
        {!loadingMaterials && !selectedTopicId && (
          <Card>
            <CardBody style={{ padding: '48px 24px', textAlign: 'center' }}>
              <EmptyState
                icon="layers"
                title="Тақырып таңдалмаған"
                description="Материалдарды көру немесе жаңасын қосу үшін алдымен жоғарыдан пән мен тақырыпты таңдаңыз."
              />
            </CardBody>
          </Card>
        )}

        {/* Empty State: No Materials in selected topic */}
        {!loadingMaterials && selectedTopicId && materials.length === 0 && (
          <Card>
            <CardBody style={{ padding: '48px 24px', textAlign: 'center' }}>
              <EmptyState
                icon="folder"
                title="Оқу материалдары жоқ"
                description={`«${selectedTopic?.title || 'Бұл тақырып'}» бойынша әзірге оқу материалдары жүктелмеген.`}
                action={
                  <Button
                    variant="primary"
                    icon={<Icon name="plus" size={16} />}
                    onClick={handleOpenCreateModal}
                  >
                    Алғашқы материалды қосу
                  </Button>
                }
              />
            </CardBody>
          </Card>
        )}

        {/* Materials List */}
        {!loadingMaterials && selectedTopicId && materials.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredMaterials.length === 0 ? (
              <Card>
                <CardBody style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--su-text-muted)', fontSize: '14px' }}>
                    Таңдалған сүзгі бойынша материалдар табылмады
                  </div>
                </CardBody>
              </Card>
            ) : (
              filteredMaterials.map((material) => {
                const globalIndex = materials.findIndex((m) => m.id === material.id);
                const hasFileOrUrl = Boolean(material.contentUrl);
                const isLocalFile = material.contentUrl?.startsWith('/api/files/');
                const hasText = Boolean(material.contentText);

                return (
                  <Card
                    key={material.id}
                    hoverable
                    style={{
                      border: '1px solid var(--su-border)',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <CardBody style={{ padding: '18px 20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* Main info */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1', minWidth: '280px' }}>
                          {/* Order index pill */}
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: 'var(--su-radius-md)',
                              background: 'var(--su-bg-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              color: 'var(--su-primary)',
                              flexShrink: 0,
                            }}
                          >
                            #{material.order}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: '16px',
                                  fontWeight: 600,
                                  color: 'var(--su-text-main)',
                                }}
                              >
                                {material.title}
                              </h3>
                              {getTypeBadge(material.type)}
                            </div>

                            {material.description && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '13px',
                                  color: 'var(--su-text-muted)',
                                  lineHeight: 1.5,
                                }}
                              >
                                {material.description}
                              </p>
                            )}

                            {/* Attachments / Content preview */}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {hasText && (
                                <button
                                  type="button"
                                  onClick={() => setViewingMaterial(material)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    borderRadius: 'var(--su-radius-sm)',
                                    background: 'var(--su-bg-muted)',
                                    border: '1px solid var(--su-border-light)',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: 'var(--su-text-main)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Icon name="file-text" size={14} /> Мәтінді оқу
                                </button>
                              )}

                              {hasFileOrUrl && (
                                <a
                                  href={getDownloadUrl(material.contentUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    borderRadius: 'var(--su-radius-sm)',
                                    background: 'rgba(59, 130, 246, 0.08)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: 'var(--su-primary)',
                                    textDecoration: 'none',
                                  }}
                                >
                                  <Icon name={isLocalFile ? 'download' : 'external'} size={14} />
                                  {isLocalFile ? 'Тіркелген файл' : 'Сыртқы ресурс сілтемесі'}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Reorder Buttons */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<span style={{ fontWeight: 700, fontSize: '13px' }}>↑</span>}
                              disabled={globalIndex === 0}
                              onClick={() => handleMoveMaterial(globalIndex, 'up')}
                              title="Жоғары жылжыту"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<span style={{ fontWeight: 700, fontSize: '13px' }}>↓</span>}
                              disabled={globalIndex === materials.length - 1}
                              onClick={() => handleMoveMaterial(globalIndex, 'down')}
                              title="Төмен жылжыту"
                            />
                          </div>

                          {/* Edit button */}
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Icon name="file-text" size={14} />}
                            onClick={() => handleOpenEditModal(material)}
                          >
                            Өңдеу
                          </Button>

                          {/* Delete button */}
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Icon name="x" size={14} />}
                            onClick={() => handleOpenDeleteModal(material)}
                          >
                            Өшіру
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Modal: Create or Edit Material */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingMaterial ? 'Материалды өңдеу' : 'Жаңа оқу материалы'}
          maxWidth="680px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                variant="secondary"
                onClick={() => setIsFormModalOpen(false)}
                disabled={formSubmitting}
              >
                Бас тарту
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitForm}
                loading={formSubmitting}
                disabled={uploadingFile}
              >
                {editingMaterial ? 'Сақтау' : 'Қосу'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {actionError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--su-radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--su-danger)',
                  fontSize: '13px',
                }}
              >
                {actionError}
              </div>
            )}

            {/* Title */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--su-text-main)',
                }}
              >
                Материал атауы *
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Мысалы: 1-дәріс: Кіріспе және негізгі ұғымдар"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--su-radius-md)',
                  border: '1px solid var(--su-border)',
                  background: 'var(--su-bg-surface)',
                  color: 'var(--su-text-main)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Type & Order */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--su-text-main)',
                  }}
                >
                  Материал түрі *
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as MaterialType)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    color: 'var(--su-text-main)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="LECTURE">📘 Дәріс (LECTURE)</option>
                  <option value="VIDEO">🎥 Бейнедәріс (VIDEO)</option>
                  <option value="ADDITIONAL_RESOURCE">📎 Қосымша ресурс (ADDITIONAL_RESOURCE)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--su-text-main)',
                  }}
                >
                  Реттік нөмірі (Order)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formOrder}
                  onChange={(e) => setFormOrder(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Автоматты түрде"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    color: 'var(--su-text-main)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--su-text-main)',
                }}
              >
                Қысқаша сипаттамасы
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Студенттерге арналған нұсқаулық немесе тақырып мазмұны"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--su-radius-md)',
                  border: '1px solid var(--su-border)',
                  background: 'var(--su-bg-surface)',
                  color: 'var(--su-text-main)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Text Content */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--su-text-main)',
                }}
              >
                Дәріс мәтіні / Конспект (Content Text)
              </label>
              <textarea
                value={formContentText}
                onChange={(e) => setFormContentText(e.target.value)}
                rows={5}
                placeholder="Дәрістің толық мәтіні, формулалар, анықтамалар немесе тапсырма алдындағы нұсқаулық..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--su-radius-md)',
                  border: '1px solid var(--su-border)',
                  background: 'var(--su-bg-surface)',
                  color: 'var(--su-text-main)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
              />
            </div>

            {/* File Upload or External Resource URL */}
            <div
              style={{
                border: '1px solid var(--su-border)',
                borderRadius: 'var(--su-radius-md)',
                padding: '16px',
                background: 'var(--su-bg-muted)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px', color: 'var(--su-text-main)' }}>
                Файл немесе Сыртқы ресурс сілтемесі
              </div>

              {/* Upload Input */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--su-text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  1. Файл жүктеу (PDF, DOCX, PPTX, MP4, т.б.):
                </label>

                {uploadedFileName ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--su-bg-surface)',
                      border: '1px solid var(--su-border)',
                      borderRadius: 'var(--su-radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <Icon name="check-circle" size={16} style={{ color: 'var(--su-success)' }} />
                      <span style={{ fontWeight: 500 }}>{uploadedFileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Icon name="x" size={14} />}
                      onClick={handleRemoveUploadedFile}
                    >
                      Өшіру
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      style={{ fontSize: '13px' }}
                    />
                    {uploadingFile && (
                      <span style={{ fontSize: '12px', color: 'var(--su-primary)', marginLeft: '10px' }}>
                        Жүктелуде...
                      </span>
                    )}
                  </div>
                )}

                {uploadError && (
                  <div style={{ fontSize: '12px', color: 'var(--su-danger)', marginTop: '4px' }}>
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Or Direct URL Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--su-text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  2. Немесе сыртқы сілтеме (YouTube, Google Drive, веб-сайт):
                </label>
                <input
                  type="text"
                  value={formContentUrl}
                  onChange={(e) => {
                    setFormContentUrl(e.target.value);
                    if (!e.target.value.startsWith('/api/files/')) {
                      setUploadedFileName(null);
                    }
                  }}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    color: 'var(--su-text-main)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Modal: View Material Content (Preview) */}
        {viewingMaterial && (
          <Modal
            isOpen={Boolean(viewingMaterial)}
            onClose={() => setViewingMaterial(null)}
            title={viewingMaterial.title}
            maxWidth="680px"
            footer={
              <Button variant="secondary" onClick={() => setViewingMaterial(null)}>
                Жабу
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getTypeBadge(viewingMaterial.type)}
                <span style={{ fontSize: '13px', color: 'var(--su-text-muted)' }}>
                  #{viewingMaterial.order} реттік нөмір
                </span>
              </div>

              {viewingMaterial.description && (
                <div style={{ fontSize: '14px', color: 'var(--su-text-muted)', fontStyle: 'italic' }}>
                  {viewingMaterial.description}
                </div>
              )}

              {viewingMaterial.contentText && (
                <div
                  style={{
                    background: 'var(--su-bg-muted)',
                    padding: '16px 20px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border-light)',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >
                  {viewingMaterial.contentText}
                </div>
              )}

              {viewingMaterial.contentUrl && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href={getDownloadUrl(viewingMaterial.contentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="outline" size="sm" icon={<Icon name="external" size={14} />}>
                      Тіркелген ресурсты / файлды ашу
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Modal: Delete Confirmation */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Материалды өшіру"
          maxWidth="440px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteSubmitting}
              >
                Бас тарту
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={deleteSubmitting}
              >
                Өшіру
              </Button>
            </div>
          }
        >
          <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--su-text-main)' }}>
            <p style={{ margin: '0 0 12px 0' }}>
              <strong>«{materialToDelete?.title}»</strong> оқу материалын өшіруге сенімдісіз бе?
            </p>
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--su-radius-md)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: 'var(--su-danger)',
                fontSize: '13px',
              }}
            >
              ⚠️ Бұл әрекет материалды және студенттердің осы материал бойынша жинаған оқу үлгерімін (progress) толық жояды.
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
};

export default TeacherMaterialsPage;
