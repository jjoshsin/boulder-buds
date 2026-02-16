import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update existing gyms with city and state
  await prisma.gym.updateMany({
    where: { name: { contains: 'Gowanus' } },
    data: { city: 'Brooklyn', state: 'NY' },
  });

  await prisma.gym.updateMany({
    where: { name: { contains: 'Vital' } },
    data: { city: 'Brooklyn', state: 'NY' },
  });

  await prisma.gym.updateMany({
    where: { name: { contains: 'LIC' } },
    data: { city: 'Long Island City', state: 'NY' },
  });

  await prisma.gym.updateMany({
    where: { name: { contains: 'Queensbridge' } },
    data: { city: 'Long Island City', state: 'NY' },
  });

  console.log('✅ Migrated all gyms from borough to city/state!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());