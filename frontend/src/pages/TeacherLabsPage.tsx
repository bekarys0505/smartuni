import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Modal,
  Tabs,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api, getDownloadUrl } from '../utils/api';

interface TeacherAssignmentItem {
  id: string;
  title: string;
  description: string | null;
  maxScore: number;
  deadline: string | null;
  attachmentUrl: string | null;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  topic: {
    id: string;
    title: string;
  };
  submissions?: Array<{
    id: string;
    studentId: string;
    studentName: string;
    textAnswer: string | null;
    fileUrl: string | null;
    status: string;
    score: number | null;
    teacherComment: string | null;
    submittedAt: string | null;
  }>;
}

export const TeacherLabsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Grading modal state
  const [selectedSubmission, setSelectedSubmission] = useState<{
    assignmentId: string;
    assignmentTitle: string;
    maxScore: number;
    submissionId: string;
    studentName: string;
    textAnswer: string | null;
    fileUrl: string | null;
    score: number | null;
    teacherComment: string | null;
  } | null>(null);

  const [gradeScore, setGradeScore] = useState<number | ''>('');
  const [teacherComment, setTeacherComment] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const fetchTeacherLabs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ assignments: TeacherAssignmentItem[] }>('/api/teacher/assignments');
      setAssignments(data.assignments || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Зертханалық жұмыстарды жүктеу кезінде қате орын алды';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherLabs();
  }, []);

  const openGradingModal = (
    assignment: TeacherAssignmentItem,
    sub: NonNullable<TeacherAssignmentItem['submissions']>[0]
  ) => {
    setSelectedSubmission({
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      maxScore: assignment.maxScore,
      submissionId: sub.id,
      studentName: sub.studentName,
      textAnswer: sub.textAnswer,
      fileUrl: sub.fileUrl,
      score: sub.score,
      teacherComment: sub.teacherComment,
    });
    setGradeScore(sub.score !== null ? sub.score : '');
    setTeacherComment(sub.teacherComment || '');
    setGradeSuccess(null);
    setGradeError(null);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    if (gradeScore === '' || Number(gradeScore) < 0 || Number(gradeScore) > selectedSubmission.maxScore) {
      setGradeError(`Балл 0 мен ${selectedSubmission.maxScore} аралығында болуы қажет.`);
      return;
    }

    setGrading(true);
    setGradeError(null);
    try {
      await api.patch(
        `/api/teacher/assignments/${selectedSubmission.assignmentId}/submissions/${selectedSubmission.submissionId}/grade`,
        {
          score: Number(gradeScore),
          teacherComment: teacherComment.trim() || undefined,
        }
      );

      setGradeSuccess('Баға сәтті сақталды!');
      fetchTeacherLabs();
      setTimeout(() => {
        setSelectedSubmission(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Бағаны сақтау кезінде қате орын алды';
      setGradeError(msg);
    } finally {
      setGrading(false);
    }
  };

  // Flatten submissions
  const allSubmissionsList = assignments.flatMap((a) =>
    (a.submissions || []).map((s) => ({
      ...s,
      assignmentId: a.id,
      assignmentTitle: a.title,
      maxScore: a.maxScore,
      subjectName: a.subject.name,
      deadline: a.deadline,
    }))
  );

  const filteredSubmissions = allSubmissionsList.filter((item) => {
    if (activeTab === 'PENDING' && item.status === 'GRADED') return false;
    if (activeTab === 'GRADED' && item.status !== 'GRADED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.studentName.toLowerCase().includes(q);
      const matchTitle = item.assignmentTitle.toLowerCase().includes(q);
      const matchSub = item.subjectName.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchSub) return false;
    }
    return true;
  });

  return (
    <AppShell userRole="TEACHER">
      <div className="su-page-container">
        <PageHeader
          title="Зертханалық жұмыстарды тексеру"
          subtitle="Студенттердің зертханалық есептері, файлдары, бағалау және кері байланыс"
          breadcrumbs={[{ label: 'Оқытушы', path: '/teacher/dashboard' }, { label: 'Зертханалар' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchTeacherLabs} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Tabs & Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'ALL', label: 'Барлық есептер', count: allSubmissionsList.length },
              {
                key: 'PENDING',
                label: 'Тексеруді күтуде',
                count: allSubmissionsList.filter((s) => s.status !== 'GRADED').length,
              },
              {
                key: 'GRADED',
                label: 'Бағаланғандар',
                count: allSubmissionsList.filter((s) => s.status === 'GRADED').length,
              },
            ]}
          />

          <div style={{ maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Студент аты, жұмыс атауы бойынша іздеу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={28} width="40%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTeacherLabs} />
        ) : filteredSubmissions.length === 0 ? (
          <EmptyState
            title="Зертханалық есептер табылмады"
            description="Студенттер әлі бұл санатта есеп өткізбеген немесе іздеу сәйкес келмеді."
            icon="grid"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Студент</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Зертханалық жұмыс</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Пән</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Тапсырылған уақыт</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Мәртебесі</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Балл</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {sub.studentName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {sub.assignmentTitle}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {sub.subjectName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('kk-KZ') : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={sub.status === 'GRADED' ? 'success' : 'warning'} size="sm">
                          {sub.status === 'GRADED' ? 'Бағаланды' : 'Тексеруде'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        {sub.score !== null ? `${sub.score} / ${sub.maxScore}` : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const asgn = assignments.find((a) => a.id === sub.assignmentId);
                            if (asgn) openGradingModal(asgn, sub);
                          }}
                        >
                          {sub.status === 'GRADED' ? 'Өзгерту' : 'Бағалау'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Grading Modal */}
        <Modal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={selectedSubmission ? `Есепті бағалау: ${selectedSubmission.studentName}` : 'Бағалау'}
          maxWidth="560px"
        >
          {selectedSubmission && (
            <form onSubmit={handleGradeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Тапсырма: <strong>{selectedSubmission.assignmentTitle}</strong> | Макс: <strong>{selectedSubmission.maxScore} балл</strong>
              </div>

              {gradeSuccess && (
                <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '0.875rem' }}>
                  ✓ {gradeSuccess}
                </div>
              )}

              {gradeError && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.875rem' }}>
                  ⚠️ {gradeError}
                </div>
              )}

              {/* Student's answer preview */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Студент өткізген есеп:
                </span>
                <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                  {selectedSubmission.textAnswer || 'Мәтіндік жауап жоқ'}
                </p>
                {selectedSubmission.fileUrl && (
                  <a
                    href={getDownloadUrl(selectedSubmission.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563eb', fontSize: '0.85rem', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Icon name="download" size={14} /> Тіркелген файлды немесе есепті қарау
                  </a>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Қойылатын балл (0 - {selectedSubmission.maxScore})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedSubmission.maxScore}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Оқытушының пікірі мен ескертулері
                </label>
                <textarea
                  rows={3}
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  placeholder="Студентке жұмыс бойынша ұсыныстар мен қателіктерді көрсетіңіз..."
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Жабу
                </Button>
                <Button type="submit" variant="primary" loading={grading}>
                  Бағаны сақтау
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AppShell>
  );
};

export default TeacherLabsPage;
