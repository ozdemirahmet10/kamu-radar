import { EducationLevel } from '@app/shared-kernel';
import { EligibilityStatus } from '../entities/eligibility-result';
import { CandidateProfile, EligibilityRuleEngine, JobRequirements } from './eligibility-rule-engine';

function profile(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    kpssScoreType: 'P93',
    kpssScore: 90,
    birthDate: new Date('1995-01-01'),
    educationLevel: EducationLevel.LISANS,
    preferredCityIds: [],
    qualificationCodes: [],
    ...overrides,
  };
}

function job(overrides: Partial<JobRequirements> = {}): JobRequirements {
  return {
    kpssScoreType: null,
    minKpssScore: null,
    minAge: null,
    maxAge: null,
    minimumEducationLevel: null,
    cityId: null,
    qualificationCodes: [],
    ...overrides,
  };
}

describe('EligibilityRuleEngine', () => {
  const engine = new EligibilityRuleEngine();
  const referenceDate = new Date('2026-01-01');

  it('ilgili tüm kriterleri sağlayan profili ELIGIBLE olarak işaretler', () => {
    const result = engine.evaluate(
      profile(),
      job({ kpssScoreType: 'P93', minKpssScore: 80 }),
      referenceDate,
    );
    expect(result.status).toBe(EligibilityStatus.ELIGIBLE);
    expect(result.matchPercentage).toBe(100);
    expect(result.missingCriteria).toHaveLength(0);
  });

  describe('sıfır-kriter durumu (regresyon: daha önce yanlışlıkla %100 ELIGIBLE dönüyordu)', () => {
    it('ilandan hiçbir yapılandırılmış şart çıkarılamamışsa PARTIALLY_ELIGIBLE + %50 döner, ELIGIBLE değil', () => {
      const result = engine.evaluate(profile(), job(), referenceDate);
      expect(result.status).toBe(EligibilityStatus.PARTIALLY_ELIGIBLE);
      expect(result.matchPercentage).toBe(50);
      expect(result.missingCriteria).toHaveLength(1);
    });

    it('yüksek KPSS puanlı bir profil dahi, kriteri olmayan bir ilana kesin ELIGIBLE olarak işaretlenmez', () => {
      // Bu senaryo tam olarak canlıda yaşanan hatayı temsil eder: P93 puan türünde 90
      // puanı olan bir kullanıcıya, yapılandırılmış hiçbir şartı çıkarılamayan bir
      // "Öğretim Üyesi" ilanı öneriliyordu.
      const result = engine.evaluate(
        profile({ kpssScoreType: 'P93', kpssScore: 90 }),
        job({ kpssScoreType: null, minKpssScore: null }),
        referenceDate,
      );
      expect(result.status).not.toBe(EligibilityStatus.ELIGIBLE);
    });
  });

  describe('KPSS puan türü ve taban puan', () => {
    it('puan türü uyuşmazsa NOT_ELIGIBLE döner', () => {
      const result = engine.evaluate(
        profile({ kpssScoreType: 'P93' }),
        job({ kpssScoreType: 'P3', minKpssScore: 70 }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.NOT_ELIGIBLE);
      expect(result.missingCriteria[0]).toContain('KPSS puan türü uyuşmuyor');
    });

    it('puan yetersizse NOT_ELIGIBLE döner', () => {
      const result = engine.evaluate(
        profile({ kpssScoreType: 'P93', kpssScore: 60 }),
        job({ kpssScoreType: 'P93', minKpssScore: 70 }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.NOT_ELIGIBLE);
      expect(result.missingCriteria[0]).toContain('yetersiz');
    });

    it('kullanıcının KPSS puanı hiç girilmemişse diskalifiye etmez, PARTIALLY_ELIGIBLE olur', () => {
      const result = engine.evaluate(
        profile({ kpssScoreType: null, kpssScore: null }),
        job({ kpssScoreType: 'P93', minKpssScore: 70 }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.PARTIALLY_ELIGIBLE);
      expect(result.missingCriteria[0]).toContain('KPSS puan bilgisi');
    });

    it('ilanın minKpssScore alanı NULL ama puan türü belirtilmişse yine de kriter uygulanabilir sayılır', () => {
      const result = engine.evaluate(
        profile({ kpssScoreType: 'P3', kpssScore: 50 }),
        job({ kpssScoreType: 'P93', minKpssScore: null }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.NOT_ELIGIBLE);
    });
  });

  describe('yaş şartı', () => {
    it('yaş şartını sağlamayan profili diskalifiye eder', () => {
      const result = engine.evaluate(
        profile({ birthDate: new Date('2005-01-01') }), // 21 yaşında (referenceDate: 2026-01-01)
        job({ minAge: 25 }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.NOT_ELIGIBLE);
    });

    it('doğum tarihi eksikse diskalifiye etmez, PARTIALLY_ELIGIBLE olur', () => {
      const result = engine.evaluate(
        profile({ birthDate: null }),
        job({ minAge: 25 }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.PARTIALLY_ELIGIBLE);
      expect(result.missingCriteria[0]).toContain('Doğum tarihi');
    });

    it('doğum günü henüz gelmemiş olan yılı doğru şekilde bir yaş genç sayar', () => {
      const result = engine.evaluate(
        profile({ birthDate: new Date('2001-12-31') }),
        job({ minAge: 25 }), // 2026-01-01 itibarıyla doğum günü henüz gelmedi -> 24 yaşında
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.NOT_ELIGIBLE);
    });
  });

  describe('öğrenim şartı', () => {
    it('yetersiz öğrenim seviyesini diskalifiye eder', () => {
      const result = engine.evaluate(
        profile({ educationLevel: EducationLevel.LISE }),
        job({ minimumEducationLevel: EducationLevel.LISANS }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.NOT_ELIGIBLE);
    });

    it('daha yüksek öğrenim seviyesini kabul eder', () => {
      const result = engine.evaluate(
        profile({ educationLevel: EducationLevel.YUKSEK_LISANS }),
        job({ minimumEducationLevel: EducationLevel.LISANS }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.ELIGIBLE);
    });
  });

  describe('nitelik kodu şartı', () => {
    it('eşleşen nitelik kodu yoksa diskalifiye eder', () => {
      const result = engine.evaluate(
        profile({ qualificationCodes: ['1234'] }),
        job({ qualificationCodes: ['5678'] }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.NOT_ELIGIBLE);
    });

    it('eşleşen nitelik kodu varsa geçer', () => {
      const result = engine.evaluate(
        profile({ qualificationCodes: ['1234', '5678'] }),
        job({ qualificationCodes: ['5678'] }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.ELIGIBLE);
    });
  });

  describe('şehir tercihi (yumuşak kriter)', () => {
    it('tercih edilmeyen şehir diskalifiye etmez ama PARTIALLY_ELIGIBLE yapar', () => {
      const result = engine.evaluate(
        profile({ preferredCityIds: ['city-a'] }),
        job({ cityId: 'city-b' }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.PARTIALLY_ELIGIBLE);
    });

    it('kullanıcı hiç şehir tercihi girmemişse bu kriter hiç uygulanmaz', () => {
      const result = engine.evaluate(
        profile({ preferredCityIds: [] }),
        job({ cityId: 'city-b', kpssScoreType: 'P93', minKpssScore: 80 }),
        referenceDate,
      );
      expect(result.status).toBe(EligibilityStatus.ELIGIBLE);
    });
  });

  it('birden fazla kriter kısmen sağlanınca matchPercentage oranı doğru hesaplanır', () => {
    const result = engine.evaluate(
      profile({ birthDate: null }), // yaş kriteri "eksik" sayılacak
      job({ kpssScoreType: 'P93', minKpssScore: 80, minAge: 25 }),
      referenceDate,
    );
    expect(result.status).toBe(EligibilityStatus.PARTIALLY_ELIGIBLE);
    expect(result.matchPercentage).toBe(50); // 1/2 grup geçti
  });
});
