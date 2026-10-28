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
  Skeleton,
  EmptyState,
  ErrorState,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';
import { api } from '../utils/api';

interface TopicItem {
  id: string;
  title: string;
  description: string | null;
  order: number;
  materialCount: number;
  completedMaterialCount: number;
  progress: number;
}

interface SubjectDetailsResponse {
  message: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    overallProgress: number;
    totalMaterials: number;
    completedTotal: number;
  };
  teacher: {
    id: string;
    fullName: string;
  };
  group: {
    id: string;
    name: string;
    course: number;
    semester: number;
    academicYear: string;
  };
  topics: TopicItem[];
}

export const StudentSubjectPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<SubjectDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubject = async () => {
    if (!subjectId) return;

    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      setError('Авторизация қажет. Қайта кіріңіз.');
      setLoading(false);
      return;
    }

    try {
      const resData = await api.get<SubjectDetailsResponse>(`/api/student/subjects/${subjectId}`);
      setData(resData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Белгісіз қателік';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [subjectId]);

  return (
    <AppShell userRole="STUDENT">
      <div className="su-subject-page-container">
        {loading && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <Skeleton width="220px" height="16px" style={{ marginBottom: '12px' }} />
              <Skeleton width="340px" height="32px" style={{ marginBottom: '8px' }} />
              <Skeleton width="500px" height="20px" />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              <Skeleton height="90px" />
              <Skeleton height="90px" />
              <Skeleton height="90px" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Skeleton height="80px" />
              <Skeleton height="80px" />
              <Skeleton height="80px" />
            </div>
          </div>
        )}

        {!loading && error && (
          <ErrorState
            title="Пәнді ашу мүмкін болмады"
            message={error}
            onRetry={fetchSubject}
          />
        )}

        {!loading && !error && data && (
          <>
            <PageHeader
              title={data.subject.name}
              subtitle={data.subject.description || 'Пән бойынша барлық оқу тақырыптары мен материалдары'}
              breadcrumbs={[
                { label: 'Басты бет', path: '/student/dashboard' },
                { label: 'Менің пәндерім', path: '/student/subjects' },
                { label: data.subject.name },
              ]}
              badge={
                data.subject.code ? (
                  <Badge variant="primary" size="md">
                    {data.subject.code}
                  </Badge>
                ) : null
              }
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/student/subjects')}
                  icon={<Icon name="chevron-left" size={16} />}
                >
                  Барлық пәндерге қайту
                </Button>
              }
            />

            {/* Quick Meta Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              {/* Teacher Info */}
              <Card padding="md" style={{ border: '1px solid var(--su-border)' }}>
                <CardBody style={{ padding: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--su-radius-md)',
                      backgroundColor: 'var(--su-primary-light)',
                      color: 'var(--su-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="user" size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>Оқытушы</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '2px 0 0 0', color: 'var(--su-text-main)' }}>
                      {data.teacher.fullName}
                    </h3>
                  </div>
                </CardBody>
              </Card>

              {/* Group Info */}
              <Card padding="md" style={{ border: '1px solid var(--su-border)' }}>
                <CardBody style={{ padding: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--su-radius-md)',
                      backgroundColor: 'var(--su-secondary-light)',
                      color: 'var(--su-text-body)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="users" size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>Топ / Семестр</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '2px 0 0 0', color: 'var(--su-text-main)' }}>
                      {data.group.name} ({data.group.course}-курс, {data.group.semester}-сем.)
                    </h3>
                  </div>
                </CardBody>
              </Card>

              {/* Overall Progress */}
              <Card padding="md" style={{ border: '1px solid var(--su-border)' }}>
                <CardBody style={{ padding: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--su-text-muted)', fontWeight: 500 }}>
                      Жалпы үлгерім:
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--su-primary)' }}>
                      {data.subject.overallProgress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={data.subject.overallProgress}
                    variant={data.subject.overallProgress === 100 ? 'success' : 'primary'}
                    size="md"
                  />
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--su-text-muted)', textAlign: 'right' }}>
                    {data.subject.completedTotal} / {data.subject.totalMaterials} оқу материалы аяқталды
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Topics Section */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
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
                  <Icon name="layers" size={20} style={{ color: 'var(--su-primary)' }} />
                  Оқу тақырыптары ({data.topics.length})
                </h2>
              </div>

              {data.topics.length === 0 ? (
                <EmptyState
                  title="Тақырыптар әлі қосылмаған"
                  description="Бұл пәнге оқытушы тарапынан дәріс тақырыптары әлі енгізілмеген."
                  icon={<Icon name="book" size={44} />}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.topics.map((topic, index) => {
                    const isTopicDone = topic.progress === 100;
                    const isTopicStarted = topic.progress > 0;

                    return (
                      <Card
                        key={topic.id}
                        padding="md"
                        hoverable
                        style={{
                          border: '1px solid var(--su-border)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                        onClick={() => navigate(`/student/topics/${topic.id}`)}
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
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 300px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: 'var(--su-radius-md)',
                                background: isTopicDone
                                  ? 'rgba(46, 125, 50, 0.1)'
                                  : 'var(--su-primary-light)',
                                color: isTopicDone ? 'var(--su-success)' : 'var(--su-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '15px',
                                flexShrink: 0,
                              }}
                            >
                              {topic.order || index + 1}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h3
                                  style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    margin: 0,
                                    color: 'var(--su-text-main)',
                                  }}
                                >
                                  {topic.title}
                                </h3>

                                <Badge
                                  variant={isTopicDone ? 'success' : isTopicStarted ? 'warning' : 'neutral'}
                                  size="sm"
                                >
                                  {isTopicDone
                                    ? 'Аяқталды'
                                    : isTopicStarted
                                    ? `${topic.progress}%`
                                    : 'Басталмаған'}
                                </Badge>
                              </div>

                              {topic.description && (
                                <p
                                  style={{
                                    fontSize: '13px',
                                    color: 'var(--su-text-muted)',
                                    margin: '0 0 6px 0',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {topic.description}
                                </p>
                              )}

                              <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                                Оқу материалдары: <strong>{topic.completedMaterialCount}</strong> /{' '}
                                {topic.materialCount}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '20px',
                              flex: '0 0 auto',
                              marginLeft: 'auto',
                            }}
                          >
                            <div style={{ width: '120px' }}>
                              <ProgressBar
                                value={topic.progress}
                                variant={isTopicDone ? 'success' : 'primary'}
                                size="sm"
                              />
                            </div>

                            <Button
                              variant={isTopicDone ? 'outline' : 'primary'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/topics/${topic.id}`);
                              }}
                              icon={<Icon name="chevron-right" size={14} />}
                              iconPosition="right"
                            >
                              {isTopicDone ? 'Қайта көру' : 'Оқуға өту'}
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
      </div>
    </AppShell>
  );
};

export default StudentSubjectPage;

