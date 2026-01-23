import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Brooklyn Boulders Gowanus
  await prisma.gym.create({
    data: {
      name: 'Brooklyn Boulders Gowanus',
      address: '575 Degraw St, Brooklyn, NY 11217',
      borough: 'Brooklyn',
      latitude: 40.6755,
      longitude: -73.9879,
      photos: [],
      amenities: ['kilter_board', 'spray_wall', 'cafe', 'training_area'],
      priceRange: 2,
      climbingTypes: ['bouldering', 'rope'],
    },
  });

  // Vital Climbing Gym
  await prisma.gym.create({
    data: {
      name: 'Vital Climbing Gym',
      address: '21 West End Ave, Brooklyn, NY 11235',
      borough: 'Brooklyn',
      latitude: 40.5788,
      longitude: -73.9658,
      photos: [],
      amenities: ['moon_board', 'training_area', 'showers'],
      priceRange: 2,
      climbingTypes: ['bouldering', 'rope'],
    },
  });

  // The Cliffs LIC
  await prisma.gym.create({
    data: {
      name: 'The Cliffs at LIC',
      address: '11-11 44th Dr, Long Island City, NY 11101',
      borough: 'Queens',
      latitude: 40.7449,
      longitude: -73.9520,
      photos: [],
      amenities: ['spray_wall', 'cafe', 'showers', 'yoga'],
      priceRange: 3,
      climbingTypes: ['bouldering', 'rope'],
    },
  });

  console.log('✅ Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });