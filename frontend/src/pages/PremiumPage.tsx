import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { PageHeader, Card, Badge, Button, Modal } from '../components/ui';
import { getUser } from '../utils/auth';

export const PremiumPage: React.FC = () => {
  const currentUser = getUser();
  const role = (currentUser?.role || 'STUDENT') as 'STUDENT' | 'TEACHER' | 'ADMIN';

  const [activePlan, setActivePlan] = useState<'STANDARD' | 'PRO'>('PRO');
  const [selectedModalPlan, setSelectedModalPlan] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState(false);

  const handleActivate = (planName: string) => {
    setSelectedModalPlan(planName);
    setActivationSuccess(false);
  };

  const confirmActivation = () => {
    setActivationSuccess(true);
    setActivePlan('PRO');
    setTimeout(() => {
      setSelectedModalPlan(null);
    }, 1500);
  };

  return (
    <AppShell userRole={role}>
      <div className="su-page-container">
        <PageHeader
          title="SmartUni Premium"
          subtitle="Жасанды интеллект көмекшісі, кеңейтілген сақтау қоры және арнайы академиялық мүмкіндіктер"
          breadcrumbs={[{ label: 'Кабинет' }, { label: 'Premium' }]}
          badge={
            <Badge variant="success" size="md">
              {activePlan === 'PRO' ? '★ Pro Жазылым белсенді' : 'Стандартты нұсқа'}
            </Badge>
          }
        />

        {/* Storage & Usage Banner */}
        <Card padding="md" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
                Бұлттық сақтау қоры
              </span>
              <h3 style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 700 }}>
                1.8 GB / 15.0 GB қолданылды
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                Дәріс материалдары, зертханалық есептер мен тест нәтижелері қауіпсіз сақталған.
              </p>
            </div>
            <div style={{ minWidth: '200px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                <div style={{ background: '#10b981', height: '100%', width: '12%' }} />
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.25rem', display: 'block', textAlign: 'right' }}>
                12% қолданылды
              </span>
            </div>
          </div>
        </Card>

        {/* Feature Highlights Grid */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Премиум мүмкіндіктер
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Card padding="md" hoverable>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              SmartUni AI Ассистент
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              Дәрістердің қысқаша мазмұнын шығару, кодты талдау, тест сұрақтарына дайындық және алгоритмдерді түсіндіру.
            </p>
          </Card>

          <Card padding="md" hoverable>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Офлайн режим және синхронизация
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              Оқу материалдарын офлайн оқуға жүктеп алу және интернет болмаған кезде тапсырмаларды дайындау.
            </p>
          </Card>

          <Card padding="md" hoverable>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Тереңдетілген академиялық аналитика
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              GPA болжамы, пәндер бойынша қиындық деңгейлерін талдау және QR-кодпен қорғалған ресми транскрипт экспорттау.
            </p>
          </Card>

          <Card padding="md" hoverable>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
              Басымдықты техникалық қолдау
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              Қолдау қызметіне жіберілген тикеттерге 15 минут ішінде жылдам жауап беру және тікелей инженер кеңесі.
            </p>
          </Card>
        </div>

        {/* Pricing Table */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Тарифтік жоспарлар
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Plan 1 */}
          <Card padding="lg" style={{ border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Стандартты (Campus)
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.75rem 0', color: '#0f172a' }}>
              Тегін
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Университеттегі барлық студенттер мен оқытушыларға арналған базалық мүмкіндіктер.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>✓ Пәндер мен тақырыптарды көру</li>
              <li>✓ Тапсырмалар мен зертханаларды өткізу</li>
              <li>✓ Онлайн тестілеу және журнал</li>
              <li>✓ 5 GB дейін файлдар сақтау</li>
            </ul>

            <div style={{ marginTop: 'auto' }}>
              <Button variant="outline" style={{ width: '100%' }} disabled>
                Қазіргі тариф
              </Button>
            </div>
          </Card>

          {/* Plan 2: Pro */}
          <Card padding="lg" style={{ border: '2px solid #2563eb', boxShadow: '0 4px 12px rgba(37,99,235,0.1)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '16px', background: '#2563eb', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
              ҰСЫНЫЛАДЫ
            </div>
            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              SmartUni Pro
            </h4>
            <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.75rem 0', color: '#2563eb' }}>
              1,990 ₸ <span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>/ ай</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Студенттер мен оқытушылардың академиялық өнімділігін арттыратын кеңейтілген пакет.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>✓ Барлық Стандартты мүмкіндіктер</li>
              <li>✓ <strong>SmartUni AI Ассистент</strong> (шексіз сұрақтар)</li>
              <li>✓ <strong>50 GB</strong> бұлттық сақтау қоры</li>
              <li>✓ Офлайн режимде жұмыс істеу</li>
              <li>✓ QR-кодты ресми электронды транскрипт</li>
              <li>✓ Жедел 24/7 басымдықты қолдау</li>
            </ul>

            <div style={{ marginTop: 'auto' }}>
              <Button variant="primary" style={{ width: '100%' }} onClick={() => handleActivate('SmartUni Pro')}>
                {activePlan === 'PRO' ? 'Жазылымды басқару' : 'Pro нұсқасын қосу'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Modal */}
        <Modal
          isOpen={!!selectedModalPlan}
          onClose={() => setSelectedModalPlan(null)}
          title={`Жазылымды растау: ${selectedModalPlan}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activationSuccess ? (
              <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>🎉 Құттықтаймыз!</h4>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  SmartUni Pro пакеті сіздің аккаунтыңызға сәтті қосылды. Барлық премиум мүмкіндіктер ашық.
                </p>
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                  Сіз <strong>{selectedModalPlan}</strong> тарифін таңдадыңыз. Университеттік аккаунт бойынша студенттер мен оқытушыларға жеңілдік қолданылады.
                </p>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Тариф құны:</span>
                    <strong>1,990 ₸ / ай</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#059669' }}>
                    <span>Университеттік грант:</span>
                    <strong>-100% (Тегін пилот)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
                    <span>Төлем сомасы:</span>
                    <span>0 ₸</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Button variant="outline" onClick={() => setSelectedModalPlan(null)}>
                    Болдырмау
                  </Button>
                  <Button variant="primary" onClick={confirmActivation}>
                    Тегін белсендіру
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </AppShell>
  );
};

export default PremiumPage;
