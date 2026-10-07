import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { getToken } from '../utils/auth';

interface TestResultItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  percentage: number | null;
  correctAnswers: number;
  totalQuestions: number;
  pendingOpenCount: number;
}

interface TestHeaderInfo {
  id: string;
  title: string;
  subjectName: string;
  maxScore: number;
  questionsCount: number;
}

interface AnswerDetailItem {
  id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  points: number;
  explanation: string | null;
  textAnswer: string | null;
  selectedOptionIds: string[];
  options: Array<{
    id: string;
    optionText: string;
    isCorrect: boolean;
  }>;
  isCorrect: boolean | null;
  score: number | null;
  teacherComment: string | null;
}

export const TeacherTestResultsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [testInfo, setTestInfo] = useState<TestHeaderInfo | null>(null);
  const [results, setResults] = useState<TestResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attempt Detail & Grading Modal state
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<any | null>(null);
  const [loadingAttemptDetail, setLoadingAttemptDetail] = useState(false);

  // Grade open question form
  const [gradingQuestionId, setGradingQuestionId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(0);
  const [gradingComment, setGradingComment] = useState<string>('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const res = await fetch(`/api/teacher/tests/${testId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Нәтижелерді жүктеу қатесі');

      const data = await res.json();
      setTestInfo(data.test);
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Сервер қатесі');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [testId]);

  const handleOpenAttemptDetail = async (attemptId: string) => {
    try {
      setSelectedAttemptId(attemptId);
      setLoadingAttemptDetail(true);
      const token = getToken();
      const res = await fetch(`/api/teacher/tests/${testId}/results/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Студент жауаптарын алу сәтсіз');

      const data = await res.json();
      setAttemptDetail(data.attempt);
    } catch (err: any) {
      alert(err.message);
      setSelectedAttemptId(null);
    } finally {
      setLoadingAttemptDetail(false);
    }
  };

  const handleGradeOpenQuestion = async (questionId: string, maxPoints: number) => {
    if (gradingScore < 0 || gradingScore > maxPoints) {
      alert(`Ұпай 0 мен ${maxPoints} аралығында болуы тиіс`);
      return;
    }

    try {
      setIsSavingGrade(true);
      const token = getToken();
      const res = await fetch(
        `/api/teacher/tests/${testId}/results/${selectedAttemptId}/questions/${questionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            score: Number(gradingScore),
            comment: gradingComment.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Бағалау сәтсіз');
      }

      alert('Баға сақталды және тест ұпайы қайта есептелді!');
      setGradingQuestionId(null);
      handleOpenAttemptDetail(selectedAttemptId!);
      fetchResults();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingGrade(false);
    }
  };

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container">
        <PageHeader
          title={testInfo ? `Нәтижелер: ${testInfo.title}` : 'Тест нәтижелері'}
          subtitle="Студенттердің тест тапсыру статистикасы, ұпайлары және ашық сұрақтарды бағалау"
          breadcrumbs={[
            { label: 'Оқытушы', path: '/teacher/dashboard' },
            { label: 'Тесттер', path: '/teacher/tests' },
            { label: 'Нәтижелер' },
          ]}
          actions={
            <Button variant="secondary" onClick={() => navigate('/teacher/tests')}>
              Тесттерге оралу
            </Button>
          }
        />

        {loading && (
          <Card>
            <CardBody>
              <Skeleton width="100%" height="200px" />
            </CardBody>
          </Card>
        )}

        {!loading && error && (
          <ErrorState
            title="Қате орын алды"
            message={error}
            onRetry={fetchResults}
          />
        )}

        {!loading && !error && results.length === 0 && (
          <EmptyState
            title="Әзірге ешкім тапсырмады"
            description="Бұл тест бойынша студенттер әлі жауап жіберген жоқ."
            icon={<Icon name="users" size={48} />}
          />
        )}

        {!loading && !error && results.length > 0 && (
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-alt, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Студент</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Күйі</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Басталды</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Тапсырылды</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Дұрыс / Барлығы</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Балл</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Пайыз</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>{r.studentName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>{r.studentEmail}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {r.status === 'COMPLETED' ? (
                          <Badge variant="success">Аяқталды</Badge>
                        ) : r.status === 'EXPIRED' ? (
                          <Badge variant="danger">Уақыты бітті</Badge>
                        ) : (
                          <Badge variant="warning">Тапсыруда</Badge>
                        )}
                        {r.pendingOpenCount > 0 && (
                          <div style={{ marginTop: '4px' }}>
                            <Badge variant="warning">Тексеру қажет ({r.pendingOpenCount})</Badge>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                        {new Date(r.startedAt).toLocaleString('kk-KZ')}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString('kk-KZ') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                        {r.correctAnswers} / {r.totalQuestions}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary, #2563eb)' }}>
                        {r.score ?? 0}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        <span style={{ color: (r.percentage || 0) >= 50 ? '#16a34a' : '#dc2626' }}>
                          {r.percentage ?? 0}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAttemptDetail(r.id)}
                        >
                          Жауаптарды көру
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ---------------------------------------------------- */}
        {/* Attempt Detail & Grading Modal                       */}
        {/* ---------------------------------------------------- */}
        <Modal
          isOpen={Boolean(selectedAttemptId)}
          onClose={() => {
            setSelectedAttemptId(null);
            setAttemptDetail(null);
            setGradingQuestionId(null);
          }}
          title={attemptDetail ? `Студент жауаптары: ${attemptDetail.studentName}` : 'Жауаптар'}
          maxWidth="800px"
          footer={
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedAttemptId(null);
                setAttemptDetail(null);
                setGradingQuestionId(null);
              }}
            >
              Жабу
            </Button>
          }
        >
          {loadingAttemptDetail ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div className="su-spinner" style={{ margin: '0 auto 10px' }} />
              <p>Студент жауаптары жүктелуде...</p>
            </div>
          ) : attemptDetail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header stats summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  padding: '12px',
                  background: 'var(--color-bg-alt, #f8fafc)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Жалпы балл</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#2563eb' }}>
                    {attemptDetail.score ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Пайыз</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>
                    {attemptDetail.percentage ?? 0}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Дұрыс жауаптар</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    {attemptDetail.correctAnswers} / {attemptDetail.totalQuestions}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Күйі</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                    {attemptDetail.status}
                  </div>
                </div>
              </div>

              {/* Answers list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {attemptDetail.answers.map((ans: AnswerDetailItem, idx: number) => {
                  const isOpenText = ans.questionType === 'OPEN_TEXT';
                  const isGraded = ans.score !== null;

                  return (
                    <div
                      key={ans.id}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border, #e2e8f0)',
                        background: '#ffffff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '14px' }}>{idx + 1}-сұрақ: </strong>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>({ans.questionType})</span>
                        </div>
                        <div>
                          {isOpenText ? (
                            isGraded ? (
                              <Badge variant="success">Бағаланды: {ans.score} / {ans.points}</Badge>
                            ) : (
                              <Badge variant="warning">Тексеру қажет</Badge>
                            )
                          ) : ans.isCorrect ? (
                            <Badge variant="success">Дұрыс ({ans.score} / {ans.points})</Badge>
                          ) : (
                            <Badge variant="danger">Қате (0 / {ans.points})</Badge>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b', marginBottom: '10px' }}>
                        {ans.questionText}
                      </div>

                      {/* Display response */}
                      <div
                        style={{
                          padding: '10px 14px',
                          background: 'var(--color-bg-alt, #f8fafc)',
                          borderRadius: '6px',
                          fontSize: '13px',
                          marginBottom: '10px',
                        }}
                      >
                        {isOpenText ? (
                          <div>
                            <span style={{ color: '#64748b' }}>Студенттің ашық жауабы: </span>
                            <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                              {ans.textAnswer || '(Жауап берілмеген)'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ color: '#64748b' }}>Таңдалған нұсқалар: </span>
                            <strong>
                              {ans.options
                                .filter((o) => ans.selectedOptionIds.includes(o.id))
                                .map((o) => o.optionText)
                                .join(', ') || '(Ештеңе таңдалмаған)'}
                            </strong>
                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#16a34a' }}>
                              Дұрыс нұсқа(лар): {ans.options.filter((o) => o.isCorrect).map((o) => o.optionText).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Teacher grading section for OPEN_TEXT */}
                      {isOpenText && (
                        <div style={{ marginTop: '10px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                          {gradingQuestionId === ans.questionId ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                                  Балл (0 - {ans.points}):
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={ans.points}
                                  value={gradingScore}
                                  onChange={(e) => setGradingScore(Number(e.target.value))}
                                  style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                              </div>
                              <input
                                type="text"
                                placeholder="Оқытушы пікірі (міндетті емес)..."
                                value={gradingComment}
                                onChange={(e) => setGradingComment(e.target.value)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={isSavingGrade}
                                  onClick={() => handleGradeOpenQuestion(ans.questionId, ans.points)}
                                >
                                  Бағаны сақтау
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setGradingQuestionId(null)}
                                >
                                  Бас тарту
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {ans.teacherComment ? `Пікір: "${ans.teacherComment}"` : ''}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setGradingQuestionId(ans.questionId);
                                  setGradingScore(ans.score ?? ans.points);
                                  setGradingComment(ans.teacherComment || '');
                                }}
                              >
                                {isGraded ? 'Бағаны өзгерту' : 'Бағалау'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </AppShell>
  );
};

export default TeacherTestResultsPage;
