import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@app/database';
import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile.use-case';
import { UpdateProfileDto } from '../../application/dto/update-profile.dto';
import { ProfileResponseDto } from '../../application/dto/profile-response.dto';
import { QualificationCodeService } from '../../application/services/qualification-code.service';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequestUser } from '../../infrastructure/auth/jwt.strategy';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile/me')
export class ProfileController {
  constructor(
    private readonly getMyProfileUseCase: GetMyProfileUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly qualificationCodeService: QualificationCodeService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getMyProfile(@CurrentUser() user: RequestUser): Promise<ProfileResponseDto> {
    const profile = await this.getMyProfileUseCase.execute(user.userId);
    return this.toResponse(profile);
  }

  @Patch()
  async updateMyProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.updateMyProfileUseCase.execute(user.userId, dto);
    return this.toResponse(profile);
  }

  private async toResponse(profile: UserProfile): Promise<ProfileResponseDto> {
    const departmentId = profile.snapshot.graduationDepartmentId;
    const [department, qualificationCodes] = await Promise.all([
      departmentId
        ? this.prisma.graduationDepartment.findUnique({ where: { id: departmentId } })
        : Promise.resolve(null),
      this.qualificationCodeService.getCodesForDepartment(departmentId),
    ]);
    return ProfileResponseDto.fromDomain(profile, department?.name ?? null, qualificationCodes);
  }
}
