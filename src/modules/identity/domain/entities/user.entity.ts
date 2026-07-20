import { Entity } from '@app/shared-kernel';
import { Email } from '../value-objects/email.vo';

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  email: Email;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  suspendedAt?: Date | null;
  deletedAt?: Date | null;
}

export class User extends Entity<string> {
  private constructor(
    id: string,
    private props: UserProps,
  ) {
    super(id);
  }

  static register(params: {
    id: string;
    email: Email;
    passwordHash: string;
    fullName: string;
    phone?: string | null;
  }): User {
    return new User(params.id, {
      email: params.email,
      passwordHash: params.passwordHash,
      fullName: params.fullName,
      phone: params.phone ?? null,
      role: UserRole.USER,
      isEmailVerified: false,
      createdAt: new Date(),
      suspendedAt: null,
      deletedAt: null,
    });
  }

  static reconstitute(id: string, props: UserProps): User {
    return new User(id, props);
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get phone(): string | null {
    return this.props.phone ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get suspendedAt(): Date | null {
    return this.props.suspendedAt ?? null;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  get isSuspended(): boolean {
    return this.props.suspendedAt != null;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt != null;
  }

  verifyEmail(): void {
    this.props.isEmailVerified = true;
  }

  changeRole(role: UserRole): void {
    this.props.role = role;
  }

  changePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
  }

  updateAccountInfo(changes: { fullName?: string; phone?: string | null }): void {
    if (changes.fullName !== undefined) {
      this.props.fullName = changes.fullName;
    }
    if (changes.phone !== undefined) {
      this.props.phone = changes.phone;
    }
  }

  suspend(): void {
    this.props.suspendedAt = new Date();
  }

  reactivate(): void {
    this.props.suspendedAt = null;
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
  }

  restore(): void {
    this.props.deletedAt = null;
  }
}
