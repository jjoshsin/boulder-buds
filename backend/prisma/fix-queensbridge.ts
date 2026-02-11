import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // First let's see what coordinates are currently stored
  const gym = await prisma.gym.findFirst({
    where: { name: { contains: 'Queensbridge' } },
    select: { id: true, name: true, latitude: true, longitude: true, address: true },
  });

  console.log('Current gym data:', gym);

  // Fix with correct coordinates for Brooklyn Boulders Queensbridge
  // 23-10 41st Ave, Long Island City, NY 11101
  await prisma.gym.updateMany({
    where: { name: { contains: 'Queensbridge' } },
    data: {
      latitude: 40.7516,
      longitude: -73.9426,
    },
  });

  console.log('✅ Coordinates updated!');

  // Verify
  const updated = await prisma.gym.findFirst({
    where: { name: { contains: 'Queensbridge' } },
    select: { id: true, name: true, latitude: true, longitude: true },
  });

  console.log('Updated gym data:', updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());