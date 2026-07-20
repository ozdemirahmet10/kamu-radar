/**
 * Hem ilan (JobPosting.minimumEducationLevel) hem kullanıcı profili
 * (UserProfile.educationLevel) tarafından kullanılan ortak öğrenim seviyesi
 * sözlüğü — Eşleştirme Motoru bu iki tarafı karşılaştırabilsin diye tek yerde tanımlı.
 */
export enum EducationLevel {
  ILKOGRETIM = 'ILKOGRETIM',
  LISE = 'LISE',
  ON_LISANS = 'ON_LISANS',
  LISANS = 'LISANS',
  YUKSEK_LISANS = 'YUKSEK_LISANS',
}

/** Sıralama: bir kullanıcının bu seviyeye "en az" sahip olup olmadığını karşılaştırmak için. */
export const EDUCATION_LEVEL_RANK: Record<EducationLevel, number> = {
  [EducationLevel.ILKOGRETIM]: 1,
  [EducationLevel.LISE]: 2,
  [EducationLevel.ON_LISANS]: 3,
  [EducationLevel.LISANS]: 4,
  [EducationLevel.YUKSEK_LISANS]: 5,
};
