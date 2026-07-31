import { Inject, Injectable } from '@nestjs/common';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../../identity/domain/repositories/user-profile.repository.interface';
import {
  GetMyMatchesUseCase,
  MatchedJobPosting,
} from '../../../matching/application/use-cases/get-my-matches.use-case';
import { EligibilityStatus } from '../../../matching/domain/entities/eligibility-result';
import { UserProfileProps } from '../../../identity/domain/entities/user-profile.entity';
import { RadarInsightService } from '../../infrastructure/radar-insight.service';

const TOP_MATCH_COUNT = 5;

export interface RadarInsightResult {
  insight: string;
  generatedAt: string;
}

@Injectable()
export class GenerateRadarInsightUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY) private readonly profileRepository: IUserProfileRepository,
    private readonly getMyMatchesUseCase: GetMyMatchesUseCase,
    private readonly radarInsightService: RadarInsightService,
  ) {}

  async execute(userId: string): Promise<RadarInsightResult> {
    const profile = await this.profileRepository.findByUserId(userId);
    const profileSnapshot = profile?.snapshot;

    const matches = await this.getMyMatchesUseCase.execute({
      userId,
      statuses: [EligibilityStatus.ELIGIBLE, EligibilityStatus.PARTIALLY_ELIGIBLE],
      sortBy: 'matchPercentage',
      page: 1,
      pageSize: TOP_MATCH_COUNT,
    });

    const prompt = this.buildPrompt(profileSnapshot, matches.items, matches.totalCount);
    const insight = await this.radarInsightService.generate(prompt);

    return { insight, generatedAt: new Date().toISOString() };
  }

  private buildPrompt(
    profileSnapshot: UserProfileProps | undefined,
    topMatches: MatchedJobPosting[],
    totalMatchCount: number,
  ): string {
    const profileLines = profileSnapshot
      ? [
          profileSnapshot.kpssScore
            ? `KPSS puan türü/puanı: ${profileSnapshot.kpssScore.scoreType} - ${profileSnapshot.kpssScore.score}`
            : 'KPSS puanı henüz girilmemiş',
          profileSnapshot.educationLevel ? `Eğitim düzeyi: ${profileSnapshot.educationLevel}` : null,
          profileSnapshot.preferredCityIds.length > 0
            ? `${profileSnapshot.preferredCityIds.length} tercih edilen şehir seçilmiş`
            : 'Tercih edilen şehir seçilmemiş',
        ].filter((line): line is string => Boolean(line))
      : ['Kullanıcı henüz profil bilgisi girmemiş'];

    const matchLines =
      topMatches.length > 0
        ? topMatches.map(
            (match) =>
              `- ${match.jobPosting.snapshot.institutionName} / ${match.jobPosting.snapshot.positionTitle} (uygunluk %${match.matchPercentage}, durum: ${match.status})`,
          )
        : ['Şu an eşleşen ilan bulunmuyor'];

    return [
      'Sen Kamu Radar adlı bir KPSS kariyer asistanı uygulamasının kişiselleştirilmiş içgörü asistanısın (adın "Radar AI").',
      'Aşağıdaki kullanıcı profili ve en uygun ilan eşleşmelerine bakarak, kullanıcıya 3-5 cümlelik, samimi ve motive edici bir Türkçe değerlendirme yaz.',
      'Markdown başlığı kullanma, düz metin yaz. Kullanıcıya doğrudan "siz" diye hitap et.',
      'Eğer profil eksikse (örn. KPSS puanı yok), bunu tamamlamasını nazikçe öner. Eğer güçlü eşleşmeler varsa bunlardan bahset. Eğer hiç eşleşme yoksa, profilini genişletmesini öner.',
      '',
      `Toplam uygun/kısmen uygun ilan sayısı: ${totalMatchCount}`,
      'Profil özeti:',
      ...profileLines.map((line) => `- ${line}`),
      '',
      'En uygun ilanlar:',
      ...matchLines,
    ].join('\n');
  }
}
