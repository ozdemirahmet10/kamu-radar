import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CitiesController } from './presentation/controllers/cities.controller';
import { GraduationDepartmentsController } from './presentation/controllers/graduation-departments.controller';
import { AdminQualificationCodesController } from './presentation/controllers/admin-qualification-codes.controller';

@Module({
  imports: [IdentityModule],
  controllers: [CitiesController, GraduationDepartmentsController, AdminQualificationCodesController],
})
export class ReferenceDataModule {}
