import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  ErrorState,
} from '../components/ui';
import { api } from '../utils/api';

interface ResultData {
  testId: string;
  testTitle: string;
  showResultsImmediately: boolean;
  status: 'COMPLETED' | 'EXPIRED';
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  correctAnswers: number;
  totalQuestions: number;
  pendingOpenTextCount: number;
}

interface QuestionErrorItem {
  questionId: string;
  order: number;
  questionText: string;
  type: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string | null;
  isCorrect: boolean | null;
  score: number | null;
  points: number;
  isOpenText: boolean;
}

export const StudentTestResultPage: React.FC = () => {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<ResultData | null>(null);
  const [errors, setErrors] = useState<QuestionErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchResultAndErrors = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [dataResult, dataErrors] = await Promise.all([
        api.get<{ result: ResultData }>(`/api/student/tests/${testId}/attempt/${attemptId}/result`),
        api.get<{ errors: QuestionErrorItem[] }>(`/api/student/tests/${testId}/attempt/${attemptId}/errors`).catch(() => ({ errors: [] })),
      ]);

      setResult(dataResult.result);
      setErrors(dataErrors?.errors || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Сервер қатесі');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResultAndErrors();
  }, [testId, attemptId]);

  if (loading) {
    return (
      <AppShell userRole="STUDENT">
        <div className="su-content-container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="su-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }} />
          <p style={{ color: 'var(--color-text-muted, #64748b)' }}>Нәтижелер есептелуде...</p>
        </div>
      </AppShell>
    );
  }

  if (errorMsg || !result) {
    return (
      <AppShell userRole="STUDENT">
        <div className="su-content-container">
          <ErrorState
            title="Нәтижені жүктеу қатесі"
            message={errorMsg || 'Нәтиже табылмады'}
            onRetry={fetchResultAndErrors}
          />
        </div>
      </AppShell>
    );
  }

  const isPassed = (result.percentage || 0) >= 50;

  return (
    <AppShell userRole="STUDENT">
      <div className="su-content-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader
          title={result.testTitle}
          subtitle="Тестілеу қорытындысы мен нәтижесі"
          breadcrumbs={[
            { label: 'Студент', path: '/student/dashboard' },
            { label: 'Тесттер', path: '/student/tests' },
            { label: 'Нәтиже' },
          ]}
          actions={
            <Button variant="secondary" onClick={() => navigate('/student/tests')}>
              Тесттерге оралу
            </Button>
          }
        />

        {/* Big Score Card */}
        <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
          <CardBody style={{ padding: '36px 24px' }}>
            <div style={{ display: 'inline-block', marginBottom: '12px' }}>
              <Badge variant={isPassed ? 'success' : 'danger'}>
                {result.status === 'EXPIRED' ? 'Уақыты бітті' : isPassed ? 'Сынақ тапсырылды' : 'Сынақ тапсырылмады'}
              </Badge>
            </div>

            <div
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: isPassed ? '#16a34a' : '#dc2626',
                lineHeight: '1',
                marginBottom: '12px',
              }}
            >
              {result.percentage ?? 0}%
            </div>

            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', marginBottom: '24px' }}>
              Жиналған ұпай: {result.score ?? 0} / {result.maxScore} балл
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                maxWidth: '600px',
                margin: '0 auto',
                padding: '16px',
                background: 'var(--color-bg-alt, #f8fafc)',
                borderRadius: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>Дұрыс жауап</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                  ✓ {result.correctAnswers}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>Қате жауап</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
                  ✕ {result.totalQuestions - result.correctAnswers - result.pendingOpenTextCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>Барлық сұрақтар</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main, #1e293b)', marginTop: '4px' }}>
                  {result.totalQuestions}
                </div>
              </div>
            </div>

            {result.pendingOpenTextCount > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  color: '#92400e',
                  fontSize: '13px',
                }}
              >
                ℹ️ {result.pendingOpenTextCount} ашық сұрақтың жауабы оқытушы тексеруінде. Тексеріс аяқталған соң балл жаңартылады.
              </div>
            )}
          </CardBody>
        </Card>

        {/* Detailed Review Section */}
        {result.showResultsImmediately ? (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', marginBottom: '16px' }}>
              Сұрақтарды талдау және қателер
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errors.map((item) => {
                const isCorrect = item.isCorrect === true;

                return (
                  <Card
                    key={item.questionId}
                    style={{
                      borderLeft: item.isOpenText
                        ? '4px solid #f59e0b'
                        : isCorrect
                        ? '4px solid #16a34a'
                        : '4px solid #dc2626',
                    }}
                  >
                    <CardBody style={{ padding: '20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-main, #1e293b)' }}>
                          {item.order}-сұрақ ({item.points} балл)
                        </span>

                        {item.isOpenText ? (
                          <Badge variant="warning">Оқытушы тексеруде</Badge>
                        ) : isCorrect ? (
                          <Badge variant="success">Дұрыс ({item.score} балл)</Badge>
                        ) : (
                          <Badge variant="danger">Қате (0 балл)</Badge>
                        )}
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-main, #1e293b)', marginBottom: '14px' }}>
                        {item.questionText}
                      </div>

                      {/* Answers Breakdown */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '13px',
                          background: 'var(--color-bg-alt, #f8fafc)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: item.explanation ? '12px' : '0',
                        }}
                      >
                        <div>
                          <span style={{ color: 'var(--color-text-muted, #64748b)' }}>Сіздің жауабыңыз: </span>
                          <strong style={{ color: item.isOpenText ? '#1e293b' : isCorrect ? '#16a34a' : '#dc2626' }}>
                            {item.studentAnswer}
                          </strong>
                        </div>

                        {!item.isOpenText && !isCorrect && (
                          <div>
                            <span style={{ color: 'var(--color-text-muted, #64748b)' }}>Дұрыс жауап: </span>
                            <strong style={{ color: '#16a34a' }}>{item.correctAnswer}</strong>
                          </div>
                        )}
                      </div>

                      {/* Explanation */}
                      {item.explanation && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)', fontStyle: 'italic' }}>
                          💡 Түсіндірме: {item.explanation}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card>
            <CardBody style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{ color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
                Бұл тестте оқытушы сұрақтар бойынша толық қателерді көрсетуді өшірген.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default StudentTestResultPage;
