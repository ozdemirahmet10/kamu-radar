import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@app/database';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequestUser } from '../../infrastructure/auth/jwt.strategy';
import { UserRole } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UpdateUserRoleUseCase } from '../../application/use-cases/update-user-role.use-case';
import { SuspendUserUseCase } from '../../application/use-cases/suspend-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { QualificationCodeService } from '../../application/services/qualification-code.service';
import { ListUsersQueryDto } from '../../application/dto/list-users-query.dto';
import { UpdateUserRoleDto } from '../../application/dto/update-user-role.dto';
import { AdminUserResponseDto } from '../../application/dto/admin-user-response.dto';

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly suspendUserUseCase: SuspendUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly qualificationCodeService: QualificationCodeService,
    private readonly prisma: PrismaService,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(USER_PROFILE_REPOSITORY) private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  @Get()
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsersUseCase.execute({
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items: result.items.map(AdminUserResponseDto.fromDomain),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const profile = await this.userProfileRepository.findByUserId(id);
    const snapshot = profile?.snapshot;

    const [department, qualificationCodes, matchGroups, auditLogs] = await Promise.all([
      snapshot?.graduationDepartmentId
        ? this.prisma.graduationDepartment.findUnique({
            where: { id: snapshot.graduationDepartmentId },
          })
        : Promise.resolve(null),
      this.qualificationCodeService.getCodesForDepartment(snapshot?.graduationDepartmentId ?? null),
      this.prisma.matchResult.groupBy({
        by: ['eligibilityStatus'],
        where: { userId: id },
        _count: { _all: true },
      }),
      this.prisma.auditLog.findMany({
        where: { OR: [{ actorUserId: id }, { entityType: 'User', entityId: id }] },
        include: { actor: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const matchSummary: Record<string, number> = {
      ELIGIBLE: 0,
      PARTIALLY_ELIGIBLE: 0,
      NOT_ELIGIBLE: 0,
    };
    for (const row of matchGroups) {
      matchSummary[row.eligibilityStatus] = row._count._all;
    }

    return {
      user: AdminUserResponseDto.fromDomain(user),
      profile: snapshot
        ? {
            birthDate: snapshot.birthDate ? snapshot.birthDate.toISOString().slice(0, 10) : null,
            educationLevel: snapshot.educationLevel,
            graduationSchool: snapshot.graduationSchool,
            graduationDepartmentName: department?.name ?? null,
            kpssScoreType: snapshot.kpssScore?.scoreType ?? null,
            kpssScore: snapshot.kpssScore?.score ?? null,
            kpssYear: snapshot.kpssScore?.year ?? null,
            drivingLicense: snapshot.drivingLicense,
            ydsScore: snapshot.ydsScore,
            ydsType: snapshot.ydsType,
            militaryStatus: snapshot.militaryStatus,
            disabilityStatus: snapshot.disabilityStatus,
            certificates: snapshot.certificates,
            qualificationCodes,
          }
        : null,
      matchSummary,
      recentAuditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        changes: log.changes,
        createdAt: log.createdAt.toISOString(),
        actorEmail: log.actor?.email ?? null,
        actorFullName: log.actor?.fullName ?? null,
      })),
    };
  }

  @Patch(':id/role')
  async updateRole(
    @CurrentUser() actingUser: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<AdminUserResponseDto> {
    const user = await this.updateUserRoleUseCase.execute(actingUser.userId, id, dto.role);
    return AdminUserResponseDto.fromDomain(user);
  }

  @Post(':id/suspend')
  async suspend(
    @CurrentUser() actingUser: RequestUser,
    @Param('id') id: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.suspendUserUseCase.execute(actingUser.userId, id, true);
    return AdminUserResponseDto.fromDomain(user);
  }

  @Post(':id/reactivate')
  async reactivate(
    @CurrentUser() actingUser: RequestUser,
    @Param('id') id: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.suspendUserUseCase.execute(actingUser.userId, id, false);
    return AdminUserResponseDto.fromDomain(user);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() actingUser: RequestUser,
    @Param('id') id: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.deleteUserUseCase.execute(actingUser.userId, id, true);
    return AdminUserResponseDto.fromDomain(user);
  }

  @Post(':id/restore')
  async restore(
    @CurrentUser() actingUser: RequestUser,
    @Param('id') id: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.deleteUserUseCase.execute(actingUser.userId, id, false);
    return AdminUserResponseDto.fromDomain(user);
  }
}
