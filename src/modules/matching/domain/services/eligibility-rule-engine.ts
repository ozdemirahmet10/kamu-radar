import { Injectable } from '@nestjs/common';
import { EDUCATION_LEVEL_RANK, EducationLevel } from '@app/shared-kernel';
import { EligibilityResult, EligibilityStatus } from '../entities/eligibility-result';

export interface CandidateProfile {
  kpssScoreType: string | null;
  kpssScore: number | null;
  birthDate: Date | null;
  educationLevel: EducationLevel | null;
  preferredCityIds: string[];
  qualificationCodes: string[];
}

export interface JobRequirements {
  kpssScoreType: string | null;
  minKpssScore: number | null;
  minAge: number | null;
  maxAge: number | null;
  minimumEducationLevel: EducationLevel | null;
  cityId: string | null;
  qualificationCodes: string[];
}

function calculateAge(birthDate: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    referenceDate.getMonth() > birthDate.getMonth() ||
    (referenceDate.getMonth() === birthDate.getMonth() &&
      referenceDate.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}

/**
 * Bir kullanıcının bir ilana ne kadar uygun olduğunu hesaplayan saf (framework'ten
 * bağımsız) iş kuralı motoru. Her ilgili kriter için üç olası sonuç vardır:
 *  - Sağlanıyor: sorun yok.
 *  - Sağlanmıyor (hard fail): KPSS puan türü uyuşmazlığı, yetersiz puan, yaş/öğrenim
 *    şartını sağlamama gibi kesin diskalifiye eden durumlar -> NOT_ELIGIBLE.
 *  - Bilgi eksik: kullanıcı profilini doldurmamış (örn. doğum tarihi girmemiş) ->
 *    diskalifiye etmez ama PARTIALLY_ELIGIBLE olarak işaretlenir.
 */
@Injectable()
export class EligibilityRuleEngine {
  evaluate(
    profile: CandidateProfile,
    job: JobRequirements,
    referenceDate: Date = new Date(),
  ): EligibilityResult {
    const missingCriteria: string[] = [];
    let hasHardFail = false;
    let applicableGroups = 0;
    let passedGroups = 0;

    // 1) KPSS puan türü + taban puan
    if (job.kpssScoreType || job.minKpssScore !== null) {
      applicableGroups += 1;
      if (!profile.kpssScoreType || profile.kpssScore === null) {
        missingCriteria.push('KPSS puan bilgisi profilinizde eksik');
      } else if (job.kpssScoreType && profile.kpssScoreType !== job.kpssScoreType) {
        hasHardFail = true;
        missingCriteria.push(
          `KPSS puan türü uyuşmuyor (gerekli: ${job.kpssScoreType}, sizin: ${profile.kpssScoreType})`,
        );
      } else if (job.minKpssScore !== null && profile.kpssScore < job.minKpssScore) {
        hasHardFail = true;
        missingCriteria.push(
          `KPSS puanınız yetersiz (gerekli: en az ${job.minKpssScore}, sizin: ${profile.kpssScore})`,
        );
      } else {
        passedGroups += 1;
      }
    }

    // 2) Yaş şartı
    if (job.minAge !== null || job.maxAge !== null) {
      applicableGroups += 1;
      if (!profile.birthDate) {
        missingCriteria.push('Doğum tarihi profilinizde eksik');
      } else {
        const age = calculateAge(profile.birthDate, referenceDate);
        if (job.minAge !== null && age < job.minAge) {
          hasHardFail = true;
          missingCriteria.push(`Yaş şartını sağlamıyorsunuz (en az ${job.minAge})`);
        } else if (job.maxAge !== null && age > job.maxAge) {
          hasHardFail = true;
          missingCriteria.push(`Yaş şartını sağlamıyorsunuz (en fazla ${job.maxAge})`);
        } else {
          passedGroups += 1;
        }
      }
    }

    // 3) Öğrenim şartı
    if (job.minimumEducationLevel) {
      applicableGroups += 1;
      if (!profile.educationLevel) {
        missingCriteria.push('Öğrenim durumu profilinizde eksik');
      } else if (
        EDUCATION_LEVEL_RANK[profile.educationLevel] <
        EDUCATION_LEVEL_RANK[job.minimumEducationLevel]
      ) {
        hasHardFail = true;
        missingCriteria.push('Öğrenim şartını sağlamıyorsunuz');
      } else {
        passedGroups += 1;
      }
    }

    // 4) Nitelik kodu şartı (mezuniyet bölümünden türetilen kesin kontrol — öğrenim
    // seviyesinden daha isabetli, çünkü doğrudan ÖSYM nitelik koduna dayanır)
    if (job.qualificationCodes.length > 0) {
      applicableGroups += 1;
      if (profile.qualificationCodes.length === 0) {
        missingCriteria.push('Mezuniyet bölümü profilinizde eksik (nitelik kodu hesaplanamıyor)');
      } else {
        const hasMatchingCode = job.qualificationCodes.some((code) =>
          profile.qualificationCodes.includes(code),
        );
        if (!hasMatchingCode) {
          hasHardFail = true;
          missingCriteria.push(
            `Nitelik kodu şartını sağlamıyorsunuz (gerekli: ${job.qualificationCodes.join(', ')})`,
          );
        } else {
          passedGroups += 1;
        }
      }
    }

    // 5) Şehir tercihi (yumuşak kriter — diskalifiye etmez, sadece bilgilendirir)
    if (job.cityId && profile.preferredCityIds.length > 0) {
      applicableGroups += 1;
      if (!profile.preferredCityIds.includes(job.cityId)) {
        missingCriteria.push('Bu ilan tercih ettiğiniz şehirler arasında değil');
      } else {
        passedGroups += 1;
      }
    }

    // İlandan hiçbir yapılandırılmış şart çıkarılamamışsa (KPSS, yaş, öğrenim, nitelik
    // kodu — hepsi boş), bu "herkese %100 uygun" anlamına gelmez; sadece ilan metninden
    // otomatik çıkarım yapılamadığı anlamına gelir. Böyle bir ilanı kesin ELIGIBLE olarak
    // göstermek yanıltıcı olur (örn. akademik unvan şartı olan ama KPSS'e dayanmayan
    // ilanlar) — bu yüzden PARTIALLY_ELIGIBLE + açık bir uyarı ile işaretlenir.
    if (applicableGroups === 0) {
      return {
        status: EligibilityStatus.PARTIALLY_ELIGIBLE,
        matchPercentage: 50,
        missingCriteria: [
          'Bu ilanın başvuru şartları ilan metninden otomatik olarak çıkarılamadı, lütfen ilan detayını inceleyin',
        ],
      };
    }

    const matchPercentage = Math.round((passedGroups / applicableGroups) * 100);

    const status = hasHardFail
      ? EligibilityStatus.NOT_ELIGIBLE
      : missingCriteria.length > 0
        ? EligibilityStatus.PARTIALLY_ELIGIBLE
        : EligibilityStatus.ELIGIBLE;

    return { status, matchPercentage, missingCriteria };
  }
}
