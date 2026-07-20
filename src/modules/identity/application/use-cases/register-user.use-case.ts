import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Email } from '../../domain/value-objects/email.vo';
import { User } from '../../domain/entities/user.entity';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';
import { HASHER_SERVICE, IHasherService } from '../ports/hasher.port';
import { RegisterUserDto } from '../dto/register-user.dto';
import { SendEmailVerificationUseCase } from './send-email-verification.use-case';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(USER_PROFILE_REPOSITORY) private readonly profileRepository: IUserProfileRepository,
    @Inject(HASHER_SERVICE) private readonly hasherService: IHasherService,
    private readonly sendEmailVerificationUseCase: SendEmailVerificationUseCase,
  ) {}

  async execute(dto: RegisterUserDto): Promise<User> {
    const email = Email.create(dto.email);

    const alreadyExists = await this.userRepository.existsByEmail(email.value);
    if (alreadyExists) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
    }

    const passwordHash = await this.hasherService.hash(dto.password);

    const user = User.register({
      id: randomUUID(),
      email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
    });

    await this.userRepository.save(user);

    const profile = UserProfile.createEmpty(randomUUID(), user.id);
    await this.profileRepository.save(profile);

    // Doğrulama e-postası kayıt akışını asla bloklamamalı/başarısız kılmamalı — SMTP
    // geçici olarak erişilemez olsa bile kullanıcı hesabı başarıyla oluşturulmuş sayılır.
    await this.sendEmailVerificationUseCase.execute(user.id).catch(() => undefined);

    return user;
  }
}
