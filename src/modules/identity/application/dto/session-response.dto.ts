import { ApiProperty } from '@nestjs/swagger';
import { StoredRefreshToken } from '../../domain/repositories/refresh-token.repository.interface';

export class SessionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  deviceInfo!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  isCurrent!: boolean;

  static fromDomain(session: StoredRefreshToken, currentSessionId: string): SessionResponseDto {
    const dto = new SessionResponseDto();
    dto.id = session.id;
    dto.deviceInfo = session.deviceInfo;
    dto.createdAt = session.createdAt.toISOString();
    dto.expiresAt = session.expiresAt.toISOString();
    dto.isCurrent = session.id === currentSessionId;
    return dto;
  }
}
