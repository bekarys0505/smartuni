import type { IconName } from '../components/ui/Icon';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: IconName;
  badge?: string;
  isImplemented?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// ============================================================================
// STUDENT CANONICAL NAVIGATION
// ============================================================================
export const STUDENT_NAV: NavSection[] = [
  {
    title: 'Оқу процесі',
    items: [
      {
        id: 'student-dashboard',
        label: 'Басты бет',
        path: '/student/dashboard',
        icon: 'dashboard',
        isImplemented: true,
      },
      {
        id: 'student-subjects',
        label: 'Менің пәндерім',
        path: '/student/subjects',
        icon: 'book',
        isImplemented: true,
      },
      {
        id: 'student-assignments',
        label: 'Тапсырмалар',
        path: '/student/assignments',
        icon: 'file-text',
        isImplemented: true,
      },
      {
        id: 'student-labs',
        label: 'Зертханалар',
        path: '/student/labs',
        icon: 'layers',
        isImplemented: false,
      },
      {
        id: 'student-tests',
        label: 'Тесттер',
        path: '/student/tests',
        icon: 'check-circle',
        isImplemented: true,
      },
      {
        id: 'student-calendar',
        label: 'Күнтізбе',
        path: '/student/calendar',
        icon: 'calendar',
        isImplemented: true,
      },
      {
        id: 'student-diary',
        label: 'Электронды күнделік',
        path: '/student/diary',
        icon: 'file-text',
        isImplemented: true,
      },
      {
        id: 'student-progress',
        label: 'Прогресс',
        path: '/student/progress',
        icon: 'chart',
        isImplemented: true,
      },
      {
        id: 'student-history',
        label: 'Оқу тарихы',
        path: '/student/history',
        icon: 'clock',
        isImplemented: false,
      },
      {
        id: 'student-materials',
        label: 'Менің материалдарым',
        path: '/student/materials',
        icon: 'folder',
        isImplemented: true,
      },
    ],
  },
  {
    title: 'Байланыс және қызметтер',
    items: [
      {
        id: 'student-notifications',
        label: 'Хабарламалар',
        path: '/student/notifications',
        icon: 'bell',
        isImplemented: false,
      },
      {
        id: 'student-chat',
        label: 'Чат',
        path: '/student/chat',
        icon: 'message',
        isImplemented: false,
      },
      {
        id: 'student-premium',
        label: 'Premium',
        path: '/student/premium',
        icon: 'star',
        isImplemented: false,
      },
      {
        id: 'student-support',
        label: 'Қолдау орталығы',
        path: '/student/support',
        icon: 'help',
        isImplemented: false,
      },
      {
        id: 'student-profile',
        label: 'Профиль',
        path: '/student/profile',
        icon: 'user',
        isImplemented: true,
      },
    ],
  },
];

// ============================================================================
// TEACHER CANONICAL NAVIGATION
// ============================================================================
export const TEACHER_NAV: NavSection[] = [
  {
    title: 'Оқу процесі',
    items: [
      {
        id: 'teacher-dashboard',
        label: 'Басты бет',
        path: '/teacher/dashboard',
        icon: 'dashboard',
        isImplemented: true,
      },
      {
        id: 'teacher-groups',
        label: 'Менің топтарым',
        path: '/teacher/groups',
        icon: 'users',
        isImplemented: true,
      },
      {
        id: 'teacher-subjects',
        label: 'Пәндер',
        path: '/teacher/subjects',
        icon: 'book',
        isImplemented: true,
      },
      {
        id: 'teacher-topics',
        label: 'Тақырыптар',
        path: '/teacher/topics',
        icon: 'layers',
        isImplemented: true,
      },
      {
        id: 'teacher-materials',
        label: 'Материалдар',
        path: '/teacher/materials',
        icon: 'folder',
        isImplemented: true,
      },
      {
        id: 'teacher-assignments',
        label: 'Тапсырмалар',
        path: '/teacher/assignments',
        icon: 'file-text',
        isImplemented: true,
      },
      {
        id: 'teacher-labs',
        label: 'Зертханалар',
        path: '/teacher/labs',
        icon: 'grid',
        isImplemented: false,
      },
      {
        id: 'teacher-tests',
        label: 'Тесттер',
        path: '/teacher/tests',
        icon: 'check-circle',
        isImplemented: true,
      },
      {
        id: 'teacher-journal',
        label: 'Электронды журнал',
        path: '/teacher/journal',
        icon: 'chart',
        isImplemented: true,
      },
      {
        id: 'teacher-attendance',
        label: 'Қатысу',
        path: '/teacher/attendance',
        icon: 'check',
        isImplemented: true,
      },
      {
        id: 'teacher-calendar',
        label: 'Күнтізбе',
        path: '/teacher/calendar',
        icon: 'calendar',
        isImplemented: false,
      },
    ],
  },
  {
    title: 'Бақылау және бағалау',
    items: [
      {
        id: 'teacher-rk1',
        label: 'РК-1',
        path: '/teacher/rk1',
        icon: 'award',
        isImplemented: true,
      },
      {
        id: 'teacher-rk2',
        label: 'РК-2',
        path: '/teacher/rk2',
        icon: 'award',
        isImplemented: true,
      },
      {
        id: 'teacher-session',
        label: 'Сессия',
        path: '/teacher/session',
        icon: 'graduation-cap',
        isImplemented: true,
      },
      {
        id: 'teacher-requests',
        label: 'Қосылу өтініштері',
        path: '/teacher/requests',
        icon: 'users',
        isImplemented: true,
      },
    ],
  },
  {
    title: 'Байланыс және кабинет',
    items: [
      {
        id: 'teacher-notifications',
        label: 'Хабарламалар',
        path: '/teacher/notifications',
        icon: 'bell',
        isImplemented: false,
      },
      {
        id: 'teacher-chat',
        label: 'Чат',
        path: '/teacher/chat',
        icon: 'message',
        isImplemented: false,
      },
      {
        id: 'teacher-premium',
        label: 'Premium',
        path: '/teacher/premium',
        icon: 'star',
        isImplemented: false,
      },
      {
        id: 'teacher-support',
        label: 'Қолдау орталығы',
        path: '/teacher/support',
        icon: 'help',
        isImplemented: false,
      },
      {
        id: 'teacher-profile',
        label: 'Профиль',
        path: '/teacher/profile',
        icon: 'user',
        isImplemented: true,
      },
    ],
  },
];

// ============================================================================
// ADMIN CANONICAL NAVIGATION
// ============================================================================
export const ADMIN_NAV: NavSection[] = [
  {
    title: 'Негізгі басқару',
    items: [
      {
        id: 'admin-dashboard',
        label: 'Басты бет',
        path: '/admin/dashboard',
        icon: 'dashboard',
        isImplemented: true,
      },
      {
        id: 'admin-students',
        label: 'Студенттер',
        path: '/admin/students',
        icon: 'graduation-cap',
        isImplemented: false,
      },
      {
        id: 'admin-teachers',
        label: 'Оқытушылар',
        path: '/admin/teachers',
        icon: 'users',
        isImplemented: false,
      },
      {
        id: 'admin-users',
        label: 'Пайдаланушылар',
        path: '/admin/users',
        icon: 'user',
        isImplemented: true,
      },
      {
        id: 'admin-groups',
        label: 'Топтар',
        path: '/admin/groups',
        icon: 'layers',
        isImplemented: true,
      },
      {
        id: 'admin-subjects',
        label: 'Пәндер',
        path: '/admin/subjects',
        icon: 'book',
        isImplemented: true,
      },
      {
        id: 'admin-materials',
        label: 'Материалдар',
        path: '/admin/materials',
        icon: 'folder',
        isImplemented: false,
      },
    ],
  },
  {
    title: 'Академиялық бақылау',
    items: [
      {
        id: 'admin-tests',
        label: 'Тесттер',
        path: '/admin/tests',
        icon: 'check-circle',
        isImplemented: false,
      },
      {
        id: 'admin-academic',
        label: 'Академиялық мониторинг',
        path: '/admin/academic',
        icon: 'chart',
        isImplemented: true,
      },
      {
        id: 'admin-grades',
        label: 'Бағалар ведомосі',
        path: '/admin/academic',
        icon: 'file-text',
        isImplemented: true,
      },
      {
        id: 'admin-rk',
        label: 'РК',
        path: '/admin/rk',
        icon: 'award',
        isImplemented: false,
      },
      {
        id: 'admin-session',
        label: 'Сессия',
        path: '/admin/session',
        icon: 'graduation-cap',
        isImplemented: false,
      },
      {
        id: 'admin-statistics',
        label: 'Статистика',
        path: '/admin/statistics',
        icon: 'chart',
        isImplemented: false,
      },
      {
        id: 'admin-requests',
        label: 'Өтініштер',
        path: '/admin/requests',
        icon: 'users',
        isImplemented: false,
      },
    ],
  },
  {
    title: 'Жүйелік параметрлер',
    items: [
      {
        id: 'admin-support',
        label: 'Қолдау орталығы',
        path: '/admin/support',
        icon: 'help',
        isImplemented: false,
      },
      {
        id: 'admin-notifications',
        label: 'Хабарламалар',
        path: '/admin/notifications',
        icon: 'bell',
        isImplemented: false,
      },
      {
        id: 'admin-premium',
        label: 'Premium',
        path: '/admin/premium',
        icon: 'star',
        isImplemented: false,
      },
      {
        id: 'admin-audit-log',
        label: 'Әрекеттер журналы',
        path: '/admin/audit-log',
        icon: 'shield',
        isImplemented: false,
      },
      {
        id: 'admin-settings',
        label: 'Жүйе параметрлері',
        path: '/admin/settings',
        icon: 'settings',
        isImplemented: false,
      },
      {
        id: 'admin-profile',
        label: 'Профиль',
        path: '/admin/profile',
        icon: 'user',
        isImplemented: true,
      },
    ],
  },
];

export function getNavForRole(role: string): NavSection[] {
  switch (role) {
    case 'STUDENT':
      return STUDENT_NAV;
    case 'TEACHER':
      return TEACHER_NAV;
    case 'ADMIN':
      return ADMIN_NAV;
    default:
      return [];
  }
}
