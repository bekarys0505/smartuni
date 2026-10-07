import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<{
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    }>();

    const userId = request.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Қолданушы анықталмады. Токен қажет');
    }

    // Database арқылы қолданушының нақты мәртебесін тексеру
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Қолданушы жүйеде табылмады');
    }

    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('Бұл аккаунт бұғатталған');
    }

    // Егер endpoint үшін нақты рөлдер талап етілмесе, рұқсат беру
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role as UserRole);

    if (!hasRole) {
      throw new ForbiddenException(
        'Бұл бөлімге кіруге сіздің рөліңіздің құқығы жоқ',
      );
    }

    return true;
  }
}
