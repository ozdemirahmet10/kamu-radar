import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '@app/email';

import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { USER_PROFILE_REPOSITORY } from './domain/repositories/user-profile.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.interface';
import { VERIFICATION_TOKEN_REPOSITORY } from './domain/repositories/verification-token.repository.interface';
import { HASHER_SERVICE } from './application/ports/hasher.port';
import { TOKEN_SERVICE } from './application/ports/token.port';

import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { PrismaUserProfileRepository } from './infrastructure/persistence/prisma-user-profile.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { PrismaVerificationTokenRepository } from './infrastructure/persistence/prisma-verification-token.repository';
import { BcryptHasherService } from './infrastructure/auth/bcrypt-hasher.service';
import { JwtTokenService } from './infrastructure/auth/jwt-token.service';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUserUseCase } from './application/use-cases/logout-user.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { UpdateMyAccountUseCase } from './application/use-cases/update-my-account.use-case';
import { ListMySessionsUseCase } from './application/use-cases/list-my-sessions.use-case';
import { RevokeMySessionUseCase } from './application/use-cases/revoke-my-session.use-case';
import { RevokeAllOtherSessionsUseCase } from './application/use-cases/revoke-all-other-sessions.use-case';
import { DeleteMyAccountUseCase } from './application/use-cases/delete-my-account.use-case';
import { GetMySecurityHistoryUseCase } from './application/use-cases/get-my-security-history.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { SendEmailVerificationUseCase } from './application/use-cases/send-email-verification.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { GetMyProfileUseCase } from './application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserRoleUseCase } from './application/use-cases/update-user-role.use-case';
import { SuspendUserUseCase } from './application/use-cases/suspend-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { QualificationCodeService } from './application/services/qualification-code.service';

import { AuthController } from './presentation/controllers/auth.controller';
import { ProfileController } from './presentation/controllers/profile.controller';
import { AdminUsersController } from './presentation/controllers/admin-users.controller';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({}), EmailModule],
  controllers: [AuthController, ProfileController, AdminUsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: USER_PROFILE_REPOSITORY, useClass: PrismaUserProfileRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: VERIFICATION_TOKEN_REPOSITORY, useClass: PrismaVerificationTokenRepository },
    { provide: HASHER_SERVICE, useClass: BcryptHasherService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    JwtStrategy,
    RolesGuard,
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    LogoutUserUseCase,
    GetCurrentUserUseCase,
    ChangePasswordUseCase,
    UpdateMyAccountUseCase,
    ListMySessionsUseCase,
    RevokeMySessionUseCase,
    RevokeAllOtherSessionsUseCase,
    DeleteMyAccountUseCase,
    GetMySecurityHistoryUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    SendEmailVerificationUseCase,
    VerifyEmailUseCase,
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    ListUsersUseCase,
    UpdateUserRoleUseCase,
    SuspendUserUseCase,
    DeleteUserUseCase,
    QualificationCodeService,
  ],
  exports: [USER_REPOSITORY, USER_PROFILE_REPOSITORY, QualificationCodeService],
})
export class IdentityModule {}
