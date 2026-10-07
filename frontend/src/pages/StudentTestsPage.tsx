import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  Tabs,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';

interface TestItem {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  topicId: string | null;
  topicTitle: string | null;
  durationMinutes: number;
  maxScore: number;
  questionsCount: number;
  totalPoints: number;
  showResultsImmediately: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  latestAttempt: {
    id: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    startedAt: string;
    submittedAt: string | null;
    score: number | null;
    percentage: number | null;
    correctAnswers: number;
    totalQuestions: number;
  } | null;
}

export const StudentTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [startingTestId, setStartingTestId] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const res = await fetch('/api/student/tests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Тесттер тізімін жүктеу мүмкін болмады');
      }

      const data = await res.json();
      setTests(data.tests || []);
    } catch (err: any) {
      setError(err.message || 'Сервермен байланыс қатесі');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleStartOrContinueTest = async (test: TestItem) => {
    try {
      setStartingTestId(test.id);
      const token = getToken();

      // If already has active attempt
      if (test.latestAttempt && test.latestAttempt.status === 'IN_PROGRESS') {
        navigate(`/student/tests/${test.id}/attempt/${test.latestAttempt.id}`);
        return;
      }

      // Start new
      const res = await fetch(`/api/student/tests/${test.id}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Тестті бастау сәтсіз аяқталды');
      }

      const data = await res.json();
      navigate(`/student/tests/${test.id}/attempt/${data.attemptId}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStartingTestId(null);
    }
  };

  const filteredTests = tests.filter((t) => {
    if (activeTab === 'upcoming') {
      return t.status === 'NOT_STARTED' || t.status === 'IN_PROGRESS';
    }
    if (activeTab === 'completed') {
      return t.status === 'COMPLETED' || t.status === 'EXPIRED';
    }
    return true;
  });

  const getStatusBadge = (test: TestItem) => {
    if (test.status === 'COMPLETED') {
      return <Badge variant="success">Аяқталды</Badge>;
    }
    if (test.status === 'EXPIRED') {
      return <Badge variant="danger">Уақыты бітті</Badge>;
    }
    if (test.status === 'IN_PROGRESS') {
      return <Badge variant="warning">Жалғасуда</Badge>;
    }
    return <Badge variant="neutral">Тапсырылмаған</Badge>;
  };

  return (
    <AppShell userRole="STUDENT">
      <div className="su-content-container">
        <PageHeader
          title="Тесттер"
          subtitle="Пәндер бойынша онлайн тесттер, бақылау сауалнамалары және емтихан сынақтары"
          breadcrumbs={[
            { label: 'Студент', path: '/student/dashboard' },
            { label: 'Тесттер' },
          ]}
        />

        {/* Tabs */}
        <div style={{ marginBottom: '24px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as any)}
            items={[
              { key: 'all', label: 'Барлығы', count: tests.length },
              {
                key: 'upcoming',
                label: 'Алда',
                count: tests.filter(
                  (t) => t.status === 'NOT_STARTED' || t.status === 'IN_PROGRESS'
                ).length,
              },
              {
                key: 'completed',
                label: 'Аяқталған',
                count: tests.filter(
                  (t) => t.status === 'COMPLETED' || t.status === 'EXPIRED'
                ).length,
              },
            ]}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4].map((n) => (
              <Card key={n}>
                <CardBody>
                  <Skeleton width="60%" height="24px" style={{ marginBottom: '12px' }} />
                  <Skeleton width="40%" height="16px" style={{ marginBottom: '20px' }} />
                  <Skeleton width="100%" height="40px" />
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <ErrorState
            title="Қате орын алды"
            message={error}
            onRetry={fetchTests}
          />
        )}

        {/* Empty */}
        {!loading && !error && filteredTests.length === 0 && (
          <EmptyState
            title="Тесттер табылмады"
            description="Сіздің тобыңызға бекітілген тесттер тізімі әзірге бос."
            icon={<Icon name="check-circle" size={48} />}
          />
        )}

        {/* List Cards */}
        {!loading && !error && filteredTests.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredTests.map((test) => {
              const isCompleted = test.status === 'COMPLETED' || test.status === 'EXPIRED';
              const isInProgress = test.status === 'IN_PROGRESS';

              return (
                <Card key={test.id} hoverable style={{ display: 'flex', flexDirection: 'column' }}>
                  <CardBody style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--color-primary, #2563eb)',
                          background: 'rgba(37, 99, 235, 0.08)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {test.subjectName} {test.subjectCode ? `(${test.subjectCode})` : ''}
                      </span>
                      {getStatusBadge(test)}
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', margin: '0 0 8px 0' }}>
                      {test.title}
                    </h3>

                    {test.description && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-muted, #64748b)',
                          margin: '0 0 16px 0',
                          lineHeight: '1.5',
                          flex: 1,
                        }}
                      >
                        {test.description}
                      </p>
                    )}

                    {test.topicTitle && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)', marginBottom: '16px' }}>
                        📌 Тақырып: <strong>{test.topicTitle}</strong>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        padding: '12px',
                        background: 'var(--color-bg-alt, #f8fafc)',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>Уақыт</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', marginTop: '2px' }}>
                          ⏱ {test.durationMinutes} мин
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>Сұрақтар</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', marginTop: '2px' }}>
                          ❓ {test.questionsCount}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>Макс. балл</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', marginTop: '2px' }}>
                          🏆 {test.totalPoints}
                        </div>
                      </div>
                    </div>

                    {/* Result summary if completed */}
                    {isCompleted && test.latestAttempt && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: test.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          borderRadius: '8px',
                          marginBottom: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>Нәтиже: </span>
                          <strong style={{ fontSize: '14px', color: test.status === 'COMPLETED' ? '#16a34a' : '#dc2626' }}>
                            {test.latestAttempt.percentage ?? 0}% ({test.latestAttempt.score ?? 0} балл)
                          </strong>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>
                          {test.latestAttempt.correctAnswers} / {test.latestAttempt.totalQuestions} дұрыс
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                      {isCompleted && test.latestAttempt && (
                        <Button
                          variant="outline"
                          style={{ flex: 1 }}
                          onClick={() =>
                            navigate(`/student/tests/${test.id}/result/${test.latestAttempt!.id}`)
                          }
                        >
                          Нәтижені көру
                        </Button>
                      )}

                      {isInProgress && (
                        <Button
                          variant="primary"
                          style={{ flex: 1, backgroundColor: '#eab308' }}
                          loading={startingTestId === test.id}
                          onClick={() => handleStartOrContinueTest(test)}
                        >
                          Жалғастыру
                        </Button>
                      )}

                      {test.status === 'NOT_STARTED' && (
                        <Button
                          variant="primary"
                          style={{ flex: 1 }}
                          loading={startingTestId === test.id}
                          onClick={() => handleStartOrContinueTest(test)}
                        >
                          Тестті бастау
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default StudentTestsPage;
