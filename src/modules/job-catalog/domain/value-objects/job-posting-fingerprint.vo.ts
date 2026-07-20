import { createHash } from 'crypto';
import { ValueObject } from '@app/shared-kernel';

interface FingerprintProps {
  value: string;
}

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

export class JobPostingFingerprint extends ValueObject<FingerprintProps> {
  private constructor(props: FingerprintProps) {
    super(props);
  }

  static compute(params: {
    institutionName: string;
    positionTitle: string;
    cityId: string | null;
    applicationStartDate: Date | null;
  }): JobPostingFingerprint {
    const raw = [
      normalize(params.institutionName),
      normalize(params.positionTitle),
      params.cityId ?? '',
      params.applicationStartDate?.toISOString().slice(0, 10) ?? '',
    ].join('|');

    const hash = createHash('sha256').update(raw).digest('hex');
    return new JobPostingFingerprint({ value: hash });
  }

  static fromExisting(value: string): JobPostingFingerprint {
    return new JobPostingFingerprint({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
