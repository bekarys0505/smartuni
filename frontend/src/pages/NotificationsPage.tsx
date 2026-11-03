import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Tabs,
  Modal,
  EmptyState,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getUser } from '../utils/auth';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'ACADEMIC' | 'SYSTEM' | 'EXAM' | 'ANNOUNCEMENT';
  createdAt: string;
  isRead: boolean;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  targetRole?: 'ALL' | 'STUDENT' | 'TEACHER' | 'ADMIN';
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'РК-1 аралық бақылау қорытындылары жарияланды',
    message: 'Барлық пәндер бойынша 1-ші рейтингтік бақылау бағалары ведомоске енгізілді. Профильдегі "Оқу тарихы" бөлімінен тексеріңіз.',
    category: 'ACADEMIC',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isRead: false,
    priority: 'HIGH',
  },
  {
    id: 'notif-2',
    title: 'Жүйелік жоспарлы техникалық жұмыстар',
    message: 'Жұма күні сағат 23:00-ден 01:00-ге дейін SmartUni серверлерінде жоспарлы жаңарту жұмыстары жүргізіледі.',
    category: 'SYSTEM',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    isRead: false,
    priority: 'NORMAL',
  },
  {
    id: 'notif-3',
    title: 'Зертханалық жұмыстарды тапсыру мерзімі (Deadline)',
    message: 'Web-бағдарламалау және Деректер қоры пәндері бойынша зертханалық есептерді осы аптаның соңына дейін өткізу қажет.',
    category: 'ACADEMIC',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    isRead: true,
    priority: 'HIGH',
  },
  {
    id: 'notif-4',
    title: 'Кітапхана және оқу залдарының жұмыс кестесі',
    message: 'Емтихан сессиясына дайындық кезеңінде бас ғимараттағы оқу залы сағат 22:00-ге дейін жұмыс істейді.',
    category: 'ANNOUNCEMENT',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    isRead: true,
    priority: 'NORMAL',
  },
];

export const NotificationsPage: React.FC = () => {
  const currentUser = getUser();
  const role = (currentUser?.role || 'STUDENT') as 'STUDENT' | 'TEACHER' | 'ADMIN';

  const storageKey = `smartuni_notifications_${currentUser?.id || 'guest'}`;

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Broadcast Modal
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState<'ACADEMIC' | 'SYSTEM' | 'ANNOUNCEMENT'>('ANNOUNCEMENT');
  const [newPriority, setNewPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [newTarget, setNewTarget] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch {
      // storage unavailable
    }
  }, [notifications, storageKey]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const created: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: newTitle.trim(),
      message: newMessage.trim(),
      category: newCategory,
      priority: newPriority,
      targetRole: newTarget,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setNotifications((prev) => [created, ...prev]);
    setBroadcastSuccess(true);
    setNewTitle('');
    setNewMessage('');
    setTimeout(() => {
      setBroadcastSuccess(false);
      setIsBroadcastModalOpen(false);
    }, 1200);
  };

  const filtered = notifications.filter((item) => {
    if (activeTab === 'UNREAD' && item.isRead) return false;
    if (activeTab === 'ACADEMIC' && item.category !== 'ACADEMIC') return false;
    if (activeTab === 'SYSTEM' && item.category !== 'SYSTEM') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell userRole={role}>
      <div className="su-page-container">
        <PageHeader
          title="Хабарламалар орталығы"
          subtitle="Ресми хабарландырулар, академиялық ескертулер мен жүйелік жаңалықтар"
          breadcrumbs={[{ label: 'Кабинет' }, { label: 'Хабарламалар' }]}
          actions={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Icon name="check" size={16} /> Барлығын оқылды деп белгілеу
                </Button>
              )}
              {role === 'ADMIN' && (
                <Button variant="primary" size="sm" onClick={() => setIsBroadcastModalOpen(true)}>
                  <Icon name="bell" size={16} /> Жаңа хабарландыру жариялау
                </Button>
              )}
            </div>
          }
        />

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'ALL', label: 'Барлығы', count: notifications.length },
              { key: 'UNREAD', label: 'Оқылмағандар', count: unreadCount },
              {
                key: 'ACADEMIC',
                label: 'Академиялық',
                count: notifications.filter((n) => n.category === 'ACADEMIC').length,
              },
              {
                key: 'SYSTEM',
                label: 'Жүйелік',
                count: notifications.filter((n) => n.category === 'SYSTEM').length,
              },
            ]}
          />

          <div style={{ maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Хабарламаларды іздеу..."
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

        {/* Notification Cards */}
        {filtered.length === 0 ? (
          <EmptyState
            title="Хабарламалар табылмады"
            description="Сізде бұл бөлім бойынша хабарламалар жоқ."
            icon="bell"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((item) => (
              <Card
                key={item.id}
                padding="md"
                style={{
                  borderLeft: item.isRead ? '3px solid #e2e8f0' : '4px solid #3b82f6',
                  background: item.isRead ? '#ffffff' : '#f8fafc',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      {!item.isRead && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#3b82f6',
                            display: 'inline-block',
                          }}
                        />
                      )}
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: item.isRead ? 500 : 700, color: '#0f172a' }}>
                        {item.title}
                      </h4>
                      <Badge variant={item.category === 'ACADEMIC' ? 'primary' : 'neutral'} size="sm">
                        {item.category === 'ACADEMIC' ? 'Оқу процесі' : item.category === 'SYSTEM' ? 'Жүйелік' : 'Хабарландыру'}
                      </Badge>
                      {item.priority === 'HIGH' && <Badge variant="warning" size="sm">Маңызды</Badge>}
                      {item.priority === 'URGENT' && <Badge variant="danger" size="sm">Шұғыл</Badge>}
                    </div>

                    <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                      {item.message}
                    </p>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(item.createdAt).toLocaleString('kk-KZ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        title="Оқылды деп белгілеу"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#2563eb',
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        Оқылды
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(item.id)}
                      title="Жою"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: '0.25rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Broadcast Modal for Admin */}
        <Modal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          title="Жаңа хабарландыру жариялау"
        >
          <form onSubmit={handleCreateBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {broadcastSuccess && (
              <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '0.875rem' }}>
                ✓ Хабарландыру сәтті жарияланды!
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                Хабарландыру тақырыбы
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Мысалы: 2-семестр сабақ кестесі бекітілді"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                Хабарлама мәтіні
              </label>
              <textarea
                required
                rows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Хабарламаның толық мәтінін жазыңыз..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  Санат
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff' }}
                >
                  <option value="ANNOUNCEMENT">Жалпы хабарландыру</option>
                  <option value="ACADEMIC">Оқу процесі</option>
                  <option value="SYSTEM">Жүйелік ескерту</option>
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
                  <option value="HIGH">Маңызды</option>
                  <option value="URGENT">Шұғыл</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  Кімге арналған
                </label>
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value as any)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff' }}
                >
                  <option value="ALL">Барлығына</option>
                  <option value="STUDENT">Студенттерге</option>
                  <option value="TEACHER">Оқытушыларға</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsBroadcastModalOpen(false)}>
                Болдырмау
              </Button>
              <Button type="submit" variant="primary">
                Жариялау
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
};

export default NotificationsPage;
