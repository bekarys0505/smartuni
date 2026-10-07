import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  ProgressBar,
  Button,
  Modal,
  Skeleton,
  EmptyState,
  ErrorState,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';

type MaterialType = 'LECTURE' | 'VIDEO' | 'ADDITIONAL_RESOURCE';
type ProgressStatus = 'UNREAD' | 'STARTED' | 'COMPLETED';

interface MaterialItem {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  contentUrl: string | null;
  contentText: string | null;
  order: number;
  status: ProgressStatus;
}

interface TopicAssignmentItem {
  id: string;
  title: string;
  description: string | null;
  responseType: 'TEXT' | 'FILE' | 'TEXT_AND_FILE';
  attachmentUrl: string | null;
  maxScore: number;
  deadline: string | null;
  allowLate: boolean;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED' | 'LATE';
  score: number | null;
  teacherComment: string | null;
  submittedAt: string | null;
  isLate: boolean;
}

interface TopicDetailsResponse {
  message: string;
  topic: {
    id: string;
    title: string;
    description: string | null;
    order: number;
  };
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  materials: MaterialItem[];
  assignments?: TopicAssignmentItem[];
}

export const StudentTopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<TopicDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active material modal state
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTopic = async () => {
    if (!topicId) return;

    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      setError('Авторизация қажет. Қайта кіріңіз.');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/student/topics/${topicId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Бұл тақырыпқа қолжетімділік жоқ (пән тыңдаушысы емессіз).');
        }
        if (response.status === 404) {
          throw new Error('Тақырып табылмады.');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Тақырып материалдарын жүктеу кезінде қате орын алды');
      }

      const resData = await response.json();
      setData(resData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Белгісіз қателік';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  // Open modal and automatically trigger start if UNREAD
  const handleOpenMaterial = async (material: MaterialItem) => {
    setSelectedMaterial(material);

    if (material.status === 'UNREAD') {
      const token = getToken();
      if (!token) return;

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/student/materials/${material.id}/start`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Update status locally
          setData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              materials: prev.materials.map((m) =>
                m.id === material.id ? { ...m, status: 'STARTED' } : m,
              ),
            };
          });

          setSelectedMaterial((prev) => (prev ? { ...prev, status: 'STARTED' } : null));
        }
      } catch (err) {
        console.error('Failed to mark material as STARTED:', err);
      }
    }
  };

  // Complete material
  const handleCompleteMaterial = async () => {
    if (!selectedMaterial) return;

    setActionLoading(true);
    const token = getToken();
    if (!token) {
      setActionLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/student/materials/${selectedMaterial.id}/complete`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Материалды аяқтау мүмкін болмады');
      }

      // Update state locally
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          materials: prev.materials.map((m) =>
            m.id === selectedMaterial.id ? { ...m, status: 'COMPLETED' } : m,
          ),
        };
      });

      setSelectedMaterial((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Қате кетті';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const getMaterialTypeConfig = (type: MaterialType) => {
    switch (type) {
      case 'LECTURE':
        return {
          label: 'Дәріс тезисі',
          icon: 'book' as const,
          badgeVariant: 'primary' as const,
          color: 'var(--su-primary)',
        };
      case 'VIDEO':
        return {
          label: 'Бейнедәріс',
          icon: 'sparkles' as const,
          badgeVariant: 'warning' as const,
          color: 'var(--su-warning)',
        };
      case 'ADDITIONAL_RESOURCE':
        return {
          label: 'Қосымша материал',
          icon: 'folder' as const,
          badgeVariant: 'info' as const,
          color: 'var(--su-info)',
        };
    }
  };

  const completedCount = data?.materials.filter((m) => m.status === 'COMPLETED').length || 0;
  const totalCount = data?.materials.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <AppShell userRole="STUDENT">
      <div className="su-topic-page-container">
        {loading && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <Skeleton width="300px" height="16px" style={{ marginBottom: '12px' }} />
              <Skeleton width="400px" height="32px" style={{ marginBottom: '8px' }} />
              <Skeleton width="600px" height="18px" />
            </div>
            <Skeleton height="80px" style={{ marginBottom: '24px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Skeleton height="70px" />
              <Skeleton height="70px" />
              <Skeleton height="70px" />
            </div>
          </div>
        )}

        {!loading && error && (
          <ErrorState
            title="Тақырыпты жүктеу қатесі"
            message={error}
            onRetry={fetchTopic}
          />
        )}

        {!loading && !error && data && (
          <>
            <PageHeader
              title={data.topic.title}
              subtitle={data.topic.description || `${data.subject.name} курсы бойынша сабақ тақырыбы`}
              breadcrumbs={[
                { label: 'Басты бет', path: '/student/dashboard' },
                { label: 'Менің пәндерім', path: '/student/subjects' },
                { label: data.subject.name, path: `/student/subjects/${data.subject.id}` },
                { label: data.topic.title },
              ]}
              badge={
                <Badge variant="primary" size="md">
                  {data.subject.code || 'ПӘН'} • Тақырып #{data.topic.order}
                </Badge>
              }
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/student/subjects/${data.subject.id}`)}
                  icon={<Icon name="chevron-left" size={16} />}
                >
                  Пәнге қайту
                </Button>
              }
            />

            {/* Topic Progress Card */}
            <Card
              padding="md"
              style={{
                border: '1px solid var(--su-border)',
                marginBottom: '28px',
                background: 'var(--su-bg-surface)',
              }}
            >
              <CardBody style={{ padding: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--su-text-main)' }}>
                      Тақырып бойынша оқу үлгерімі:
                    </span>
                    <Badge variant={progressPercent === 100 ? 'success' : 'primary'} size="sm">
                      {completedCount} / {totalCount} меңгерілді
                    </Badge>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--su-primary)' }}>
                    {progressPercent}%
                  </span>
                </div>
                <ProgressBar
                  value={progressPercent}
                  variant={progressPercent === 100 ? 'success' : 'primary'}
                  size="md"
                />
              </CardBody>
            </Card>

            {/* Materials List */}
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--su-text-main)',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Icon name="file-text" size={20} style={{ color: 'var(--su-primary)' }} />
                Оқу материалдары мен тапсырмалар ({data.materials.length})
              </h2>

              {data.materials.length === 0 ? (
                <EmptyState
                  title="Материалдар табылмады"
                  description="Бұл тақырыпқа әлі ешқандай оқу материалы қосылмаған."
                  icon={<Icon name="file-text" size={44} />}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.materials.map((material) => {
                    const typeConfig = getMaterialTypeConfig(material.type);
                    const isCompleted = material.status === 'COMPLETED';
                    const isStarted = material.status === 'STARTED';

                    return (
                      <Card
                        key={material.id}
                        padding="md"
                        hoverable
                        style={{
                          border: '1px solid var(--su-border)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleOpenMaterial(material)}
                      >
                        <CardBody
                          style={{
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: 'var(--su-radius-md)',
                                background: isCompleted
                                  ? 'rgba(46, 125, 50, 0.1)'
                                  : 'var(--su-bg-muted)',
                                color: isCompleted ? 'var(--su-success)' : typeConfig.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon
                                name={isCompleted ? 'check-circle' : typeConfig.icon}
                                size={22}
                              />
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Badge variant={typeConfig.badgeVariant} size="sm">
                                  {typeConfig.label}
                                </Badge>

                                <Badge
                                  variant={isCompleted ? 'success' : isStarted ? 'warning' : 'neutral'}
                                  size="sm"
                                >
                                  {isCompleted
                                    ? 'Аяқталды'
                                    : isStarted
                                    ? 'Оқылуда'
                                    : 'Оқылмаған'}
                                </Badge>
                              </div>

                              <h3
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 600,
                                  color: 'var(--su-text-main)',
                                  margin: '0 0 2px 0',
                                }}
                              >
                                {material.title}
                              </h3>

                              {material.description && (
                                <p
                                  style={{
                                    fontSize: '13px',
                                    color: 'var(--su-text-muted)',
                                    margin: 0,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {material.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: 'auto' }}>
                            <Button
                              variant={isCompleted ? 'outline' : 'primary'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMaterial(material);
                              }}
                              icon={
                                isCompleted ? (
                                  <Icon name="check" size={14} />
                                ) : isStarted ? (
                                  <Icon name="chevron-right" size={14} />
                                ) : (
                                  <Icon name="book" size={14} />
                                )
                              }
                            >
                              {isCompleted ? 'Қайта оқу' : isStarted ? 'Жалғастыру' : 'Оқуды бастау'}
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assignments Section */}
            <div style={{ marginTop: '36px', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--su-text-main)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Icon name="check-circle" size={20} style={{ color: 'var(--su-primary)' }} />
                  Тақырыптық тапсырмалар ({data.assignments?.length || 0})
                </h2>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/student/assignments')}
                  icon={<Icon name="chevron-right" size={14} />}
                  iconPosition="right"
                >
                  Барлық тапсырмалар бетіне өту
                </Button>
              </div>

              {!data.assignments || data.assignments.length === 0 ? (
                <Card padding="md" style={{ border: '1px solid var(--su-border-light)', background: 'var(--su-bg-muted)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    Бұл тақырып бойынша әзірге бекіту тапсырмалары қосылмаған.
                  </div>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.assignments.map((assignment) => {
                    const isGraded = assignment.status === 'GRADED';
                    const isSubmitted = assignment.status === 'SUBMITTED' || assignment.status === 'LATE';

                    return (
                      <Card
                        key={assignment.id}
                        padding="md"
                        hoverable
                        style={{ border: '1px solid var(--su-border)', cursor: 'pointer' }}
                        onClick={() => navigate('/student/assignments')}
                      >
                        <CardBody
                          style={{
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--su-radius-md)',
                                background: isGraded
                                  ? 'rgba(46, 125, 50, 0.1)'
                                  : 'var(--su-primary-light)',
                                color: isGraded ? 'var(--su-success)' : 'var(--su-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon name="check" size={20} />
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Badge
                                  variant={
                                    isGraded ? 'success' : isSubmitted ? 'primary' : 'neutral'
                                  }
                                  size="sm"
                                >
                                  {isGraded
                                    ? `Бағаланды: ${assignment.score} / ${assignment.maxScore}`
                                    : isSubmitted
                                    ? 'Жіберілді'
                                    : 'Тапсырмаған'}
                                </Badge>

                                {assignment.deadline && (
                                  <span style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                                    Мерзімі: {new Date(assignment.deadline).toLocaleDateString('kk-KZ')}
                                  </span>
                                )}
                              </div>

                              <h3
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 600,
                                  color: 'var(--su-text-main)',
                                  margin: '0 0 2px 0',
                                }}
                              >
                                {assignment.title}
                              </h3>

                              {assignment.description && (
                                <p style={{ fontSize: '13px', color: 'var(--su-text-muted)', margin: 0 }}>
                                  {assignment.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ marginLeft: 'auto' }}>
                            <Button
                              variant={isGraded ? 'outline' : 'primary'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/student/assignments');
                              }}
                              icon={<Icon name="chevron-right" size={14} />}
                              iconPosition="right"
                            >
                              {isGraded ? 'Нәтижесі' : isSubmitted ? 'Жауапты қарау' : 'Орындау'}
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Material Reading Modal */}
        {selectedMaterial && (
          <Modal
            isOpen={Boolean(selectedMaterial)}
            onClose={() => setSelectedMaterial(null)}
            maxWidth="680px"
            title={selectedMaterial.title}
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div>
                  {selectedMaterial.status === 'COMPLETED' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--su-success)',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <Icon name="check-circle" size={16} /> Бұл оқу материалы меңгерілді
                    </span>
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--su-text-muted)' }}>
                      Материалды оқып болған соң аяқтау батырмасын басыңыз
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
              {/* Type and Status Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant={getMaterialTypeConfig(selectedMaterial.type).badgeVariant} size="sm">
                  {getMaterialTypeConfig(selectedMaterial.type).label}
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
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--su-text-muted)',
                    margin: 0,
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  {selectedMaterial.description}
                </p>
              )}

              {/* External URL if provided */}
              {selectedMaterial.contentUrl && (
                <div
                  style={{
                    padding: '14px 16px',
                    background: 'var(--su-primary-subtle)',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon name="external" size={20} style={{ color: 'var(--su-primary)' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--su-text-main)' }}>
                        Сыртқы ресурс немесе видео сілтемесі
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                        Бұл материал интерактивті порталда немесе бейнехостингте орналасқан
                      </div>
                    </div>
                  </div>

                  <a
                    href={selectedMaterial.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="outline" size="sm" icon={<Icon name="external" size={14} />}>
                      Сілтемені ашу
                    </Button>
                  </a>
                </div>
              )}

              {/* Material Text Content */}
              {selectedMaterial.contentText && (
                <div
                  style={{
                    background: 'var(--su-bg-muted)',
                    padding: '16px 20px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border-light)',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: 'var(--su-text-main)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    fontFamily: 'inherit',
                  }}
                >
                  {selectedMaterial.contentText}
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
};

export default StudentTopicPage;

