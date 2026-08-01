import 'reflect-metadata';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from '@app/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(AppConfigService);
  const corsOrigin = configService.get('CORS_ORIGIN');

  // credentials:true ile birlikte "*" (joker) origin, tarayıcıların çoğu tarafından zaten
  // reddedilir ama bazı proxy/eski istemci kurulumlarında sessizce çalışabilir — production'da
  // gerçek frontend origin'i ayarlanmadan yanlışlıkla açık kalmasını engellemek için uygulama
  // hiç ayağa kalkmadan burada durduruluyor.
  if (configService.isProduction && corsOrigin === '*') {
    throw new Error(
      'CORS_ORIGIN production ortamında "*" olamaz — gerçek frontend adresini ayarlayın (örn. https://kamuradar.com).',
    );
  }

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.enableCors({ origin: corsOrigin, credentials: true });
  app.setGlobalPrefix(configService.get('API_GLOBAL_PREFIX'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (!configService.isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('KPSS Kariyer Asistanı API')
      .setDescription('Kişiselleştirilmiş kamu kariyer asistanı için REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get('PORT');
  await app.listen(port);
}

bootstrap();
