import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

interface TeacherGroupSummary {
  id: string;
  name: string;
  course: number;
  semester: number;
  academicYear: string;
}

interface TeacherSubjectItem {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  topicsCount: number;
  groupsCount: number;
  materialsCount: number;
  groups?: TeacherGroupSummary[];
}

interface TeacherSubjectsResponse {
  message: string;
  subjects: TeacherSubjectItem[];
}

export const TeacherSubjectsPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [subjects, setSubjects] = useState<TeacherSubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<TeacherSubjectsResponse>('/api/teacher/subjects');
      setSubjects(res.subjects || []);
    } catch (err: any) {
      setError(err.message || 'Пәндер тізімін жүктеу кезінде қате орын алды');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter((s) => {
      const inName = s.name.toLowerCase().includes(q);
      const inCode = s.code?.toLowerCase().includes(q) ?? false;
      const inDesc = s.description?.toLowerCase().includes(q) ?? false;
      const inGroups = s.groups?.some((g) => g.name.toLowerCase().includes(q)) ?? false;
      return inName || inCode || inDesc || inGroups;
    });
  }, [subjects, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalSubjects = subjects.length;
    const totalGroups = subjects.reduce((acc, s) => acc + (s.groupsCount || 0), 0);
    const totalTopics = subjects.reduce((acc, s) => acc + (s.topicsCount || 0), 0);
    const totalMaterials = subjects.reduce((acc, s) => acc + (s.materialsCount || 0), 0);
    return { totalSubjects, totalGroups, totalTopics, totalMaterials };
  }, [subjects]);

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container">
        <PageHeader
          title="Менің пәндерім"
          subtitle="Сізге бекітілген оқу пәндері, академиялық топтар мен курстық материалдар"
          breadcrumbs={[
            { label: 'Оқытушы', path: '/teacher/dashboard' },
            { label: 'Пәндер' },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubjects}
            >
              Жаңарту
            </Button>
          }
        />

        {/* 1. Loading State */}
        {loading && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <Skeleton height="90px" />
              <Skeleton height="90px" />
              <Skeleton height="90px" />
              <Skeleton height="90px" />
            </div>
            <Skeleton height="56px" style={{ marginBottom: '24px' }} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              <Skeleton height="220px" />
              <Skeleton height="220px" />
            </div>
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <ErrorState
            title="Пәндерді жүктеу мүмкін болмады"
            message={error}
            onRetry={fetchSubjects}
          />
        )}

        {/* 3. Main Content */}
        {!loading && !error && (
          <>
            {/* KPI Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <Card>
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                    Бекітілген пәндер
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--su-primary)' }}>
                    {stats.totalSubjects}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                    Академиялық топтар
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>
                    {stats.totalGroups}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                    Сабақ тақырыптары
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--su-warning)' }}>
                    {stats.totalTopics}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                    Оқу материалдары
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--su-info)' }}>
                    {stats.totalMaterials}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Search Bar */}
            <Card style={{ marginBottom: '24px' }}>
              <CardBody style={{ padding: '16px 20px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Пән атауы, коды немесе оқитын топ бойынша іздеу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: 'var(--su-radius-md, 8px)',
                      border: '1px solid var(--su-border, #e2e8f0)',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'var(--su-bg-surface, #ffffff)',
                      color: 'var(--su-text-main, #1e293b)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--su-text-muted, #94a3b8)',
                      pointerEvents: 'none',
                    }}
                  >
                    <Icon name="search" size={16} />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Subjects Grid */}
            {filteredSubjects.length === 0 ? (
              <EmptyState
                title="Пәндер табылмады"
                description={
                  subjects.length === 0
                    ? 'Сізге әлі ешқандай оқу пәні немесе топ бекітілмеген. Әкімшілік панель арқылы топтар бекітілген соң осында пайда болады.'
                    : 'Іздеу критерийіне сәйкес келетін пәндер жоқ.'
                }
                icon={<Icon name="book" size={48} />}
                action={
                  searchQuery ? (
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                      Іздеуді тазарту
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '20px',
                }}
              >
                {filteredSubjects.map((subject) => (
                  <Card
                    key={subject.id}
                    hoverable
                    style={{
                      border: '1px solid var(--su-border, #e2e8f0)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <CardBody style={{ padding: '22px' }}>
                      {/* Top Header: Code badge & Name */}
                      <div style={{ marginBottom: '14px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <Badge variant="primary" size="sm">
                            {subject.code || 'ПӘН'}
                          </Badge>

                          <span style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                            {subject.groupsCount} оқу тобы
                          </span>
                        </div>

                        <h3
                          style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--su-text-main)',
                            margin: '0 0 6px 0',
                          }}
                        >
                          {subject.name}
                        </h3>

                        {subject.description && (
                          <p
                            style={{
                              fontSize: '13px',
                              color: 'var(--su-text-muted)',
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {subject.description}
                          </p>
                        )}
                      </div>

                      {/* Metrics Bar */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                          padding: '12px 14px',
                          background: 'var(--su-bg-muted, #f8fafc)',
                          borderRadius: 'var(--su-radius-md, 8px)',
                          marginBottom: '16px',
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>
                            Топтар
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                            {subject.groupsCount}
                          </div>
                        </div>

                        <div style={{ borderLeft: '1px solid var(--su-border, #e2e8f0)', borderRight: '1px solid var(--su-border, #e2e8f0)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>
                            Тақырыптар
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--su-primary)' }}>
                            {subject.topicsCount}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>
                            Материалдар
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--su-info)' }}>
                            {subject.materialsCount}
                          </div>
                        </div>
                      </div>

                      {/* Associated Groups Badges */}
                      {subject.groups && subject.groups.length > 0 && (
                        <div style={{ marginBottom: '18px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--su-text-muted)', marginBottom: '6px' }}>
                            Бекітілген топтар:
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {subject.groups.map((grp) => (
                              <Badge
                                key={grp.id}
                                variant="neutral"
                                size="sm"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/teacher/groups/${grp.id}`)}
                                title={`${grp.course}-курс, ${grp.semester}-семестр (Толық мәліметке өту)`}
                              >
                                {grp.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Navigation Actions */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '10px',
                          borderTop: '1px solid var(--su-border, #e2e8f0)',
                          paddingTop: '14px',
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Icon name="layers" size={14} />}
                          onClick={() => navigate(`/teacher/topics?subjectId=${subject.id}`)}
                        >
                          Тақырыптар
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Icon name="folder" size={14} />}
                          onClick={() => navigate(`/teacher/materials?subjectId=${subject.id}`)}
                        >
                          Материалдар
                        </Button>

                        {subject.groups && subject.groups.length > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Icon name="chart" size={14} />}
                            onClick={() => navigate(`/teacher/journal?groupId=${subject.groups![0].id}`)}
                            title="Осы пәннің электронды журналына өту"
                          >
                            Журнал
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};
