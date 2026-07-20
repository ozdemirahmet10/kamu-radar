import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@app/database';
import { PrismaJobPostingRepository } from '../src/modules/job-catalog/infrastructure/prisma-job-posting.repository';

/**
 * Bu e2e test, unit testlerle yakalanamayan bir hata sınıfını hedefler: Prisma/Postgres
 * NULL karşılaştırma semantiği. `minKpssScore: { gte, lte }` filtresi, veritabanı
 * seviyesinde `minKpssScore IS NULL` olan satırları SESSİZCE eler (SQL üçlü mantık) —
 * bu, canlıda "PDF filtresiyle hiç ilan gelmiyor" şikayetine yol açan gerçek bir
 * regresyondu ve mock'lanmış bir repository ile asla yakalanamazdı; gerçek bir
 * Postgres'e karşı çalışmak gerekiyor. Bu yüzden testcontainers ile geçici bir
 * Postgres ayağa kaldırılıyor.
 */
describe('PrismaJobPostingRepository.list() — minKpssScore filtresi (e2e)', () => {
  let container: StartedTestContainer;
  let prisma: PrismaClient;
  let repository: PrismaJobPostingRepository;
  let sourceId: string;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({ POSTGRES_USER: 'test', POSTGRES_PASSWORD: 'test', POSTGRES_DB: 'test' })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);
    const databaseUrl = `postgresql://test:test@${host}:${port}/test?schema=public`;

    execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });

    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();
    repository = new PrismaJobPostingRepository(prisma as unknown as PrismaService);

    sourceId = randomUUID();
    await prisma.crawlSource.create({
      data: {
        id: sourceId,
        name: 'Test Kaynak',
        baseUrl: 'https://example.com',
        adapterKey: 'manual',
        crawlFrequencyCron: '0 0 * * *',
      },
    });
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it('minKpssScore NULL olan ilanlar, puan aralığı filtresi uygulandığında sonuçlardan düşmez', async () => {
    await prisma.jobPosting.create({
      data: {
        id: randomUUID(),
        sourceId,
        fingerprintHash: randomUUID(),
        institutionName: 'Puan Şartı Olan Kurum',
        positionTitle: 'Uzman',
        minKpssScore: 90,
        status: 'PUBLISHED',
      },
    });
    await prisma.jobPosting.create({
      data: {
        id: randomUUID(),
        sourceId,
        fingerprintHash: randomUUID(),
        institutionName: 'Puan Şartı Olmayan Kurum',
        positionTitle: 'Öğretim Üyesi',
        minKpssScore: null,
        status: 'PUBLISHED',
      },
    });

    // Frontend'in her zaman gönderdiği varsayılan aralık (0-100) ile filtreleme —
    // canlıda tam olarak bu koşulda minKpssScore:NULL olan ilan kayboluyordu.
    const result = await repository.list({ minKpssScore: 0, maxKpssScore: 100, page: 1, pageSize: 10 });

    expect(result.totalCount).toBe(2);
    expect(result.items.map((item) => item.snapshot.institutionName).sort()).toEqual([
      'Puan Şartı Olan Kurum',
      'Puan Şartı Olmayan Kurum',
    ]);
  });

  it('dar bir puan aralığı filtresi, aralık dışındaki puanlı ilanı hâlâ doğru şekilde eler', async () => {
    const result = await repository.list({ minKpssScore: 95, maxKpssScore: 100, page: 1, pageSize: 10 });

    // minKpssScore:90 olan ilan artık aralığın dışında (95-100) -> elenmeli.
    // minKpssScore:NULL olan ilan ise her zaman geçmeli (kriter belirtilmemiş).
    expect(result.items.map((item) => item.snapshot.institutionName)).toEqual([
      'Puan Şartı Olmayan Kurum',
    ]);
  });
});
