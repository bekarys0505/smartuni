import React, { useEffect, useState } from 'react';
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
import { api } from '../utils/api';

interface TeacherTestItem {
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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResultsImmediately: boolean;
  createdAt: string;
  updatedAt: string;
  questionsCount: number;
  totalPoints: number;
  attemptsCount: number;
  completedAttemptsCount: number;
}

interface SubjectWithTopics {
  id: string;
  name: string;
  code: string | null;
  topics: Array<{
    id: string;
    title: string;
    order: number;
  }>;
}

interface QuestionOptionDraft {
  optionText: string;
  isCorrect: boolean;
}

export const TeacherTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TeacherTestItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Test Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubjectId, setCreateSubjectId] = useState('');
  const [createTopicId, setCreateTopicId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDuration, setCreateDuration] = useState(15);
  const [createShuffleQuestions, setCreateShuffleQuestions] = useState(false);
  const [createShuffleAnswers, setCreateShuffleAnswers] = useState(false);
  const [createShowResults, setCreateShowResults] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Manage Questions Modal state
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [loadingTestDetails, setLoadingTestDetails] = useState(false);

  // New question form in modal
  const [newQuestionType, setNewQuestionType] = useState<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT'>('SINGLE_CHOICE');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionPoints, setNewQuestionPoints] = useState(1);
  const [newQuestionExplanation, setNewQuestionExplanation] = useState('');
  const [newQuestionOptions, setNewQuestionOptions] = useState<QuestionOptionDraft[]>([
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
  ]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const fetchTestsAndSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const [testsData, subsData] = await Promise.all([
        api.get<{ tests: TeacherTestItem[] }>('/api/teacher/tests'),
        api.get<{ subjects: any[] }>('/api/teacher/subjects-and-topics').catch(() => ({ subjects: [] })),
      ]);

      setTests(testsData.tests || []);
      setSubjects(subsData.subjects || []);
      if (subsData.subjects && subsData.subjects.length > 0 && !createSubjectId) {
        setCreateSubjectId(subsData.subjects[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Сервер қатесі');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestsAndSubjects();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createSubjectId) {
      alert('Тест атауы мен пәнді таңдаңыз');
      return;
    }

    try {
      setIsCreating(true);
      await api.post('/api/teacher/tests', {
        subjectId: createSubjectId,
        topicId: createTopicId || null,
        title: createTitle.trim(),
        description: createDescription.trim() || null,
        durationMinutes: Number(createDuration),
        shuffleQuestions: createShuffleQuestions,
        shuffleAnswers: createShuffleAnswers,
        showResultsImmediately: createShowResults,
      });

      setIsCreateModalOpen(false);
      setCreateTitle('');
      setCreateDescription('');
      fetchTestsAndSubjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenQuestionsModal = async (testId: string) => {
    try {
      setLoadingTestDetails(true);
      setIsQuestionsModalOpen(true);
      const data = await api.get<{ test: any }>(`/api/teacher/tests/${testId}`);
      setSelectedTest(data.test);
      resetNewQuestionForm();
    } catch (err: any) {
      alert(err.message);
      setIsQuestionsModalOpen(false);
    } finally {
      setLoadingTestDetails(false);
    }
  };

  const resetNewQuestionForm = () => {
    setNewQuestionType('SINGLE_CHOICE');
    setNewQuestionText('');
    setNewQuestionPoints(1);
    setNewQuestionExplanation('');
    setNewQuestionOptions([
      { optionText: '', isCorrect: true },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ]);
  };

  const handleAddQuestionToTest = async () => {
    if (!selectedTest) return;
    if (!newQuestionText.trim()) {
      alert('Сұрақ мәтінін енгізіңіз');
      return;
    }

    let payloadOptions = newQuestionOptions;
    if (newQuestionType === 'TRUE_FALSE') {
      payloadOptions = [
        { optionText: 'Иә (True)', isCorrect: newQuestionOptions[0]?.isCorrect ?? true },
        { optionText: 'Жоқ (False)', isCorrect: !newQuestionOptions[0]?.isCorrect },
      ];
    } else if (newQuestionType === 'OPEN_TEXT') {
      payloadOptions = [];
    }

    try {
      setIsAddingQuestion(true);
      await api.post(`/api/teacher/tests/${selectedTest.id}/questions`, {
        type: newQuestionType,
        questionText: newQuestionText.trim(),
        points: Number(newQuestionPoints),
        explanation: newQuestionExplanation.trim() || undefined,
        options: payloadOptions,
      });

      // Reload test details
      handleOpenQuestionsModal(selectedTest.id);
      fetchTestsAndSubjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedTest || !confirm('Бұл сұрақты өшіруді растайсыз ба?')) return;
    try {
      await api.delete(`/api/teacher/tests/${selectedTest.id}/questions/${questionId}`);
      handleOpenQuestionsModal(selectedTest.id);
      fetchTestsAndSubjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePublishTest = async (testId: string) => {
    if (!confirm('Бұл тестті жариялауды растайсыз ба? Ол студенттерге көрінеді.')) return;
    try {
      await api.post(`/api/teacher/tests/${testId}/publish`);
      alert('Тест сәтті жарияланды!');
      fetchTestsAndSubjects();
      if (isQuestionsModalOpen) setIsQuestionsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleArchiveTest = async (testId: string) => {
    if (!confirm('Бұл тестті мұрағаттауды растайсыз ба?')) return;
    try {
      await api.post(`/api/teacher/tests/${testId}/archive`);
      fetchTestsAndSubjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Бұл тестті толық өшіруді растайсыз ба? Барлық сұрақтар мен нәтижелер өшеді.')) return;
    try {
      await api.delete(`/api/teacher/tests/${testId}`);
      fetchTestsAndSubjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PUBLISHED') return <Badge variant="success">Жарияланды</Badge>;
    if (status === 'ARCHIVED') return <Badge variant="neutral">Мұрағатта</Badge>;
    return <Badge variant="warning">Жоба (Draft)</Badge>;
  };

  const selectedSubject = subjects.find((s) => s.id === createSubjectId);

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container">
        <PageHeader
          title="Онлайн тесттер"
          subtitle="Студенттерге арналған тесттер құрастыру, жариялау және нәтижелерін тексеру"
          breadcrumbs={[
            { label: 'Оқытушы', path: '/teacher/dashboard' },
            { label: 'Тесттер' },
          ]}
          actions={
            <Button
              variant="primary"
              icon={<Icon name="plus" size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Жаңа тест жасау
            </Button>
          }
        />

        {/* Loading */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {[1, 2, 3].map((n) => (
              <Card key={n}>
                <CardBody>
                  <Skeleton width="50%" height="20px" style={{ marginBottom: '12px' }} />
                  <Skeleton width="100%" height="60px" style={{ marginBottom: '16px' }} />
                  <Skeleton width="100%" height="36px" />
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
            onRetry={fetchTestsAndSubjects}
          />
        )}

        {/* Empty */}
        {!loading && !error && tests.length === 0 && (
          <EmptyState
            title="Тесттер жоқ"
            description="Сіз әлі ешқандай тест жасамағансыз. «Жаңа тест жасау» батырмасын басып бастаңыз."
            icon={<Icon name="check-circle" size={48} />}
            action={
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Жаңа тест құру
              </Button>
            }
          />
        )}

        {/* Tests List */}
        {!loading && !error && tests.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px',
            }}
          >
            {tests.map((test) => (
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
                    {getStatusBadge(test.status)}
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', margin: '0 0 8px 0' }}>
                    {test.title}
                  </h3>

                  {test.description && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)', margin: '0 0 16px 0', lineHeight: '1.5', flex: 1 }}>
                      {test.description}
                    </p>
                  )}

                  {test.topicTitle && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)', marginBottom: '14px' }}>
                      📌 Тақырып: <strong>{test.topicTitle}</strong>
                    </div>
                  )}

                  {/* Test Stats */}
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
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                        ⏱ {test.durationMinutes} мин
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>Сұрақтар</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                        ❓ {test.questionsCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>Тапсырғандар</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                        👥 {test.completedAttemptsCount}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenQuestionsModal(test.id)}
                    >
                      Сұрақтар ({test.questionsCount})
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/teacher/tests/${test.id}/results`)}
                    >
                      Нәтижелер ({test.completedAttemptsCount})
                    </Button>

                    {test.status === 'DRAFT' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePublishTest(test.id)}
                      >
                        Жариялау
                      </Button>
                    )}

                    {test.status === 'PUBLISHED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchiveTest(test.id)}
                      >
                        Мұрағаттау
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteTest(test.id)}
                    >
                      🗑
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Create Test Modal                                    */}
        {/* ---------------------------------------------------- */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Жаңа онлайн тест құру"
          maxWidth="700px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Бас тарту
              </Button>
              <Button variant="primary" loading={isCreating} onClick={handleCreateTest}>
                Тестті құру (Draft)
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateTest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Пән *
                </label>
                <select
                  value={createSubjectId}
                  onChange={(e) => {
                    setCreateSubjectId(e.target.value);
                    setCreateTopicId('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    background: '#fff',
                  }}
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Тақырып (міндетті емес)
                </label>
                <select
                  value={createTopicId}
                  onChange={(e) => setCreateTopicId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    background: '#fff',
                  }}
                >
                  <option value="">-- Тақырыпсыз (Жалпы пән бойынша) --</option>
                  {selectedSubject?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Тест атауы *
              </label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Мысалы: HTML негіздері бойынша тест"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Сипаттамасы
              </label>
              <textarea
                rows={3}
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Тест мақсаты мен студенттерге арналған нұсқаулық..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Ұзақтығы (минут) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={createDuration}
                  onChange={(e) => setCreateDuration(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createShuffleQuestions}
                  onChange={(e) => setCreateShuffleQuestions(e.target.checked)}
                />
                Сұрақтар ретін араластыру (Shuffle questions)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createShuffleAnswers}
                  onChange={(e) => setCreateShuffleAnswers(e.target.checked)}
                />
                Жауап нұсқаларын араластыру (Shuffle answers)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createShowResults}
                  onChange={(e) => setCreateShowResults(e.target.checked)}
                />
                Нәтижені және қателерді тест аяқталған бойда көрсету
              </label>
            </div>
          </form>
        </Modal>

        {/* ---------------------------------------------------- */}
        {/* Manage Questions Modal                               */}
        {/* ---------------------------------------------------- */}
        <Modal
          isOpen={isQuestionsModalOpen}
          onClose={() => setIsQuestionsModalOpen(false)}
          title={`Сұрақтар конструкторы: ${selectedTest?.title || ''}`}
          maxWidth="850px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div>
                {selectedTest?.status === 'DRAFT' && (
                  <Button
                    variant="success"
                    onClick={() => handlePublishTest(selectedTest.id)}
                  >
                    Тестті жариялау
                  </Button>
                )}
              </div>
              <Button variant="secondary" onClick={() => setIsQuestionsModalOpen(false)}>
                Жабу
              </Button>
            </div>
          }
        >
          {loadingTestDetails ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div className="su-spinner" style={{ margin: '0 auto 10px' }} />
              <p>Мәліметтер жүктелуде...</p>
            </div>
          ) : selectedTest ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Existing questions list */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600 }}>
                  Қазіргі сұрақтар ({selectedTest.questions.length})
                </h4>

                {selectedTest.questions.length === 0 ? (
                  <div
                    style={{
                      padding: '20px',
                      background: 'var(--color-bg-alt, #f8fafc)',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted, #64748b)',
                    }}
                  >
                    Бұл тестте әзірге сұрақ жоқ. Төмендегі форма арқылы жаңа сұрақ қосыңыз.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
                    {selectedTest.questions.map((q: any, idx: number) => (
                      <div
                        key={q.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border, #e2e8f0)',
                          background: 'var(--color-bg-surface, #ffffff)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px' }}>{idx + 1}.</strong>
                            <Badge variant="neutral">{q.type}</Badge>
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                              {q.points} балл
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '6px' }}>
                            {q.questionText}
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Нұсқалар: {q.options.map((o: any) => o.optionText + (o.isCorrect ? ' (✓)' : '')).join(', ')}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ color: '#dc2626' }}
                          onClick={() => handleDeleteQuestion(q.id)}
                        >
                          Өшіру
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Question Section */}
              <div
                style={{
                  padding: '20px',
                  background: 'var(--color-bg-alt, #f8fafc)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border, #e2e8f0)',
                }}
              >
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>
                  ➕ Жаңа сұрақ қосу
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Сұрақ типі
                    </label>
                    <select
                      value={newQuestionType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setNewQuestionType(val);
                        if (val === 'TRUE_FALSE') {
                          setNewQuestionOptions([
                            { optionText: 'Иә (True)', isCorrect: true },
                            { optionText: 'Жоқ (False)', isCorrect: false },
                          ]);
                        } else if (val === 'OPEN_TEXT') {
                          setNewQuestionOptions([]);
                        } else if (newQuestionOptions.length < 2) {
                          setNewQuestionOptions([
                            { optionText: '', isCorrect: true },
                            { optionText: '', isCorrect: false },
                            { optionText: '', isCorrect: false },
                            { optionText: '', isCorrect: false },
                          ]);
                        }
                      }}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="SINGLE_CHOICE">Бір дұрыс жауап (Single Choice)</option>
                      <option value="MULTIPLE_CHOICE">Бірнеше дұрыс жауап (Multiple Choice)</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="OPEN_TEXT">Ашық жазбаша жауап (Open Text)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Ұпай (балл)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newQuestionPoints}
                      onChange={(e) => setNewQuestionPoints(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Сұрақ мәтіні *
                  </label>
                  <textarea
                    rows={2}
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Сұрақты осында жазыңыз..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Options Builder for SINGLE_CHOICE / MULTIPLE_CHOICE */}
                {(newQuestionType === 'SINGLE_CHOICE' || newQuestionType === 'MULTIPLE_CHOICE') && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                      Жауап нұсқалары (Дұрыс жауапты белгілеңіз):
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newQuestionOptions.map((opt, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type={newQuestionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={(e) => {
                              if (newQuestionType === 'SINGLE_CHOICE') {
                                setNewQuestionOptions((prev) =>
                                  prev.map((o, i) => ({ ...o, isCorrect: i === idx }))
                                );
                              } else {
                                setNewQuestionOptions((prev) =>
                                  prev.map((o, i) =>
                                    i === idx ? { ...o, isCorrect: e.target.checked } : o
                                  )
                                );
                              }
                            }}
                          />
                          <input
                            type="text"
                            placeholder={`${idx + 1}-нұсқа мәтіні`}
                            value={opt.optionText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewQuestionOptions((prev) =>
                                prev.map((o, i) => (i === idx ? { ...o, optionText: val } : o))
                              );
                            }}
                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                          {newQuestionOptions.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setNewQuestionOptions((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      style={{ marginTop: '8px' }}
                      onClick={() =>
                        setNewQuestionOptions((prev) => [
                          ...prev,
                          { optionText: '', isCorrect: false },
                        ])
                      }
                    >
                      + Нұсқа қосу
                    </Button>
                  </div>
                )}

                {/* TRUE_FALSE Option selector */}
                {newQuestionType === 'TRUE_FALSE' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                      Дұрыс мән:
                    </label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tfOption"
                          checked={newQuestionOptions[0]?.isCorrect}
                          onChange={() =>
                            setNewQuestionOptions([
                              { optionText: 'Иә (True)', isCorrect: true },
                              { optionText: 'Жоқ (False)', isCorrect: false },
                            ])
                          }
                        />
                        Иә (True)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tfOption"
                          checked={!newQuestionOptions[0]?.isCorrect}
                          onChange={() =>
                            setNewQuestionOptions([
                              { optionText: 'Иә (True)', isCorrect: false },
                              { optionText: 'Жоқ (False)', isCorrect: true },
                            ])
                          }
                        />
                        Жоқ (False)
                      </label>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Түсіндірме (қатені талдағанда көрінеді)
                  </label>
                  <input
                    type="text"
                    value={newQuestionExplanation}
                    onChange={(e) => setNewQuestionExplanation(e.target.value)}
                    placeholder="Мысалы: HTML — HyperText Markup Language..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <Button
                  variant="primary"
                  loading={isAddingQuestion}
                  onClick={handleAddQuestionToTest}
                >
                  Сұрақты тестке сақтау
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </AppShell>
  );
};

export default TeacherTestsPage;

