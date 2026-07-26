import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '@app/config';
import { AccessTokenPayload } from '../../application/ports/token.port';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

export interface RequestUser {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: AppConfigService,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.accessSecret,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<RequestUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Geçersiz erişim jetonu');
    }

    // Askıya alınan/silinen kullanıcının elindeki access token süresi dolana kadar
    // (15 dk) geçerli kalmasın diye her istekte hesap durumu kontrol edilir.
    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.isDeleted || user.isSuspended) {
      throw new UnauthorizedException('Hesabınıza erişim engellenmiştir');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
