import { Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { PrismaService } from '@app/database';
import { User, UserRole } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import {
  IUserRepository,
  ListUsersParams,
  ListUsersResult,
} from '../../domain/repositories/user.repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const records = await this.prisma.user.findMany({ where: { id: { in: ids } } });
    return records.map((record) => this.toDomain(record));
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email.value,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        suspendedAt: user.suspendedAt,
        deletedAt: user.deletedAt,
      },
      update: {
        email: user.email.value,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        suspendedAt: user.suspendedAt,
        deletedAt: user.deletedAt,
      },
    });
  }

  async list(params: ListUsersParams): Promise<ListUsersResult> {
    const where: Prisma.UserWhereInput = params.keyword
      ? {
          OR: [
            { email: { contains: params.keyword, mode: 'insensitive' } },
            { fullName: { contains: params.keyword, mode: 'insensitive' } },
          ],
        }
      : {};

    const [records, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toDomain(record)),
      page: params.page,
      pageSize: params.pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / params.pageSize)),
    };
  }

  private toDomain(record: PrismaUser): User {
    return User.reconstitute(record.id, {
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      fullName: record.fullName,
      phone: record.phone,
      role: record.role as UserRole,
      isEmailVerified: record.isEmailVerified,
      createdAt: record.createdAt,
      suspendedAt: record.suspendedAt,
      deletedAt: record.deletedAt,
    });
  }
}
