import { ValueObject, InvalidValueObjectException } from '@app/shared-kernel';

interface KpssScoreProps {
  scoreType: string;
  score: number;
  year: number;
}

const MIN_SCORE = 0;
const MAX_SCORE = 100;

export class KpssScore extends ValueObject<KpssScoreProps> {
  private constructor(props: KpssScoreProps) {
    super(props);
  }

  static create(scoreType: string, score: number, year: number): KpssScore {
    if (score < MIN_SCORE || score > MAX_SCORE) {
      throw new InvalidValueObjectException(`Geçersiz KPSS puanı: ${score}`);
    }
    if (!scoreType?.trim()) {
      throw new InvalidValueObjectException('KPSS puan türü boş olamaz');
    }
    if (year < 2000 || year > new Date().getFullYear() + 1) {
      throw new InvalidValueObjectException(`Geçersiz KPSS yılı: ${year}`);
    }
    return new KpssScore({ scoreType: scoreType.trim(), score, year });
  }

  get scoreType(): string {
    return this.props.scoreType;
  }

  get score(): number {
    return this.props.score;
  }

  get year(): number {
    return this.props.year;
  }
}
