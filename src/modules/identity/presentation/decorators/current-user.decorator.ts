import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../../infrastructure/auth/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return request.user;
  },
);
