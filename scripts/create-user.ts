import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: '管理者',
      role: 'admin',
    },
  });

  console.log('管理者ユーザーを作成しました');
  console.log('Email: admin@test.com');
  console.log('Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
