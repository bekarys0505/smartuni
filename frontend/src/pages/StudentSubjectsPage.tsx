import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  ProgressBar,
  Button,
  Skeleton,
  EmptyState,
  ErrorState,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';

interface SubjectItem {
  id: string;
  membershipId: string;
  name: string;
  code: string | null;
  description: string | null;
  group: {
    id: string;
    name: string;
    course: number;
    semester: number;
    academicYear: string;
    lessonDay: string | null;
    lessonTime: string | null;
    classroom: string | null;
  };
  teacher: {
    id: string;
    fullName: string;
  };
  topicCount: number;
  totalMaterials: number;
  completedCount: number;
  progress: number;
  joinedAt: string;
}

export const StudentSubjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      setError('Авторизация токені табылмады. Қайта жүйеге кіріңіз.');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/student/subjects`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Сессия мерзімі аяқталды. Қайта кіріңіз.');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Пәндер тізімін жүктеу мүмкін болмады');
      }

      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Белгісіз қате орын алды';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <AppShell userRole="STUDENT">
      <div className="su-subjects-container">
        <PageHeader
          title="Менің пәндерім"
          subtitle="Сіз жазылған оқу курстары, дәріс бағдарламалары және оқу үлгеріміңіз"
          breadcrumbs={[
            { label: 'Басты бет', path: '/student/dashboard' },
            { label: 'Менің пәндерім' },
          ]}
          badge={
            !loading && subjects.length > 0 ? (
              <Badge variant="primary" size="md">
                Барлығы: {subjects.length} пән
              </Badge>
            ) : null
          }
        />

        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {[1, 2, 3].map((n) => (
              <Card key={n} padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Skeleton width="90px" height="24px" />
                  <Skeleton width="70px" height="24px" />
                </div>
                <Skeleton width="80%" height="28px" style={{ marginBottom: '12px' }} />
                <Skeleton width="100%" height="16px" style={{ marginBottom: '8px' }} />
                <Skeleton width="60%" height="16px" style={{ marginBottom: '24px' }} />
                <Skeleton width="100%" height="10px" style={{ marginBottom: '16px' }} />
                <Skeleton width="100%" height="40px" />
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState
            title="Пәндерді жүктеу қатесі"
            message={error}
            onRetry={fetchSubjects}
          />
        )}

        {!loading && !error && subjects.length === 0 && (
          <EmptyState
            title="Сіз әлі ешқандай пәнге жазылмағансыз"
            description="Оқу курстарына қатысу үшін студенттік жеке кабинетіңізден топты таңдап, өтініш жіберіңіз."
            icon={<Icon name="book" size={48} />}
            action={
              <Button
                variant="primary"
                onClick={() => navigate('/student/dashboard')}
                icon={<Icon name="dashboard" size={16} />}
              >
                Топтар тізіміне өту
              </Button>
            }
          />
        )}

        {!loading && !error && subjects.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '24px',
            }}
          >
            {subjects.map((sub) => {
              const isFinished = sub.progress === 100;
              const hasStarted = sub.progress > 0;

              return (
                <Card
                  key={sub.id}
                  padding="lg"
                  hoverable
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--su-border)',
                  }}
                >
                  <CardHeader style={{ padding: 0, marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        gap: '8px',
                      }}
                    >
                      <Badge variant="primary" size="sm">
                        {sub.code || 'КУРС'}
                      </Badge>

                      <Badge
                        variant={isFinished ? 'success' : hasStarted ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {isFinished ? 'Аяқталды' : hasStarted ? `${sub.progress}% өткерілді` : 'Басталмаған'}
                      </Badge>
                    </div>

                    <h2
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: 'var(--su-text-main)',
                        margin: '0 0 6px 0',
                        lineHeight: 1.3,
                      }}
                    >
                      {sub.name}
                    </h2>

                    {sub.description && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--su-text-muted)',
                          margin: 0,
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {sub.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardBody style={{ padding: 0, marginBottom: '20px' }}>
                    {/* Course and Teacher Metadata */}
                    <div
                      style={{
                        background: 'var(--su-bg-muted)',
                        borderRadius: 'var(--su-radius-md)',
                        padding: '12px 14px',
                        marginBottom: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="user" size={15} style={{ color: 'var(--su-primary)' }} />
                        <span style={{ color: 'var(--su-text-muted)' }}>Оқытушы:</span>
                        <strong style={{ color: 'var(--su-text-main)', marginLeft: 'auto' }}>
                          {sub.teacher.fullName}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="users" size={15} style={{ color: 'var(--su-primary)' }} />
                        <span style={{ color: 'var(--su-text-muted)' }}>Топ / Семестр:</span>
                        <span style={{ color: 'var(--su-text-main)', marginLeft: 'auto', fontWeight: 500 }}>
                          {sub.group.name} ({sub.group.semester}-семестр)
                        </span>
                      </div>

                      {(sub.group.lessonDay || sub.group.lessonTime) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon name="clock" size={15} style={{ color: 'var(--su-primary)' }} />
                          <span style={{ color: 'var(--su-text-muted)' }}>Уақыты:</span>
                          <span style={{ color: 'var(--su-text-main)', marginLeft: 'auto' }}>
                            {[sub.group.lessonDay, sub.group.lessonTime, sub.group.classroom]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Information */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          color: 'var(--su-text-muted)',
                          marginBottom: '6px',
                        }}
                      >
                        <span>Оқу үлгерімі:</span>
                        <span>
                          <strong>{sub.completedCount}</strong> / {sub.totalMaterials} материал (
                          <strong>{sub.topicCount}</strong> тақырып)
                        </span>
                      </div>
                      <ProgressBar
                        value={sub.progress}
                        variant={isFinished ? 'success' : 'primary'}
                        size="md"
                      />
                    </div>
                  </CardBody>

                  <CardFooter
                    style={{
                      padding: 0,
                      borderTop: '1px solid var(--su-border-light)',
                      paddingTop: '16px',
                    }}
                  >
                    <Button
                      variant={isFinished ? 'outline' : 'primary'}
                      size="md"
                      style={{ width: '100%' }}
                      onClick={() => navigate(`/student/subjects/${sub.id}`)}
                      icon={<Icon name="chevron-right" size={16} />}
                      iconPosition="right"
                    >
                      {isFinished ? 'Материалдарды қайталау' : 'Пәнді оқу'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default StudentSubjectsPage;

