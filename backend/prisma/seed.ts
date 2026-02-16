import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
await prisma.gym.create({
  data: {
    name: 'Bouldering Project Gowanus',
    address: '575 Degraw St',
    city: 'Brooklyn',
    state: 'NY',
    latitude: 40.6743,
    longitude: -73.9900,
    officialPhotos: [],
    amenities: ['kilter_board', 'spray_wall', 'cafe', 'training_area'],
    priceRange: 2,
    climbingTypes: ['bouldering', 'rope'],
  },
});

await prisma.gym.create({
  data: {
    name: 'Vital Climbing Gym',
    address: '21 West End Ave',
    city: 'Brooklyn',
    state: 'NY',
    latitude: 40.5759,
    longitude: -73.9680,
    officialPhotos: [],
    amenities: ['moon_board', 'training_area', 'showers'],
    priceRange: 2,
    climbingTypes: ['bouldering', 'rope'],
  },
});

await prisma.gym.create({
  data: {
    name: 'The Cliffs at LIC',
    address: '11-11 44th Dr',
    city: 'Long Island City',
    state: 'NY',
    latitude: 40.7448,
    longitude: -73.9512,
    officialPhotos: [],
    amenities: ['spray_wall', 'cafe', 'showers', 'yoga'],
    priceRange: 3,
    climbingTypes: ['bouldering', 'rope'],
  },
});

await prisma.gym.create({
  data: {
    name: 'Brooklyn Boulders Queensbridge',
    address: '23-10 41st Ave',
    city: 'Long Island City',
    state: 'NY',
    latitude: 40.7516,
    longitude: -73.9426,
    officialPhotos: [],
    amenities: ['moon_board', 'kilter_board'],
    priceRange: 2,
    climbingTypes: ['bouldering', 'rope'],
  },
});

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });