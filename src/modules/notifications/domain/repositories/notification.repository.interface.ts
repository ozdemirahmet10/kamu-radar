export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export type NotificationType = 'NEW_MATCH' | 'DEADLINE_SOON';

export interface NotificationCandidate {
  userId: string;
  jobPostingId: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface NotificationRecord {
  id: string;
  jobPostingId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ListNotificationsResult {
  items: NotificationRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  unreadCount: number;
}

export interface INotificationRepository {
  /**
   * Adayı, aynı kullanıcı+ilan+tip için zaten yoksa oluşturur; varsa dokunmaz (okunmuş
   * işareti korunur). `wasCreated`, bu senkronizasyon adımında kaydın ilk kez oluşturulup
   * oluşturulmadığını bildirir — e-posta gibi tekrar tetiklenmemesi gereken yan etkiler
   * bu bayrağa göre koşullandırılır.
   */
  upsertIfNotExists(candidate: NotificationCandidate): Promise<{ wasCreated: boolean }>;
  list(userId: string, page: number, pageSize: number): Promise<ListNotificationsResult>;
  countUnread(userId: string): Promise<number>;
  markRead(userId: string, id: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}
