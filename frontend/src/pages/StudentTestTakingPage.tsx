import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  Card,
  CardBody,
  Button,
  ProgressBar,
  Modal,
  ErrorState,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';

interface QuestionOption {
  id: string;
  optionText: string;
  order: number;
}

interface QuestionItem {
  id: string;
  order: number;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT';
  questionText: string;
  points: number;
  options: QuestionOption[];
  studentAnswer: {
    textAnswer: string | null;
    selectedOptionIds: string[];
    isAnswered: boolean;
  };
}

interface AttemptData {
  id: string;
  testId: string;
  testTitle: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  startedAt: string;
  expiresAt: string;
  durationMinutes: number;
  totalQuestions: number;
  answeredCount: number;
}

export const StudentTestTakingPage: React.FC = () => {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current question answer state
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoSubmittedRef = useRef(false);

  const fetchAttempt = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const res = await fetch(`/api/student/tests/${testId}/attempt/${attemptId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Тест мәліметтерін жүктеу мүмкін болмады');
      }

      const data = await res.json();
      setAttempt(data.attempt);
      setQuestions(data.questions || []);

      if (data.attempt.status !== 'IN_PROGRESS') {
        navigate(`/student/tests/${testId}/result/${attemptId}`);
        return;
      }

      // Calculate timer
      const expiresAt = new Date(data.attempt.expiresAt).getTime();
      const now = new Date().getTime();
      const diffSec = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeftSeconds(diffSec);

      // Initialize current question
      if (data.questions && data.questions.length > 0) {
        const firstQ = data.questions[0];
        setSelectedOptionIds(firstQ.studentAnswer?.selectedOptionIds || []);
        setTextAnswer(firstQ.studentAnswer?.textAnswer || '');
      }
    } catch (err: any) {
      setError(err.message || 'Сервер қатесі');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempt();
  }, [testId, attemptId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  const handleAutoSubmit = async () => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    try {
      const token = getToken();
      await fetch(`/api/student/tests/${testId}/attempt/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Тестке берілген уақыт аяқталды! Нәтиже автоматты түрде қабылданды.');
      navigate(`/student/tests/${testId}/result/${attemptId}`);
    } catch {
      navigate(`/student/tests/${testId}/result/${attemptId}`);
    }
  };

  const syncCurrentQuestionState = (index: number) => {
    const q = questions[index];
    if (q) {
      setSelectedOptionIds(q.studentAnswer?.selectedOptionIds || []);
      setTextAnswer(q.studentAnswer?.textAnswer || '');
    }
  };

  const handleSaveAnswer = async (nextOptionIds = selectedOptionIds, nextText = textAnswer) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    try {
      setSavingAnswer(true);
      const token = getToken();
      await fetch(`/api/student/tests/${testId}/attempt/${attemptId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedOptionIds: nextOptionIds,
          textAnswer: nextText,
        }),
      });

      // Update in local memory
      setQuestions((prev) =>
        prev.map((q, idx) =>
          idx === currentIndex
            ? {
                ...q,
                studentAnswer: {
                  selectedOptionIds: nextOptionIds,
                  textAnswer: nextText,
                  isAnswered: Boolean(nextText.trim() || nextOptionIds.length > 0),
                },
              }
            : q
        )
      );
    } catch (err) {
      console.error('Жауапты сақтау қатесі:', err);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    let updated: string[] = [];
    if (currentQ.type === 'SINGLE_CHOICE' || currentQ.type === 'TRUE_FALSE') {
      updated = [optionId];
    } else if (currentQ.type === 'MULTIPLE_CHOICE') {
      if (selectedOptionIds.includes(optionId)) {
        updated = selectedOptionIds.filter((id) => id !== optionId);
      } else {
        updated = [...selectedOptionIds, optionId];
      }
    }
    setSelectedOptionIds(updated);
    handleSaveAnswer(updated, textAnswer);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAnswer(e.target.value);
  };

  const handleTextBlur = () => {
    handleSaveAnswer(selectedOptionIds, textAnswer);
  };

  const handlePrev = async () => {
    await handleSaveAnswer();
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setCurrentIndex(nextIdx);
      syncCurrentQuestionState(nextIdx);
    }
  };

  const handleNext = async () => {
    await handleSaveAnswer();
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      syncCurrentQuestionState(nextIdx);
    }
  };

  const handleJumpToQuestion = async (index: number) => {
    await handleSaveAnswer();
    setCurrentIndex(index);
    syncCurrentQuestionState(index);
  };

  const handleSubmitAttempt = async () => {
    try {
      setIsSubmitting(true);
      await handleSaveAnswer();
      const token = getToken();
      const res = await fetch(`/api/student/tests/${testId}/attempt/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Тестті аяқтау сәтсіз болды');
      }

      setIsSubmitModalOpen(false);
      navigate(`/student/tests/${testId}/result/${attemptId}`);
    } catch (err: any) {
      alert(err.message || 'Қате орын алды');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <AppShell userRole="STUDENT">
        <div className="su-content-container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="su-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }} />
          <p style={{ color: 'var(--color-text-muted, #64748b)' }}>Тест сұрақтары жүктелуде...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !attempt) {
    return (
      <AppShell userRole="STUDENT">
        <div className="su-content-container">
          <ErrorState
            title="Тестті ашу қатесі"
            message={error || 'Тест табылмады'}
            onRetry={fetchAttempt}
          />
        </div>
      </AppShell>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isTimeWarning = timeLeftSeconds !== null && timeLeftSeconds <= 120; // 2 minutes

  const answeredQuestionsCount = questions.filter((q) => q.studentAnswer?.isAnswered).length;
  const unansweredCount = questions.length - answeredQuestionsCount;

  return (
    <AppShell userRole="STUDENT">
      <div className="su-content-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Top Bar with title & Timer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--color-bg-surface, #ffffff)',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '20px',
            border: isTimeWarning ? '2px solid #ef4444' : '1px solid var(--color-border, #e2e8f0)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', margin: 0 }}>
              {attempt.testTitle}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)', marginTop: '4px' }}>
              Сұрақ {currentIndex + 1} / {questions.length} (Жауап берілгені: {answeredQuestionsCount})
            </div>
          </div>

          {/* Timer Display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: isTimeWarning ? '#fee2e2' : 'var(--color-bg-alt, #f8fafc)',
              borderRadius: '8px',
              border: isTimeWarning ? '1px solid #f87171' : '1px solid var(--color-border, #e2e8f0)',
              color: isTimeWarning ? '#b91c1c' : 'var(--color-text-main, #1e293b)',
            }}
          >
            <Icon name="clock" size={20} />
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              {timeLeftSeconds !== null ? formatTimer(timeLeftSeconds) : '--:--'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '20px' }}>
          <ProgressBar
            value={currentIndex + 1}
            max={questions.length}
            variant="primary"
            size="sm"
          />
        </div>

        {/* Questions Grid Selector */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            background: 'var(--color-bg-surface, #ffffff)',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid var(--color-border, #e2e8f0)',
          }}
        >
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = q.studentAnswer?.isAnswered;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleJumpToQuestion(idx)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: isCurrent
                    ? '2px solid var(--color-primary, #2563eb)'
                    : '1px solid var(--color-border, #cbd5e1)',
                  background: isCurrent
                    ? 'var(--color-primary, #2563eb)'
                    : isAnswered
                    ? '#dcfce7'
                    : 'transparent',
                  color: isCurrent
                    ? '#ffffff'
                    : isAnswered
                    ? '#166534'
                    : 'var(--color-text-main, #1e293b)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        {currentQ && (
          <Card style={{ marginBottom: '24px' }}>
            <CardBody style={{ padding: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-primary, #2563eb)',
                    background: 'rgba(37, 99, 235, 0.08)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {currentIndex + 1}-сұрақ ({currentQ.points} балл)
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>
                  {currentQ.type === 'SINGLE_CHOICE' && 'Бір дұрыс жауап'}
                  {currentQ.type === 'MULTIPLE_CHOICE' && 'Бірнеше дұрыс жауап таңдаңыз'}
                  {currentQ.type === 'TRUE_FALSE' && 'True немесе False'}
                  {currentQ.type === 'OPEN_TEXT' && 'Ашық жазбаша жауап'}
                </span>
              </div>

              {/* Question Text */}
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--color-text-main, #1e293b)',
                  lineHeight: '1.6',
                  margin: '0 0 24px 0',
                }}
              >
                {currentQ.questionText}
              </h3>

              {/* Options */}
              {currentQ.type !== 'OPEN_TEXT' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOptionIds.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleOptionSelect(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 18px',
                          borderRadius: '8px',
                          border: isSelected
                            ? '2px solid var(--color-primary, #2563eb)'
                            : '1px solid var(--color-border, #cbd5e1)',
                          background: isSelected
                            ? 'rgba(37, 99, 235, 0.04)'
                            : 'var(--color-bg-surface, #ffffff)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: currentQ.type === 'MULTIPLE_CHOICE' ? '4px' : '50%',
                            border: isSelected
                              ? '6px solid var(--color-primary, #2563eb)'
                              : '2px solid #94a3b8',
                            background: '#ffffff',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '15px',
                            color: 'var(--color-text-main, #1e293b)',
                            lineHeight: '1.4',
                            userSelect: 'none',
                          }}
                        >
                          {opt.optionText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* OPEN_TEXT input */
                <div>
                  <textarea
                    rows={6}
                    value={textAnswer}
                    onChange={handleTextChange}
                    onBlur={handleTextBlur}
                    placeholder="Жауабыңызды осында толық жазыңыз..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border, #cbd5e1)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)', marginTop: '4px' }}>
                    * Жауап автоматты түрде сақталады. Оны оқытушы жеке тексереді.
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <Button
            variant="outline"
            disabled={currentIndex === 0 || savingAnswer}
            onClick={handlePrev}
            icon={<Icon name="chevron-left" size={16} />}
          >
            Алдыңғы
          </Button>

          <Button
            variant="danger"
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Тестті аяқтау
          </Button>

          <Button
            variant={isLastQuestion ? 'secondary' : 'primary'}
            disabled={isLastQuestion || savingAnswer}
            onClick={handleNext}
            icon={<Icon name="chevron-right" size={16} />}
            iconPosition="right"
          >
            Келесі
          </Button>
        </div>

        {/* Submit Confirmation Modal */}
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Тестті аяқтағыңыз келе ме?"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsSubmitModalOpen(false)}
              >
                Жалғастыру
              </Button>
              <Button
                variant="danger"
                loading={isSubmitting}
                onClick={handleSubmitAttempt}
              >
                Иә, тестті аяқтау
              </Button>
            </div>
          }
        >
          <div style={{ lineHeight: '1.6', color: 'var(--color-text-main, #1e293b)' }}>
            <p style={{ margin: '0 0 16px 0' }}>
              Сіз тестті аяқтауға сұраныс бердіңіз. Барлық берілген жауаптар автоматты бағалауға жіберіледі.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '16px',
                background: 'var(--color-bg-alt, #f8fafc)',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>Жауап берілгені</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                  {answeredQuestionsCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>Жауап берілмегені</div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: unansweredCount > 0 ? '#dc2626' : '#64748b',
                    marginTop: '2px',
                  }}
                >
                  {unansweredCount}
                </div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p style={{ fontSize: '13px', color: '#dc2626', margin: '14px 0 0 0' }}>
                ⚠️ Назар аударыңыз: {unansweredCount} сұраққа әлі жауап берілмеді!
              </p>
            )}
          </div>
        </Modal>
      </div>
    </AppShell>
  );
};

export default StudentTestTakingPage;
