import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main(): Promise<void> {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  if (!email || !newPassword) {
    console.error('Kullanım: ts-node scripts/reset-password.ts <email> <yeniSifre>');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const user = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { passwordHash },
  });

  console.log(`${user.email} kullanıcısının şifresi güncellendi.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
