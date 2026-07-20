import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../domain/entities/user.entity';

export class AdminUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  isEmailVerified!: boolean;

  @ApiProperty()
  isSuspended!: boolean;

  @ApiProperty()
  isDeleted!: boolean;

  @ApiProperty()
  createdAt!: string;

  static fromDomain(user: User): AdminUserResponseDto {
    const dto = new AdminUserResponseDto();
    dto.id = user.id;
    dto.email = user.email.value;
    dto.fullName = user.fullName;
    dto.phone = user.phone;
    dto.role = user.role;
    dto.isEmailVerified = user.isEmailVerified;
    dto.isSuspended = user.isSuspended;
    dto.isDeleted = user.isDeleted;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
