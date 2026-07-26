import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExportMyDataUseCase, UserDataExport } from '../../application/use-cases/export-my-data.use-case';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';

@ApiTags('data-export')
@Controller('me/data-export')
export class DataExportController {
  constructor(private readonly exportMyDataUseCase: ExportMyDataUseCase) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async exportMyData(@CurrentUser() user: RequestUser): Promise<UserDataExport> {
    return this.exportMyDataUseCase.execute(user.userId);
  }
}
