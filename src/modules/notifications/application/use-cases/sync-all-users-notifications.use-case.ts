import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../identity/domain/repositories/user.repository.interface';
import { SyncNotificationsUseCase } from './sync-notifications.use-case';

const PAGE_SIZE = 100;

/**
 * IN_APP/EMAIL bildirimleri yalnızca kullanıcı Bildirimler sayfasını açtığında
 * senkronize edilseydi, e-posta hiçbir zaman "kullanıcı uygulamaya girmeden
 * haberdar olsun" amacına hizmet edemezdi — bu yüzden tüm kullanıcılar için
 * periyodik olarak (bkz. NotificationSyncSchedulerService) bu use-case çalıştırılır.
 */
@Injectable()
export class SyncAllUsersNotificationsUseCase {
  private readonly logger = new Logger(SyncAllUsersNotificationsUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly syncNotificationsUseCase: SyncNotificationsUseCase,
  ) {}

  async execute(): Promise<{ usersProcessed: number }> {
    let page = 1;
    let usersProcessed = 0;

    while (true) {
      const result = await this.userRepository.list({ page, pageSize: PAGE_SIZE });

      for (const user of result.items) {
        try {
          await this.syncNotificationsUseCase.execute(user.id);
        } catch (error) {
          this.logger.warn(
            `Kullanıcı için bildirim senkronizasyonu başarısız oldu (${user.id}): ${(error as Error).message}`,
          );
        }
        usersProcessed += 1;
      }

      if (page >= result.totalPages) break;
      page += 1;
    }

    return { usersProcessed };
  }
}
