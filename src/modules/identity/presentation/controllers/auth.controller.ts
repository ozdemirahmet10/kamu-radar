import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUserUseCase } from '../../application/use-cases/logout-user.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { UpdateMyAccountUseCase } from '../../application/use-cases/update-my-account.use-case';
import { ListMySessionsUseCase } from '../../application/use-cases/list-my-sessions.use-case';
import { RevokeMySessionUseCase } from '../../application/use-cases/revoke-my-session.use-case';
import { RevokeAllOtherSessionsUseCase } from '../../application/use-cases/revoke-all-other-sessions.use-case';
import { DeleteMyAccountUseCase } from '../../application/use-cases/delete-my-account.use-case';
import { GetMySecurityHistoryUseCase } from '../../application/use-cases/get-my-security-history.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { SendEmailVerificationUseCase } from '../../application/use-cases/send-email-verification.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { RegisterUserDto } from '../../application/dto/register-user.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { ChangePasswordDto } from '../../application/dto/change-password.dto';
import { UpdateAccountDto } from '../../application/dto/update-account.dto';
import { ForgotPasswordDto } from '../../application/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../application/dto/reset-password.dto';
import { VerifyEmailDto } from '../../application/dto/verify-email.dto';
import { DeleteAccountDto } from '../../application/dto/delete-account.dto';
import { ListSecurityHistoryQueryDto } from '../../application/dto/list-security-history-query.dto';
import { SecurityHistoryItemDto, SecurityHistoryListResponseDto } from '../../application/dto/security-history-response.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import { TokenResponseDto } from '../../application/dto/token-response.dto';
import { SessionResponseDto } from '../../application/dto/session-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequestUser } from '../../infrastructure/auth/jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly updateMyAccountUseCase: UpdateMyAccountUseCase,
    private readonly listMySessionsUseCase: ListMySessionsUseCase,
    private readonly revokeMySessionUseCase: RevokeMySessionUseCase,
    private readonly revokeAllOtherSessionsUseCase: RevokeAllOtherSessionsUseCase,
    private readonly deleteMyAccountUseCase: DeleteMyAccountUseCase,
    private readonly getMySecurityHistoryUseCase: GetMySecurityHistoryUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly sendEmailVerificationUseCase: SendEmailVerificationUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute(dto);
    return UserResponseDto.fromDomain(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<TokenResponseDto> {
    return this.loginUserUseCase.execute(dto, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: RequestUser): Promise<void> {
    await this.logoutUserUseCase.execute(user.userId);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: RequestUser): Promise<UserResponseDto> {
    const currentUser = await this.getCurrentUserUseCase.execute(user.userId);
    return UserResponseDto.fromDomain(currentUser);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.changePasswordUseCase.execute(user.userId, dto.currentPassword, dto.newPassword);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateAccountDto,
  ): Promise<UserResponseDto> {
    const updated = await this.updateMyAccountUseCase.execute(user.userId, dto);
    return UserResponseDto.fromDomain(updated);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async listSessions(@CurrentUser() user: RequestUser): Promise<SessionResponseDto[]> {
    const sessions = await this.listMySessionsUseCase.execute(user.userId);
    return sessions.map((session) => SessionResponseDto.fromDomain(session, user.sessionId));
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.revokeMySessionUseCase.execute(user.userId, id);
  }

  @Post('sessions/revoke-others')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async revokeOtherSessions(
    @CurrentUser() user: RequestUser,
  ): Promise<{ revokedCount: number }> {
    return this.revokeAllOtherSessionsUseCase.execute(user.userId, user.sessionId);
  }

  @Get('security-history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async securityHistory(
    @CurrentUser() user: RequestUser,
    @Query() query: ListSecurityHistoryQueryDto,
  ): Promise<SecurityHistoryListResponseDto> {
    const result = await this.getMySecurityHistoryUseCase.execute(
      user.userId,
      query.page ?? 1,
      query.pageSize ?? 20,
    );
    return {
      items: result.items.map(SecurityHistoryItemDto.fromDomain),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  }

  @Post('me/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteMyAccount(
    @CurrentUser() user: RequestUser,
    @Body() dto: DeleteAccountDto,
  ): Promise<void> {
    await this.deleteMyAccountUseCase.execute(user.userId, dto.password);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.requestPasswordResetUseCase.execute(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.verifyEmailUseCase.execute(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async resendVerification(@CurrentUser() user: RequestUser): Promise<void> {
    await this.sendEmailVerificationUseCase.execute(user.userId);
  }
}
