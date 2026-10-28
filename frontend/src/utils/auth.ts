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

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: UserRole;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * JWT payload-ын қауіпсіз парсингтеу (base64url)
 */
export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Токеннің жарамдылық мерзімі өтіп кеткенін тексереді
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return false;
  // exp секундпен келеді, миллисекундпен салыстырамыз
  return payload.exp * 1000 <= Date.now();
}

/**
 * Сақталған қолданушы деректерін алады (қажет болса JWT арқылы толықтырады)
 */
export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed && parsed.role) return parsed;
    }
  } catch {
    // JSON парсинг қатесі болса, токен арқылы қалпына келтіруге тырысамыз
  }

  // Егер smartuniUser өшірілген немесе бұзылған болса, JWT токеннен қалпына келтіру
  const token = getToken();
  if (token) {
    const payload = parseJwtPayload(token);
    if (payload?.sub && payload?.role) {
      return {
        id: payload.sub,
        fullName: payload.email || 'Қолданушы',
        email: payload.email || '',
        role: payload.role,
      };
    }
  }

  return null;
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
 * Локалды сақталған қолданушы мәліметтерін ішінара жаңартады
 */
export function updateUser(partialUser: Partial<AuthUser>): void {
  try {
    const current = getUser();
    if (!current) return;
    const updated = { ...current, ...partialUser };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update user in localStorage:', error);
  }
}

/**
 * Авторизация деректерін толық тазартады (Logout)
 */
export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.setItem(USER_STORAGE_KEY, '');
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear auth from localStorage:', error);
  }
}

/**
 * Қолданушы жүйеге кіргенін және токеннің жарамдылығын тексереді
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return false;
  }

  // Егер токен жарамсыз немесе мерзімі өткен болса, сессияны тазарту
  const payload = parseJwtPayload(token);
  if (!payload || isTokenExpired(token)) {
    clearAuth();
    return false;
  }

  return true;
}

/**
 * Қолданушының рөлін алады (алдымен user объектісінен, кейін JWT payload-тан)
 */
export function getUserRole(): UserRole | null {
  const user = getUser();
  if (user?.role) return user.role;

  const token = getToken();
  if (token) {
    const payload = parseJwtPayload(token);
    if (payload?.role) return payload.role;
  }

  return null;
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
      return '/student/dashboard';
    default:
      return '/login';
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
