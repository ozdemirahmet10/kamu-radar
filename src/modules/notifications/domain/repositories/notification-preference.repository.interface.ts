export const NOTIFICATION_PREFERENCE_REPOSITORY = Symbol('NOTIFICATION_PREFERENCE_REPOSITORY');

export type DigestFrequency = 'INSTANT' | 'DAILY';

export interface INotificationPreferenceRepository {
  /** IN_APP kanalı için bildirimlerin açık olup olmadığını döner (kayıt yoksa varsayılan true). */
  isInAppEnabled(userId: string): Promise<boolean>;
  setInAppEnabled(userId: string, isEnabled: boolean): Promise<void>;
  /** EMAIL kanalı için bildirimlerin açık olup olmadığını döner (kayıt yoksa varsayılan true). */
  isEmailEnabled(userId: string): Promise<boolean>;
  setEmailEnabled(userId: string, isEnabled: boolean): Promise<void>;
  /** EMAIL kanalı için anlık mı günlük özet mi tercih edildiğini döner (kayıt yoksa varsayılan INSTANT). */
  getEmailDigestFrequency(userId: string): Promise<DigestFrequency>;
  setEmailDigestFrequency(userId: string, frequency: DigestFrequency): Promise<void>;
  /** Günlük özet işi için — EMAIL açık ve DAILY seçili tüm kullanıcıların id'leri. */
  findUserIdsForDailyEmailDigest(): Promise<string[]>;
}
