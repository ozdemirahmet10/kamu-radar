export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  PARTIALLY_ELIGIBLE = 'PARTIALLY_ELIGIBLE',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
}

export interface EligibilityResult {
  status: EligibilityStatus;
  /** 0-100 arası, kullanıcı arayüzünde "%X Uygunluk" olarak gösterilir. */
  matchPercentage: number;
  /** Kullanıcıya gösterilecek, eksik/uyuşmayan şartların insan-okunur listesi. */
  missingCriteria: string[];
}
