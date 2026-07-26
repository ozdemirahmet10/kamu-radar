import { ApiProperty } from '@nestjs/swagger';
import { AuditLogRecord } from '../../../../common/audit/audit-log.service';

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Giriş yapıldı',
  PASSWORD_CHANGED: 'Şifre değiştirildi',
  PASSWORD_RESET: 'Şifre sıfırlandı',
  EMAIL_VERIFIED: 'E-posta doğrulandı',
  SESSION_REVOKED: 'Bir oturum sonlandırıldı',
  SESSIONS_BULK_REVOKED: 'Diğer tüm oturumlar sonlandırıldı',
  ACCOUNT_DELETED: 'Hesap silindi',
};

export class SecurityHistoryItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ nullable: true })
  deviceInfo!: string | null;

  @ApiProperty()
  createdAt!: string;

  static fromDomain(record: AuditLogRecord): SecurityHistoryItemDto {
    const dto = new SecurityHistoryItemDto();
    dto.id = record.id;
    dto.action = record.action;
    dto.label = ACTION_LABELS[record.action] ?? record.action;
    const changes = record.changes as { deviceInfo?: string } | null;
    dto.deviceInfo = changes?.deviceInfo ?? null;
    dto.createdAt = record.createdAt.toISOString();
    return dto;
  }
}

export class SecurityHistoryListResponseDto {
  @ApiProperty({ type: [SecurityHistoryItemDto] })
  items!: SecurityHistoryItemDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;
}
