export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  studentProfile?: {
    id: string;
    universityId?: string | null;
    facultyId?: string | null;
    majorId?: string | null;
    course?: number | null;
    premium?: boolean;
  } | null;
  teacherProfile?: {
    id: string;
    department?: string | null;
    position?: string | null;
    premium?: boolean;
  } | null;
  [key: string]: unknown;
};

export const TOKEN_STORAGE_KEY = 'accessToken';
export const USER_STORAGE_KEY = 'smartuniUser';

/**
 * Сақталған JWT токенді алады
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Сақталған қолданушы деректерін алады
 */
export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Токен мен қолданушы деректерін сақтайды
 */
export function setAuth(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save auth to localStorage:', error);
  }
}

/**
 * Авторизация деректерін толық тазартады (Logout)
 */
export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear auth from localStorage:', error);
  }
}

/**
 * Қолданушы жүйеге кіргенін тексереді
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  return typeof token === 'string' && token.trim().length > 0;
}

/**
 * Қолданушының рөлін алады
 */
export function getUserRole(): UserRole | null {
  const user = getUser();
  return user?.role ?? null;
}

/**
 * Рөлге сәйкес негізгі кабинет маршрутын қайтарады
 */
export function getDashboardRouteByRole(role?: string | null): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'STUDENT':
    default:
      return '/student/dashboard';
  }
}

/**
 * Рөл атауын қазақша ресми нұсқада қайтарады
 */
export function getRoleTitleInKazakh(role?: UserRole | string | null): string {
  switch (role) {
    case 'ADMIN':
      return 'Әкімші';
    case 'TEACHER':
      return 'Оқытушы';
    case 'STUDENT':
    default:
      return 'Студент';
  }
}
