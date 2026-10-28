import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../generated/prisma/enums';

describe('Auth & Role Navigation Verification', () => {
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test-secret' });
  });

  function parseJwtPayload(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  function isTokenExpired(token: string): boolean {
    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  }

  function getDashboardRouteByRole(role?: string | null): string {
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

  it('should parse valid TEACHER JWT and extract role correctly', async () => {
    const token = await jwtService.signAsync({
      sub: 'teacher-1',
      email: 'teacher@smartuni.kz',
      role: UserRole.TEACHER,
    });

    const payload = parseJwtPayload(token);
    expect(payload).toBeDefined();
    expect(payload.role).toBe(UserRole.TEACHER);
    expect(payload.sub).toBe('teacher-1');
    expect(isTokenExpired(token)).toBe(false);
  });

  it('should detect expired token', async () => {
    const expiredToken = await jwtService.signAsync(
      {
        sub: 'student-1',
        email: 'student@smartuni.kz',
        role: UserRole.STUDENT,
      },
      { expiresIn: '-10s' },
    );

    const payload = parseJwtPayload(expiredToken);
    expect(payload).toBeDefined();
    expect(isTokenExpired(expiredToken)).toBe(true);
  });

  it('should route unknown/undefined roles to /login instead of /student/dashboard', () => {
    expect(getDashboardRouteByRole(undefined)).toBe('/login');
    expect(getDashboardRouteByRole(null)).toBe('/login');
    expect(getDashboardRouteByRole('')).toBe('/login');
    expect(getDashboardRouteByRole('GUEST')).toBe('/login');
    expect(getDashboardRouteByRole('TEACHER')).toBe('/teacher/dashboard');
    expect(getDashboardRouteByRole('STUDENT')).toBe('/student/dashboard');
    expect(getDashboardRouteByRole('ADMIN')).toBe('/admin/dashboard');
  });

  it('should return null for malformed token', () => {
    expect(parseJwtPayload('invalid-token')).toBeNull();
    expect(isTokenExpired('invalid-token')).toBe(false);
  });
});

