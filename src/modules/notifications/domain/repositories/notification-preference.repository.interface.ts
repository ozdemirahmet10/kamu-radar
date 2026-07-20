export const NOTIFICATION_PREFERENCE_REPOSITORY = Symbol('NOTIFICATION_PREFERENCE_REPOSITORY');

export interface INotificationPreferenceRepository {
  /** IN_APP kanalı için bildirimlerin açık olup olmadığını döner (kayıt yoksa varsayılan true). */
  isInAppEnabled(userId: string): Promise<boolean>;
  setInAppEnabled(userId: string, isEnabled: boolean): Promise<void>;
  /** EMAIL kanalı için bildirimlerin açık olup olmadığını döner (kayıt yoksa varsayılan true). */
  isEmailEnabled(userId: string): Promise<boolean>;
  setEmailEnabled(userId: string, isEnabled: boolean): Promise<void>;
}
