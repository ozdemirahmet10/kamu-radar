import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cities: Array<{ name: string; plateCode: number }> = [
  { name: 'Adana', plateCode: 1 },
  { name: 'Adıyaman', plateCode: 2 },
  { name: 'Afyonkarahisar', plateCode: 3 },
  { name: 'Ağrı', plateCode: 4 },
  { name: 'Amasya', plateCode: 5 },
  { name: 'Ankara', plateCode: 6 },
  { name: 'Antalya', plateCode: 7 },
  { name: 'Artvin', plateCode: 8 },
  { name: 'Aydın', plateCode: 9 },
  { name: 'Balıkesir', plateCode: 10 },
  { name: 'Bilecik', plateCode: 11 },
  { name: 'Bingöl', plateCode: 12 },
  { name: 'Bitlis', plateCode: 13 },
  { name: 'Bolu', plateCode: 14 },
  { name: 'Burdur', plateCode: 15 },
  { name: 'Bursa', plateCode: 16 },
  { name: 'Çanakkale', plateCode: 17 },
  { name: 'Çankırı', plateCode: 18 },
  { name: 'Çorum', plateCode: 19 },
  { name: 'Denizli', plateCode: 20 },
  { name: 'Diyarbakır', plateCode: 21 },
  { name: 'Edirne', plateCode: 22 },
  { name: 'Elazığ', plateCode: 23 },
  { name: 'Erzincan', plateCode: 24 },
  { name: 'Erzurum', plateCode: 25 },
  { name: 'Eskişehir', plateCode: 26 },
  { name: 'Gaziantep', plateCode: 27 },
  { name: 'Giresun', plateCode: 28 },
  { name: 'Gümüşhane', plateCode: 29 },
  { name: 'Hakkari', plateCode: 30 },
  { name: 'Hatay', plateCode: 31 },
  { name: 'Isparta', plateCode: 32 },
  { name: 'Mersin', plateCode: 33 },
  { name: 'İstanbul', plateCode: 34 },
  { name: 'İzmir', plateCode: 35 },
  { name: 'Kars', plateCode: 36 },
  { name: 'Kastamonu', plateCode: 37 },
  { name: 'Kayseri', plateCode: 38 },
  { name: 'Kırklareli', plateCode: 39 },
  { name: 'Kırşehir', plateCode: 40 },
  { name: 'Kocaeli', plateCode: 41 },
  { name: 'Konya', plateCode: 42 },
  { name: 'Kütahya', plateCode: 43 },
  { name: 'Malatya', plateCode: 44 },
  { name: 'Manisa', plateCode: 45 },
  { name: 'Kahramanmaraş', plateCode: 46 },
  { name: 'Mardin', plateCode: 47 },
  { name: 'Muğla', plateCode: 48 },
  { name: 'Muş', plateCode: 49 },
  { name: 'Nevşehir', plateCode: 50 },
  { name: 'Niğde', plateCode: 51 },
  { name: 'Ordu', plateCode: 52 },
  { name: 'Rize', plateCode: 53 },
  { name: 'Sakarya', plateCode: 54 },
  { name: 'Samsun', plateCode: 55 },
  { name: 'Siirt', plateCode: 56 },
  { name: 'Sinop', plateCode: 57 },
  { name: 'Sivas', plateCode: 58 },
  { name: 'Tekirdağ', plateCode: 59 },
  { name: 'Tokat', plateCode: 60 },
  { name: 'Trabzon', plateCode: 61 },
  { name: 'Tunceli', plateCode: 62 },
  { name: 'Şanlıurfa', plateCode: 63 },
  { name: 'Uşak', plateCode: 64 },
  { name: 'Van', plateCode: 65 },
  { name: 'Yozgat', plateCode: 66 },
  { name: 'Zonguldak', plateCode: 67 },
  { name: 'Aksaray', plateCode: 68 },
  { name: 'Bayburt', plateCode: 69 },
  { name: 'Karaman', plateCode: 70 },
  { name: 'Kırıkkale', plateCode: 71 },
  { name: 'Batman', plateCode: 72 },
  { name: 'Şırnak', plateCode: 73 },
  { name: 'Bartın', plateCode: 74 },
  { name: 'Ardahan', plateCode: 75 },
  { name: 'Iğdır', plateCode: 76 },
  { name: 'Yalova', plateCode: 77 },
  { name: 'Karabük', plateCode: 78 },
  { name: 'Kilis', plateCode: 79 },
  { name: 'Osmaniye', plateCode: 80 },
  { name: 'Düzce', plateCode: 81 },
];

async function main(): Promise<void> {
  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: city,
    });
  }
  console.log(`${cities.length} şehir referans verisi yüklendi.`);

  await prisma.crawlSource.upsert({
    where: { name: 'Manuel Giriş' },
    update: {},
    create: {
      name: 'Manuel Giriş',
      baseUrl: 'https://kamu-radar.internal/manual',
      adapterKey: 'manual',
      crawlFrequencyCron: '',
      isActive: false,
    },
  });
  console.log('Manuel Giriş kaynağı (CrawlSource) yüklendi.');

  await prisma.crawlSource.upsert({
    where: { name: 'Kamu İlan Portalı (SBB)' },
    update: {},
    create: {
      name: 'Kamu İlan Portalı (SBB)',
      baseUrl: 'https://kamuilan.sbb.gov.tr/',
      adapterKey: 'sbb-kamuilan',
      crawlFrequencyCron: '0 */6 * * *',
      isActive: true,
    },
  });
  console.log('Kamu İlan Portalı (SBB) kaynağı (CrawlSource) yüklendi.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
