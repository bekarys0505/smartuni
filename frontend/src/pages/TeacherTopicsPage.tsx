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
import { api } from '../utils/api';

interface TeacherSubject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  topicsCount: number;
  groupsCount: number;
}

interface TopicItem {
  id: string;
  title: string;
  description: string | null;
  order: number;
  materialsCount: number;
  assignmentsCount: number;
  testsCount: number;
  createdAt: string;
  updatedAt: string;
}

export const TeacherTopicsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subjectId') || '';

  // Data states
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [topics, setTopics] = useState<TopicItem[]>([]);

  // Loading & error states
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deletingTopic, setDeletingTopic] = useState<TopicItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      setError(null);
      const res = await api.get<{ subjects: TeacherSubject[] }>('/api/teacher/subjects');
      const loaded = res.subjects || [];
      setSubjects(loaded);

      if (loaded.length > 0) {
        // If initial query param exists and matches, keep it; otherwise default to first subject
        const found = loaded.find((s) => s.id === initialSubjectId);
        setSelectedSubjectId(found ? found.id : loaded[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Пәндер тізімін жүктеу мүмкін болмады');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    try {
      setLoadingTopics(true);
      setError(null);
      const res = await api.get<{ topics: TopicItem[] }>(`/api/teacher/subjects/${subjectId}/topics`);
      setTopics(res.topics || []);
    } catch (err: any) {
      setError(err.message || 'Тақырыптарды жүктеу кезінде қате кетті');
    } finally {
      setLoadingTopics(false);
    }
  };

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // When selected subject changes, load its topics
  useEffect(() => {
    if (selectedSubjectId) {
      setSearchParams({ subjectId: selectedSubjectId }, { replace: true });
      fetchTopics(selectedSubjectId);
    } else {
      setTopics([]);
    }
  }, [selectedSubjectId]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTopic(null);
    setFormTitle('');
    setFormDescription('');
    setFormOrder(topics.length + 1);
    setActionError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (topic: TopicItem) => {
    setEditingTopic(topic);
    setFormTitle(topic.title);
    setFormDescription(topic.description || '');
    setFormOrder(topic.order);
    setActionError(null);
    setIsModalOpen(true);
  };

  // Save Topic (Create or Update)
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setActionError('Тақырып атауын жазыңыз');
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        order: formOrder ? Number(formOrder) : undefined,
      };

      if (editingTopic) {
        await api.patch(`/api/teacher/topics/${editingTopic.id}`, payload);
      } else {
        await api.post(`/api/teacher/subjects/${selectedSubjectId}/topics`, payload);
      }

      setIsModalOpen(false);
      await fetchTopics(selectedSubjectId);
    } catch (err: any) {
      setActionError(err.message || 'Сақтау кезінде қате пайда болды');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Topic
  const handleConfirmDelete = async () => {
    if (!deletingTopic) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await api.delete(`/api/teacher/topics/${deletingTopic.id}`);
      setDeletingTopic(null);
      await fetchTopics(selectedSubjectId);
    } catch (err: any) {
      alert(err.message || 'Тақырыпты өшіру мүмкін болмады');
    } finally {
      setIsDeleting(false);
    }
  };

  // Move Topic Up / Down
  const handleMoveTopic = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    const newTopics = [...topics];
    const temp = newTopics[index];
    newTopics[index] = newTopics[targetIndex];
    newTopics[targetIndex] = temp;

    // Optimistic UI update
    setTopics(newTopics);

    try {
      const topicIds = newTopics.map((t) => t.id);
      await api.put(`/api/teacher/subjects/${selectedSubjectId}/topics/reorder`, { topicIds });
      await fetchTopics(selectedSubjectId);
    } catch (err: any) {
      alert(err.message || 'Ретін жаңарту сәтсіз аяқталды');
      await fetchTopics(selectedSubjectId);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container" style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <PageHeader
          title="Тақырыптарды басқару"
          subtitle="Пәндердің оқу жоспарын, тақырыптар тізбегін және құрылымын баптау"
          breadcrumbs={[
            { label: 'Басты бет', path: '/teacher/dashboard' },
            { label: 'Тақырыптар' },
          ]}
          actions={
            <Button
              variant="primary"
              icon={<Icon name="plus" size={16} />}
              onClick={handleOpenCreateModal}
              disabled={!selectedSubjectId || loadingSubjects}
            >
              Жаңа тақырып
            </Button>
          }
        />

        {/* Subject Filter Bar */}
        <Card style={{ marginBottom: '24px' }}>
          <CardBody style={{ padding: '16px 20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '280px' }}>
                <Icon name="book" size={20} style={{ color: 'var(--su-primary)' }} />
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--su-text-main)', whiteSpace: 'nowrap' }}>
                  Пәнді таңдаңыз:
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={loadingSubjects || subjects.length === 0}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-card)',
                    color: 'var(--su-text-main)',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    flex: '1',
                    minWidth: '200px',
                    cursor: 'pointer',
                  }}
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.code ? `(${sub.code})` : ''} — {sub.topicsCount} тақырып
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubject && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge variant="primary" size="sm">
                    {selectedSubject.topicsCount} тақырып
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {selectedSubject.groupsCount} топ бекітілген
                  </Badge>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Content Area */}
        {loadingSubjects || loadingTopics ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton height="80px" />
            <Skeleton height="80px" />
            <Skeleton height="80px" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => selectedSubjectId && fetchTopics(selectedSubjectId)} />
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={<Icon name="book" size={48} />}
            title="Бекітілген пәндер табылмады"
            description="Сіздің атыңызға әзірге ешқандай пән немесе топ тіркелмеген."
          />
        ) : topics.length === 0 ? (
          <EmptyState
            icon={<Icon name="layers" size={48} />}
            title="Бұл пәнде әлі тақырыптар жоқ"
            description="Студенттерге арналған оқу материалын, тапсырмаларды енгізу үшін алдымен тақырып құрыңыз."
            action={
              <Button variant="primary" icon={<Icon name="plus" size={16} />} onClick={handleOpenCreateModal}>
                Бірінші тақырыпты қосу
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topics.map((topic, index) => (
              <Card key={topic.id} hoverable style={{ transition: 'all 0.2s ease' }}>
                <CardBody style={{ padding: '18px 22px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    {/* Topic Info */}
                    <div style={{ display: 'flex', gap: '16px', flex: '1', minWidth: '300px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: 'var(--su-radius-md)',
                          background: 'var(--su-primary-subtle)',
                          color: 'var(--su-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '16px',
                          flexShrink: 0,
                        }}
                      >
                        {topic.order}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '16px',
                              fontWeight: 600,
                              color: 'var(--su-text-main)',
                            }}
                          >
                            {topic.title}
                          </h3>
                        </div>

                        {topic.description && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              color: 'var(--su-text-muted)',
                              lineHeight: 1.5,
                            }}
                          >
                            {topic.description}
                          </p>
                        )}

                        {/* Counts badges */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <Badge variant="primary" size="sm">
                            📚 Материалдар: {topic.materialsCount}
                          </Badge>
                          <Badge variant="warning" size="sm">
                            📝 Тапсырмалар: {topic.assignmentsCount}
                          </Badge>
                          <Badge variant="success" size="sm">
                            ⏱ Тесттер: {topic.testsCount}
                          </Badge>
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
                          disabled={index === 0}
                          onClick={() => handleMoveTopic(index, 'up')}
                          title="Жоғары жылжыту"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<span style={{ fontWeight: 700, fontSize: '13px' }}>↓</span>}
                          disabled={index === topics.length - 1}
                          onClick={() => handleMoveTopic(index, 'down')}
                          title="Төмен жылжыту"
                        />
                      </div>

                      {/* Manage Materials button */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Icon name="folder" size={14} />}
                        onClick={() =>
                          navigate(`/teacher/materials?subjectId=${selectedSubjectId}&topicId=${topic.id}`)
                        }
                      >
                        Материалдарды басқару
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Icon name="file-text" size={14} />}
                        onClick={() => handleOpenEditModal(topic)}
                        title="Өңдеу"
                      >
                        Өңдеу
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--su-danger)' }}
                        icon={<Icon name="x" size={14} />}
                        onClick={() => setDeletingTopic(topic)}
                        title="Өшіру"
                      >
                        Өшіру
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit Topic Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTopic ? 'Тақырыпты өңдеу' : 'Жаңа тақырып қосу'}
          maxWidth="540px"
        >
          <form onSubmit={handleSaveTopic} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {actionError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--su-danger-subtle, #fee2e2)',
                  color: 'var(--su-danger, #ef4444)',
                  borderRadius: 'var(--su-radius-md)',
                  fontSize: '13px',
                }}
              >
                {actionError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Тақырып атауы *
              </label>
              <input
                type="text"
                placeholder="Мысалы: 1-дәріс. Кіріспе және негізгі ұғымдар"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: 'var(--su-radius-md)',
                  border: '1px solid var(--su-border)',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Сипаттамасы (міндетті емес)
              </label>
              <textarea
                rows={3}
                placeholder="Тақырып мазмұны мен оқытылатын сұрақтар бойынша қысқаша ақпарат..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: 'var(--su-radius-md)',
                  border: '1px solid var(--su-border)',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Реттік нөмірі (Order)
              </label>
              <input
                type="number"
                min="1"
                value={formOrder}
                onChange={(e) => setFormOrder(e.target.value ? Number(e.target.value) : '')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: 'var(--su-radius-md)',
                  border: '1px solid var(--su-border)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Болдырмау
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {editingTopic ? 'Өзгерістерді сақтау' : 'Тақырыпты қосу'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deletingTopic}
          onClose={() => setDeletingTopic(null)}
          title="Тақырыпты өшіру"
          maxWidth="440px"
        >
          {deletingTopic && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--su-text-main)', lineHeight: 1.6 }}>
                Сіз шынымен де <strong>«{deletingTopic.title}»</strong> тақырыбын өшіргіңіз келе ме?
              </p>
              <div
                style={{
                  padding: '12px 14px',
                  background: 'var(--su-warning-subtle, #fef3c7)',
                  borderRadius: 'var(--su-radius-md)',
                  fontSize: '13px',
                  color: 'var(--su-warning-text, #92400e)',
                  lineHeight: 1.5,
                }}
              >
                ⚠️ <strong>Ескерту:</strong> Тақырыпқа қатысты барлық оқу материалдары өшіріледі. Егер тақырып бойынша студенттер тапсырған тапсырмалар болса, деректерді сақтау мақсатында жүйе өшіруге тыйым салады.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="outline" onClick={() => setDeletingTopic(null)} disabled={isDeleting}>
                  Болдырмау
                </Button>
                <Button variant="danger" onClick={handleConfirmDelete} loading={isDeleting}>
                  Иә, өшіру
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
};

export default TeacherTopicsPage;
