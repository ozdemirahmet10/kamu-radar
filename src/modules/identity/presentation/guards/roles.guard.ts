import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../../infrastructure/auth/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const hasRole = requiredRoles.includes(request.user?.role as UserRole);
    if (!hasRole) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır');
    }
    return true;
  }
}
