import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { PageHeader, Badge, Button } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getUser } from '../utils/auth';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
  isSelf: boolean;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  type: 'GROUP' | 'DIRECT' | 'SUPPORT';
  avatarLetter: string;
  unreadCount: number;
  online: boolean;
  messages: ChatMessage[];
}

const INITIAL_CHANNELS: ChatChannel[] = [
  {
    id: 'ch-group-1',
    name: 'ИС-21 Академиялық тобы',
    description: 'Топ студенттері мен куратор арасындағы ортақ чат',
    type: 'GROUP',
    avatarLetter: 'ИС',
    unreadCount: 1,
    online: true,
    messages: [
      {
        id: 'm1',
        senderId: 'u-1',
        senderName: 'Серікбай Данияр (Староста)',
        senderRole: 'Студент',
        text: 'Сәлеметсіздер ме, құрметті топтастар! Ертеңгі Web-технологиялар дәрісі сағат 10:00-де 304-аудиторияда өтеді.',
        createdAt: '10:15',
        isSelf: false,
      },
      {
        id: 'm2',
        senderId: 'u-2',
        senderName: 'Ахметов Болат (Оқытушы)',
        senderRole: 'Оқытушы',
        text: 'Иә, зертханалық жұмыстар бойынша дайындық файлдары SmartUni "Материалдар" бөліміне жүктелді.',
        createdAt: '10:18',
        isSelf: false,
      },
      {
        id: 'm3',
        senderId: 'self',
        senderName: 'Мен',
        senderRole: 'Студент',
        text: 'Рақмет, ағай! Зертханалық жұмыстың есебін жүйе арқылы өткіздім.',
        createdAt: '10:22',
        isSelf: true,
      },
    ],
  },
  {
    id: 'ch-teacher-1',
    name: 'Ахметов Болат (Консультация)',
    description: 'Оқытушының жеке консультациялық байланыс арнасы',
    type: 'DIRECT',
    avatarLetter: 'АБ',
    unreadCount: 0,
    online: true,
    messages: [
      {
        id: 'tm1',
        senderId: 'u-2',
        senderName: 'Ахметов Болат',
        senderRole: 'Оқытушы',
        text: 'Сәлеметсіз бе! 1-ші зертханалық жұмысыңыз тексерілді, бағасы журналға қойылды.',
        createdAt: 'Кеше 15:40',
        isSelf: false,
      },
    ],
  },
  {
    id: 'ch-support',
    name: 'SmartUni Техникалық қолдау',
    description: 'Жүйелік мәселелер мен автоматтандырылған көмекші',
    type: 'SUPPORT',
    avatarLetter: 'SU',
    unreadCount: 0,
    online: true,
    messages: [
      {
        id: 'sm1',
        senderId: 'bot',
        senderName: 'SmartUni Bot',
        senderRole: 'Бот',
        text: 'Сәлеметсіз бе! Мен SmartUni көмекшісімін. Сұрақтарыңыз болса, осында жаза аласыз.',
        createdAt: '09:00',
        isSelf: false,
      },
    ],
  },
];

export const ChatPage: React.FC = () => {
  const currentUser = getUser();
  const role = (currentUser?.role || 'STUDENT') as 'STUDENT' | 'TEACHER' | 'ADMIN';

  const [channels, setChannels] = useState<ChatChannel[]>(() => {
    try {
      const saved = localStorage.getItem(`smartuni_chat_channels_${currentUser?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_CHANNELS;
  });

  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || 'ch-group-1');
  const [inputText, setInputText] = useState('');
  const [searchChannel, setSearchChannel] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`smartuni_chat_channels_${currentUser?.id || 'guest'}`, JSON.stringify(channels));
    } catch {
      // fallback
    }
  }, [channels, currentUser?.id]);

  const activeChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannel?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: currentUser?.id || 'self',
      senderName: currentUser?.fullName || 'Мен',
      senderRole: role === 'STUDENT' ? 'Студент' : role === 'TEACHER' ? 'Оқытушы' : 'Әкімші',
      text: inputText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };

    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === activeChannel.id
          ? { ...ch, messages: [...ch.messages, newMsg] }
          : ch
      )
    );
    setInputText('');

    // Simulate auto-reply for tech support channel
    if (activeChannel.type === 'SUPPORT') {
      setTimeout(() => {
        const botReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          senderId: 'bot',
          senderName: 'SmartUni Bot',
          senderRole: 'Бот',
          text: 'Сұрағыңыз қабылданды! Біздің оператор жақын арада жауап береді немесе "Қолдау орталығы" бөліміндегі FAQ-ты қарай аласыз.',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false,
        };
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === 'ch-support'
              ? { ...ch, messages: [...ch.messages, botReply] }
              : ch
          )
        );
      }, 1000);
    }
  };

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchChannel.toLowerCase())
  );

  return (
    <AppShell userRole={role}>
      <div className="su-page-container" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
        <PageHeader
          title="Академиялық чат"
          subtitle="Студенттермен, оқытушылармен және оқу топтарымен тікелей байланыс"
          breadcrumbs={[{ label: 'Кабинет' }, { label: 'Чат' }]}
        />

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Left: Channels Sidebar */}
          <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            <div style={{ padding: '0.85rem' }}>
              <input
                type="text"
                placeholder="Чаттарды іздеу..."
                value={searchChannel}
                onChange={(e) => setSearchChannel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  background: '#ffffff',
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredChannels.map((c) => {
                const isSelected = c.id === activeChannel.id;
                const lastMsg = c.messages[c.messages.length - 1];
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedChannelId(c.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isSelected ? '#2563eb' : '#cbd5e1',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {c.avatarLetter}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 700 : 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </span>
                        {c.online && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastMsg ? `${lastMsg.isSelf ? 'Сіз: ' : ''}${lastMsg.text}` : c.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Messages Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
            {/* Active Header */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  {activeChannel.name}
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {activeChannel.description}
                </span>
              </div>
              <Badge variant={activeChannel.online ? 'success' : 'neutral'} size="sm">
                {activeChannel.online ? 'Онлайн' : 'Офлайн'}
              </Badge>
            </div>

            {/* Messages Body */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc' }}>
              {activeChannel.messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.isSelf ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!m.isSelf && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                      {m.senderName} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({m.senderRole})</span>
                    </span>
                  )}
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '0.7rem 1rem',
                      borderRadius: m.isSelf ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: m.isSelf ? '#2563eb' : '#ffffff',
                      color: m.isSelf ? '#ffffff' : '#0f172a',
                      fontSize: '0.875rem',
                      lineHeight: 1.45,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      border: m.isSelf ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    {m.text}
                    <div
                      style={{
                        fontSize: '0.65rem',
                        marginTop: '0.35rem',
                        textAlign: 'right',
                        color: m.isSelf ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                      }}
                    >
                      {m.createdAt}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                background: '#ffffff',
              }}
            >
              <input
                type="text"
                placeholder="Хабарлама жазыңыз..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <Button type="submit" variant="primary" size="md">
                <Icon name="message" size={16} /> Жіберу
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ChatPage;
