import { ValueObject, InvalidValueObjectException } from '@app/shared-kernel';

interface ApplicationWindowProps {
  startDate: Date | null;
  endDate: Date | null;
}

export class ApplicationWindow extends ValueObject<ApplicationWindowProps> {
  private constructor(props: ApplicationWindowProps) {
    super(props);
  }

  static create(startDate: Date | null, endDate: Date | null): ApplicationWindow {
    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      throw new InvalidValueObjectException(
        'Başvuru bitiş tarihi, başlangıç tarihinden önce olamaz',
      );
    }
    return new ApplicationWindow({ startDate, endDate });
  }

  get startDate(): Date | null {
    return this.props.startDate;
  }

  get endDate(): Date | null {
    return this.props.endDate;
  }

  get isExpired(): boolean {
    return this.props.endDate ? this.props.endDate.getTime() < Date.now() : false;
  }
}
