import { ValueObject, InvalidValueObjectException } from '@app/shared-kernel';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  static create(rawEmail: string): Email {
    const normalized = rawEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidValueObjectException(`Geçersiz e-posta adresi: ${rawEmail}`);
    }
    return new Email({ value: normalized });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
