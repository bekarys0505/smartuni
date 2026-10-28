import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: Record<string, unknown> }
    >();

    let token: string | undefined;
    const authHeader = request.headers.authorization;

    if (authHeader) {
      const [type, t] = authHeader.split(' ');
      if (type === 'Bearer' && t) {
        token = t;
      }
    }

    if (!token && typeof request.query?.token === 'string') {
      token = request.query.token;
    }

    if (!token) {
      throw new UnauthorizedException('Authorization token қажет');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      request.user = payload;

      return true;
    } catch (error) {
      console.error('JWT VERIFY ERROR:', error);

      throw new UnauthorizedException(
        'JWT token жарамсыз немесе мерзімі өткен',
      );
    }
  }
}