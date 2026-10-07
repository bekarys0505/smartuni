import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  ProgressBar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';

interface MaterialTypeProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface LearningProgressData {
  overall: number;
  totalMaterials: number;
  completedMaterials: number;
  lectures: MaterialTypeProgress;
  videos: MaterialTypeProgress;
  additionalResources: MaterialTypeProgress;
}

interface AcademicComponentData {
  available: boolean;
  average?: number;
  score?: number | null;
}

interface AcademicResultsData {
  assignmentAverage: number;
  testAverage: number;
  academicScore: number;
  assignment: AcademicComponentData;
  test: AcademicComponentData;
  rk1: AcademicComponentData;
  rk2: AcademicComponentData;
  semester: AcademicComponentData;
}

interface SubjectProgressItem {
  subjectId: string;
  subjectCode: string | null;
  subjectName: string;
  totalMaterials: number;
  completedMaterials: number;
  percentage: number;
  assignmentAverage: number;
  testAverage: number;
  academicScore: number;
}

interface FullProgressResponse {
  message: string;
  learningProgress: LearningProgressData;
  academicResults: AcademicResultsData;
  subjects: SubjectProgressItem[];
}

export const StudentProgressPage: React.FC = () => {
  const [data, setData] = useState<FullProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const res = await fetch('/api/student/progress', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Оқу үлгерімі деректерін жүктеу мүмкін болмады');
      }

      const resData = await res.json();
      setData(resData);
    } catch (err: any) {
      setError(err.message || 'Сервермен байланыс қатесі');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return (
    <AppShell userRole="STUDENT">
      <div className="su-content-container">
        <PageHeader
          title="Оқу үлгерімі"
          subtitle="Оқу материалдары мен академиялық нәтижелеріңіз"
          breadcrumbs={[
            { label: 'Студент', path: '/student/dashboard' },
            { label: 'Оқу үлгерімі' },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="chart" size={16} />}
              onClick={fetchProgress}
            >
              Жаңарту
            </Button>
          }
        />

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card>
              <CardBody style={{ padding: '32px' }}>
                <Skeleton width="40%" height="28px" style={{ marginBottom: '16px' }} />
                <Skeleton width="100%" height="24px" style={{ marginBottom: '16px' }} />
                <Skeleton width="25%" height="16px" />
              </CardBody>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {[1, 2, 3].map((n) => (
                <Card key={n}>
                  <CardBody>
                    <Skeleton width="60%" height="20px" style={{ marginBottom: '12px' }} />
                    <Skeleton width="100%" height="16px" />
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <ErrorState
            title="Қате орын алды"
            message={error}
            onRetry={fetchProgress}
          />
        )}

        {/* Main Content */}
        {!loading && !error && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* ============================================================== */}
            {/* SECTION 1 — OVERALL LEARNING PROGRESS                          */}
            {/* ============================================================== */}
            <Card>
              <CardBody style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--color-primary, #2563eb)',
                        marginBottom: '6px',
                        display: 'block',
                      }}
                    >
                      LEARNING COMPLETION
                    </span>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-main, #1e293b)', margin: 0 }}>
                      Жалпы оқу прогресі
                    </h2>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '44px',
                        fontWeight: 800,
                        color: 'var(--color-primary, #2563eb)',
                        lineHeight: 1,
                      }}
                    >
                      {data.learningProgress.overall}%
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <ProgressBar
                    value={data.learningProgress.overall}
                    max={100}
                    variant="primary"
                    size="lg"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text-muted, #64748b)' }}>
                  <span>
                    Барлығы: <strong>{data.learningProgress.completedMaterials}</strong> / {data.learningProgress.totalMaterials} оқу материалы аяқталды
                  </span>
                  <span>
                    Қалғаны: {data.learningProgress.totalMaterials - data.learningProgress.completedMaterials} материал
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* ============================================================== */}
            {/* SECTION 2 — MATERIAL PROGRESS BY TYPE                          */}
            {/* ============================================================== */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', margin: '0 0 16px 0' }}>
                Материал түрлері бойынша
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Lectures Card */}
                <Card hoverable>
                  <CardBody style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="book" size={18} />
                        </div>
                        <strong style={{ fontSize: '16px', color: 'var(--color-text-main, #1e293b)' }}>
                          Лекциялар
                        </strong>
                      </div>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>
                        {data.learningProgress.lectures.percentage}%
                      </span>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <ProgressBar
                        value={data.learningProgress.lectures.percentage}
                        max={100}
                        variant="primary"
                        size="md"
                      />
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      {data.learningProgress.lectures.completed} / {data.learningProgress.lectures.total} дәріс оқылды
                    </div>
                  </CardBody>
                </Card>

                {/* Videos Card */}
                <Card hoverable>
                  <CardBody style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(168, 85, 247, 0.1)',
                            color: '#9333ea',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="sparkles" size={18} />
                        </div>
                        <strong style={{ fontSize: '16px', color: 'var(--color-text-main, #1e293b)' }}>
                          Видеолар
                        </strong>
                      </div>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#9333ea' }}>
                        {data.learningProgress.videos.percentage}%
                      </span>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <ProgressBar
                        value={data.learningProgress.videos.percentage}
                        max={100}
                        variant="warning"
                        size="md"
                      />
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      {data.learningProgress.videos.completed} / {data.learningProgress.videos.total} бейнедәріс көрілді
                    </div>
                  </CardBody>
                </Card>

                {/* Additional Resources Card */}
                <Card hoverable>
                  <CardBody style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="folder" size={18} />
                        </div>
                        <strong style={{ fontSize: '16px', color: 'var(--color-text-main, #1e293b)' }}>
                          Қосымша материалдар
                        </strong>
                      </div>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>
                        {data.learningProgress.additionalResources.percentage}%
                      </span>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <ProgressBar
                        value={data.learningProgress.additionalResources.percentage}
                        max={100}
                        variant="success"
                        size="md"
                      />
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      {data.learningProgress.additionalResources.completed} / {data.learningProgress.additionalResources.total} ресурстар аяқталды
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* ============================================================== */}
            {/* SECTION 3 — ACADEMIC RESULTS (GRADES & SCORES)                 */}
            {/* ============================================================== */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', margin: 0 }}>
                  Академиялық нәтижелер
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>
                  Формула: Тапсырмалар (40%) + Тесттер (60%)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Assignment Average Card */}
                <Card>
                  <CardBody style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
                        Тапсырмалар (Assignment)
                      </span>
                      <Badge variant={data.academicResults.assignment.available ? 'primary' : 'neutral'}>
                        Салмағы: 40%
                      </Badge>
                    </div>

                    <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', marginBottom: '8px' }}>
                      {data.academicResults.assignment.available ? `${data.academicResults.assignmentAverage}%` : '—'}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>
                      {data.academicResults.assignment.available
                        ? 'Бағаланған практикалық жұмыстардың орташа көрсеткіші'
                        : 'Әзірге бағаланған тапсырмалар жоқ'}
                    </div>
                  </CardBody>
                </Card>

                {/* Tests Average Card */}
                <Card>
                  <CardBody style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
                        Тесттер (Tests)
                      </span>
                      <Badge variant={data.academicResults.test.available ? 'success' : 'neutral'}>
                        Салмағы: 60%
                      </Badge>
                    </div>

                    <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', marginBottom: '8px' }}>
                      {data.academicResults.test.available ? `${data.academicResults.testAverage}%` : '—'}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>
                      {data.academicResults.test.available
                        ? 'Аяқталған тесттік сынақтардың орташа көрсеткіші'
                        : 'Әзірге өтілген тесттер жоқ'}
                    </div>
                  </CardBody>
                </Card>

                {/* Overall Academic Score Card */}
                <Card
                  style={{
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.12) 100%)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                  }}
                >
                  <CardBody style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary, #2563eb)' }}>
                        Академиялық орташа балл
                      </span>
                      <Badge variant="primary">Қорытынды</Badge>
                    </div>

                    <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-primary, #2563eb)', marginBottom: '8px' }}>
                      {data.academicResults.academicScore > 0 ? `${data.academicResults.academicScore}%` : '—'}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>
                      Студенттің ағымдағы рейтингтік бағасы
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* ============================================================== */}
            {/* SECTION 4 — RK & SEMESTER EXAM CARDS (FUTURE MODULES)          */}
            {/* ============================================================== */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', margin: '0 0 16px 0' }}>
                Аралық және сессиялық бақылаулар
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <Card>
                  <CardBody style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--color-text-main, #1e293b)' }}>1-межелік бақылау (РК1)</strong>
                      <Badge variant="neutral">Жоспарда</Badge>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      Әзірге бағаланбаған
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--color-text-main, #1e293b)' }}>2-межелік бақылау (РК2)</strong>
                      <Badge variant="neutral">Жоспарда</Badge>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      Әзірге бағаланбаған
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--color-text-main, #1e293b)' }}>Семестрлік емтихан</strong>
                      <Badge variant="neutral">Жоспарда</Badge>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748b)' }}>
                      Әзірге бағаланбаған
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* ============================================================== */}
            {/* SECTION 5 — SUBJECT-LEVEL BREAKDOWN                            */}
            {/* ============================================================== */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', margin: '0 0 16px 0' }}>
                Пәндер бойынша үлгерім
              </h3>

              {data.subjects.length === 0 ? (
                <EmptyState
                  title="Пәндер табылмады"
                  description="Сізге әлі ешқандай пән немесе оқу тобы бекітілмеген."
                  icon={<Icon name="book" size={48} />}
                />
              ) : (
                <Card>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg-alt, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                          <th style={{ padding: '16px', fontWeight: 600 }}>Пән атауы</th>
                          <th style={{ padding: '16px', fontWeight: 600 }}>Оқу прогресі</th>
                          <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Тапсырмалар</th>
                          <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Тесттер</th>
                          <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Қорытынды балл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.subjects.map((subj) => (
                          <tr
                            key={subj.subjectId}
                            style={{
                              borderBottom: '1px solid var(--color-border, #e2e8f0)',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                                {subj.subjectName}
                              </div>
                              {subj.subjectCode && (
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748b)' }}>
                                  Коды: {subj.subjectCode}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '16px', minWidth: '180px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                  <ProgressBar
                                    value={subj.percentage}
                                    max={100}
                                    size="sm"
                                  />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb' }}>
                                  {subj.percentage}%
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                {subj.completedMaterials} / {subj.totalMaterials} материал
                              </div>
                            </td>

                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 600, color: subj.assignmentAverage > 0 ? '#1e293b' : '#94a3b8' }}>
                                {subj.assignmentAverage > 0 ? `${subj.assignmentAverage}%` : '—'}
                              </span>
                            </td>

                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 600, color: subj.testAverage > 0 ? '#1e293b' : '#94a3b8' }}>
                                {subj.testAverage > 0 ? `${subj.testAverage}%` : '—'}
                              </span>
                            </td>

                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <strong
                                style={{
                                  fontSize: '15px',
                                  color: subj.academicScore >= 50 ? '#16a34a' : subj.academicScore > 0 ? '#dc2626' : '#94a3b8',
                                }}
                              >
                                {subj.academicScore > 0 ? `${subj.academicScore}%` : '—'}
                              </strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default StudentProgressPage;

