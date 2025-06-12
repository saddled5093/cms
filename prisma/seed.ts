
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/authUtils';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const adminPassword = await hashPassword('123');
  const userPassword = await hashPassword('123');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: "ADMIN", // Changed to string literal
    },
  });
  console.log(`Created admin user: ${admin.username}`);

  for (let i = 1; i <= 4; i++) {
    const username = `user${i}`;
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: userPassword,
        role: "USER", // Changed to string literal
      },
    });
    console.log(`Created user: ${user.username}`);
  }
  
  // Seed initial categories if needed
  const defaultCategories = ["عمومی", "کاری", "شخصی"];
  for (const catName of defaultCategories) {
    const category = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
      },
    });
    console.log(`Created category: ${category.name}`);
  }


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
