import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.configService.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get database() {
    return { url: this.get('DATABASE_URL') };
  }

  get redis() {
    return {
      host: this.get('REDIS_HOST'),
      port: this.get('REDIS_PORT'),
      password: this.get('REDIS_PASSWORD') || undefined,
    };
  }

  get jwt() {
    return {
      accessSecret: this.get('JWT_ACCESS_SECRET'),
      accessExpiresIn: this.get('JWT_ACCESS_EXPIRES_IN'),
      refreshSecret: this.get('JWT_REFRESH_SECRET'),
      refreshExpiresIn: this.get('JWT_REFRESH_EXPIRES_IN'),
    };
  }

  get frontendUrl(): string {
    return this.get('FRONTEND_URL');
  }

  get email() {
    return {
      provider: this.get('EMAIL_PROVIDER'),
      from: this.get('EMAIL_FROM'),
      smtp: {
        host: this.get('SMTP_HOST'),
        port: this.get('SMTP_PORT'),
        user: this.get('SMTP_USER'),
        password: this.get('SMTP_PASSWORD'),
      },
    };
  }

  get webPush() {
    return {
      publicKey: this.get('WEB_PUSH_PUBLIC_KEY'),
      privateKey: this.get('WEB_PUSH_PRIVATE_KEY'),
      contactEmail: this.get('WEB_PUSH_CONTACT_EMAIL'),
    };
  }

  get objectStorage() {
    return {
      endpoint: this.get('S3_ENDPOINT'),
      accessKey: this.get('S3_ACCESS_KEY'),
      secretKey: this.get('S3_SECRET_KEY'),
      bucket: this.get('S3_BUCKET'),
      region: this.get('S3_REGION'),
    };
  }

  get throttle() {
    return { ttl: this.get('THROTTLE_TTL'), limit: this.get('THROTTLE_LIMIT') };
  }
}
