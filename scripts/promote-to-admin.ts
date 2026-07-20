import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error('Kullanım: npm run promote:admin -- <email>');
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { role: 'ADMIN' },
  });

  console.log(`${user.email} kullanıcısı ADMIN rolüne yükseltildi.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
