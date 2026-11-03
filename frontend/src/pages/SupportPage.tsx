import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { PageHeader, Card, Badge, Button, Modal, EmptyState } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getUser } from '../utils/auth';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  response?: string;
}

const FAQS = [
  {
    question: 'Жүйеге кіру немесе құпиясөзді ұмытып қалған жағдайда не істеу керек?',
    answer: 'Кіру бетіндегі "Құпиясөзді ұмыттыңыз ба?" сілтемесі арқылы корпоративтік поштаңызға қалпына келтіру сілтемесін ала аласыз немесе деканаттың жүйелік әкімшісіне хабарласыңыз.',
  },
  {
    question: 'Зертханалық жұмыстың есебін қалай қайта өткізуге болады?',
    answer: 'Егер оқытушы есепті қайта қарауға қайтарса, "Зертханалар" бөліміндегі жұмыс карточкасынан "Есепті қайта қарау / түзету" батырмасын басып, жаңартылған файлды немесе жауапты қайта жібере аласыз.',
  },
  {
    question: 'Бағалар ведомосі мен РК (рейтингтік бақылау) баллдары қашан жаңарады?',
    answer: 'Оқытушы баға қойған сәтте бағалар базаға автоматты түрде енгізіліп, сіздің электронды күнделігіңіз бен оқу тарихыңызда бірден көрінеді.',
  },
  {
    question: 'Онлайн тест тапсыру кезінде интернет үзілсе не болады?',
    answer: 'SmartUni тест жүйесі әрбір белгіленген жауапты секунд сайын автоматты сақтайды. Интернет қайта қосылғанда қалған уақыт шеңберінде тестілеуді сол сұрақтан жалғастыра аласыз.',
  },
  {
    question: 'Оқу тобына немесе жаңа пәнге қосылу өтініші қалай қаралады?',
    answer: 'Студент топқа тіркелу өтінішін жіберген соң, топ оқытушысы мен әкімші өз кабинетіндегі "Қосылу өтініштері" бөлімінде өтінішті мақұлдайды.',
  },
];

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TICK-1024',
    subject: 'Web-технологиялар пәні бойынша күнделікте баға көрсетілмеуде',
    category: 'Академиялық',
    priority: 'HIGH',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    response: 'Оқытушы журналды жаңартты, бағаңыз қазір күнделікте көрініп тұр.',
  },
  {
    id: 'TICK-1031',
    subject: 'Мобильді нұсқада күнтізбе жүктелуі бойынша ұсыныс',
    category: 'Техникалық',
    priority: 'NORMAL',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    response: 'Сұранысыңыз әзірлеушілер тобына берілді.',
  },
];

export const SupportPage: React.FC = () => {
  const currentUser = getUser();
  const role = (currentUser?.role || 'STUDENT') as 'STUDENT' | 'TEACHER' | 'ADMIN';

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [searchFaq, setSearchFaq] = useState('');

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem(`smartuni_support_tickets_${currentUser?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TICKETS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Техникалық');
  const [newPriority, setNewPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [newDetails, setNewDetails] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`smartuni_support_tickets_${currentUser?.id || 'guest'}`, JSON.stringify(tickets));
    } catch {
      // fallback
    }
  }, [tickets, currentUser?.id]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDetails.trim()) return;

    const newTicket: SupportTicket = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: newSubject.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSubmitSuccess(true);
    setNewSubject('');
    setNewDetails('');
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsModalOpen(false);
    }, 1200);
  };

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(searchFaq.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchFaq.toLowerCase())
  );

  return (
    <AppShell userRole={role}>
      <div className="su-page-container">
        <PageHeader
          title="Қолдау орталығы және FAQ"
          subtitle="Жиі қойылатын сұрақтарға жауаптар, нұсқаулықтар және техникалық көмек"
          breadcrumbs={[{ label: 'Кабинет' }, { label: 'Қолдау орталығы' }]}
          actions={
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Icon name="help" size={16} /> Жаңа тикет ашу
            </Button>
          }
        />

        {/* Quick Contact Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Card padding="md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.75rem' }}>📞</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Call-орталық / Helpdesk</div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>+7 (7162) 25-55-97</strong>
            </div>
          </Card>

          <Card padding="md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.75rem' }}>✉️</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Электронды пошта</div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>support@shokan.edu.kz</strong>
            </div>
          </Card>

          <Card padding="md" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.75rem' }}>💬</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Telegram қолдау боты</div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>@SmartUni_SupportBot</strong>
            </div>
          </Card>
        </div>

        {/* FAQ Accordion */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Жиі қойылатын сұрақтар (FAQ)
            </h3>
            <div style={{ minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Сұрақтар бойынша іздеу..."
                value={searchFaq}
                onChange={(e) => setSearchFaq(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{ fontSize: '1.25rem', color: '#64748b', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 1.25rem 1rem 1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* My Tickets List */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Менің сұраныстарым (Тикеттер)
          </h3>

          {tickets.length === 0 ? (
            <EmptyState
              title="Сұраныстар жоқ"
              description="Сізде әзірге белсенді немесе жабылған техникалық сұраныстар жоқ."
              icon="help"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tickets.map((t) => (
                <Card key={t.id} padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                          #{t.id}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                          {t.subject}
                        </h4>
                        <Badge variant="neutral" size="sm">{t.category}</Badge>
                      </div>

                      {t.response && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem', color: '#334155' }}>
                          <strong>Қолдау қызметінің жауабы:</strong> {t.response}
                        </div>
                      )}

                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                        {new Date(t.createdAt).toLocaleDateString('kk-KZ')}
                      </div>
                    </div>

                    <Badge
                      variant={
                        t.status === 'RESOLVED'
                          ? 'success'
                          : t.status === 'IN_PROGRESS'
                          ? 'info'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {t.status === 'RESOLVED' ? 'Шешілді' : t.status === 'IN_PROGRESS' ? 'Орындалуда' : 'Күтуде'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create Ticket Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Техникалық қолдау қызметіне жаңа сұраныс жіберу"
        >
          <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {submitSuccess && (
              <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '0.875rem' }}>
                ✓ Сұранысыңыз сәтті қабылданды! Біздің мамандар жақын арада жауап береді.
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                Сұраныс тақырыбы
              </label>
              <input
                type="text"
                required
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Қысқаша мәселе мазмұны"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  Санат
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff' }}
                >
                  <option value="Техникалық">Техникалық қателік</option>
                  <option value="Академиялық">Академиялық сұрақ</option>
                  <option value="Құпиясөз/Кіру">Құпиясөз / Кіру</option>
                  <option value="Ұсыныс">Ұсыныс / Пікір</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  Басымдық
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff' }}
                >
                  <option value="NORMAL">Қалыпты</option>
                  <option value="HIGH">Жоғары</option>
                  <option value="URGENT">Шұғыл</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                Толық сипаттамасы
              </label>
              <textarea
                required
                rows={4}
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                placeholder="Мәселенің нақты қадамдарын, пайда болған қатені жазыңыз..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Болдырмау
              </Button>
              <Button type="submit" variant="primary">
                Сұранысты жіберу
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
};

export default SupportPage;
