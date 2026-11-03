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

interface LabAssignment {
  id: string;
  title: string;
  description: string | null;
  maxScore: number;
  assignedAt: string;
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
  teacher: {
    id: string;
    fullName: string;
  };
  submission?: {
    id: string;
    textAnswer: string | null;
    fileUrl: string | null;
    status: string;
    score: number | null;
    teacherComment: string | null;
    submittedAt: string | null;
    gradedAt: string | null;
  } | null;
}

export const StudentLabsPage: React.FC = () => {
  const [labs, setLabs] = useState<LabAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Submission modal state
  const [selectedLab, setSelectedLab] = useState<LabAssignment | null>(null);
  const [textReport, setTextReport] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchLabs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ assignments: LabAssignment[] }>('/api/student/assignments');
      const allAssignments = data.assignments || [];
      // Include all practical/lab or general assignments for student view
      setLabs(allAssignments);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Зертханалық жұмыстарды жүктеу кезінде қате орын алды';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const openSubmitModal = (lab: LabAssignment) => {
    setSelectedLab(lab);
    setTextReport(lab.submission?.textAnswer || '');
    setReportUrl(lab.submission?.fileUrl || '');
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab) return;
    if (!textReport.trim() && !reportUrl.trim()) {
      setSubmitError('Есеп мәтінін немесе сілтемені толтырыңыз.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/api/student/assignments/${selectedLab.id}/submit`, {
        textAnswer: textReport.trim() || undefined,
        fileUrl: reportUrl.trim() || undefined,
      });
      setSubmitSuccess('Зертханалық жұмыс есебі сәтті өткізілді!');
      fetchLabs();
      setTimeout(() => {
        setSelectedLab(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Есепті жіберу кезінде қателік туындады';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Unique subjects for filter
  const subjects = Array.from(new Set(labs.map((l) => l.subject.name)));

  // Filtered list
  const filteredLabs = labs.filter((lab) => {
    const isSubmitted = !!lab.submission && lab.submission.status !== 'NOT_SUBMITTED';
    const isGraded = lab.submission?.status === 'GRADED';

    if (activeTab === 'PENDING' && isSubmitted) return false;
    if (activeTab === 'SUBMITTED' && (!isSubmitted || isGraded)) return false;
    if (activeTab === 'GRADED' && !isGraded) return false;

    if (selectedSubject !== 'ALL' && lab.subject.name !== selectedSubject) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = lab.title.toLowerCase().includes(q);
      const matchSubject = lab.subject.name.toLowerCase().includes(q);
      const matchTopic = lab.topic.title.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchTopic) return false;
    }

    return true;
  });

  const getStatusBadge = (lab: LabAssignment) => {
    if (!lab.submission || lab.submission.status === 'NOT_SUBMITTED') {
      return <Badge variant="warning">Өткізілмеген</Badge>;
    }
    if (lab.submission.status === 'GRADED') {
      return (
        <Badge variant="success">
          Бағаланды: {lab.submission.score} / {lab.maxScore}
        </Badge>
      );
    }
    return <Badge variant="info">Тексерілуде</Badge>;
  };

  return (
    <AppShell userRole="STUDENT">
      <div className="su-page-container">
        <PageHeader
          title="Зертханалар мен практика"
          subtitle="Зертханалық жұмыстар тізімі, нұсқаулықтар, есептер өткізу және бағалар"
          breadcrumbs={[{ label: 'Студент', path: '/student/dashboard' }, { label: 'Зертханалар' }]}
          actions={
            <Button variant="outline" size="sm" onClick={fetchLabs} loading={loading}>
              <Icon name="refresh" size={16} /> Жаңарту
            </Button>
          }
        />

        {/* Filters & Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'ALL', label: 'Барлығы', count: labs.length },
              {
                key: 'PENDING',
                label: 'Тапсыру қажет',
                count: labs.filter((l) => !l.submission || l.submission.status === 'NOT_SUBMITTED').length,
              },
              {
                key: 'SUBMITTED',
                label: 'Тексерілуде',
                count: labs.filter((l) => l.submission?.status === 'SUBMITTED').length,
              },
              {
                key: 'GRADED',
                label: 'Бағаланғандар',
                count: labs.filter((l) => l.submission?.status === 'GRADED').length,
              },
            ]}
          />

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Жұмыс атауы немесе тақырып бойынша іздеу..."
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

            <div style={{ minWidth: '180px' }}>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  background: '#fff',
                }}
              >
                <option value="ALL">Барлық пәндер</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} padding="md">
                <Skeleton height={24} width="70%" />
                <div style={{ margin: '0.75rem 0' }}>
                  <Skeleton height={16} width="50%" />
                </div>
                <Skeleton height={60} />
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchLabs} />
        ) : filteredLabs.length === 0 ? (
          <EmptyState
            title="Зертханалық жұмыстар табылмады"
            description="Бұл бөлімде әзірге таңдалған сүзгі бойынша жұмыстар жоқ."
            icon="layers"
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredLabs.map((lab) => (
              <Card key={lab.id} padding="md" hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase' }}>
                    {lab.subject.name}
                  </span>
                  {getStatusBadge(lab)}
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  {lab.title}
                </h3>

                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem', lineHeight: '1.4' }}>
                  {lab.description || 'Нұсқаулық бойынша практикалық тапсырманы орындап, есебін өткізіңіз.'}
                </p>

                <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                  <div><strong>Тақырып:</strong> {lab.topic.title}</div>
                  <div><strong>Оқытушы:</strong> {lab.teacher.fullName}</div>
                  <div><strong>Макс. балл:</strong> {lab.maxScore} балл</div>
                  {lab.deadline && (
                    <div><strong>Мерзімі (Deadline):</strong> {new Date(lab.deadline).toLocaleDateString('kk-KZ')}</div>
                  )}
                  {lab.attachmentUrl && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <a
                        href={getDownloadUrl(lab.attachmentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Icon name="download" size={14} /> Нұсқаулық файлын жүктеу
                      </a>
                    </div>
                  )}
                </div>

                {lab.submission?.teacherComment && (
                  <div style={{ background: '#ecfdf5', borderLeft: '3px solid #10b981', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', color: '#065f46', marginBottom: '1rem' }}>
                    <strong>Оқытушы пікірі:</strong> {lab.submission.teacherComment}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Button
                    variant={lab.submission?.status === 'GRADED' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => openSubmitModal(lab)}
                  >
                    {lab.submission && lab.submission.status !== 'NOT_SUBMITTED' ? 'Есепті қайта қарау / түзету' : 'Есеп өткізу'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Submit Lab Report Modal */}
        <Modal
          isOpen={!!selectedLab}
          onClose={() => setSelectedLab(null)}
          title={selectedLab ? `Зертханалық жұмыс: ${selectedLab.title}` : 'Есеп өткізу'}
          maxWidth="600px"
        >
          {selectedLab && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Пән: <strong>{selectedLab.subject.name}</strong> | Макс: <strong>{selectedLab.maxScore} балл</strong>
              </div>

              {submitSuccess && (
                <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '0.875rem' }}>
                  ✓ {submitSuccess}
                </div>
              )}

              {submitError && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.875rem' }}>
                  ⚠️ {submitError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem', color: '#374151' }}>
                  Зертханалық жұмыс есебінің мәтіні / қорытындысы
                </label>
                <textarea
                  rows={5}
                  value={textReport}
                  onChange={(e) => setTextReport(e.target.value)}
                  placeholder="Орындалған жұмыс қадамдары, есептеулер немесе код сипаттамасы..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem', color: '#374151' }}>
                  Есеп файлына немесе GitHub репозиторийге сілтеме
                </label>
                <input
                  type="url"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  placeholder="https://github.com/... немесе Google Drive сілтемесі"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setSelectedLab(null)}>
                  Жабу
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  Жіберу
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AppShell>
  );
};

export default StudentLabsPage;
