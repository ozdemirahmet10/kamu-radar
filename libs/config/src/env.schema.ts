import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_GLOBAL_PREFIX: z.string().default('api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  FRONTEND_URL: z.string().default('http://localhost:3001'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL zorunludur'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET en az 16 karakter olmalıdır'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET en az 16 karakter olmalıdır'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  EMAIL_PROVIDER: z.enum(['smtp', 'sendgrid', 'ses']).default('smtp'),
  EMAIL_FROM: z.string().email().default('noreply@kpss-kariyer.com'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),

  WEB_PUSH_PUBLIC_KEY: z.string().optional().default(''),
  WEB_PUSH_PRIVATE_KEY: z.string().optional().default(''),
  WEB_PUSH_CONTACT_EMAIL: z.string().optional().default('mailto:admin@kpss-kariyer.com'),

  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('raw-job-postings'),
  S3_REGION: z.string().default('us-east-1'),

  ANTHROPIC_API_KEY: z.string().optional().default(''),

  THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  // Genel varsayılan limit — hassas uçlar (login/register) zaten kendi sıkı
  // @Throttle() override'larına sahip (bkz. auth.controller.ts); bu değer sadece
  // geri kalan tüm okuma-ağırlıklı uçlara uygulanır. Tek bir dashboard sayfa
  // yüklemesi bile (şehirler + eşleşmeler + favoriler + bildirim sayısı vb.) kolayca
  // 5-8 istek attığından düşük bir değer normal kullanımda dahi 429 hatasına yol açar.
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(300),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Ortam değişkenleri doğrulanamadı:\n${formatted}`);
  }
  return parsed.data;
}
