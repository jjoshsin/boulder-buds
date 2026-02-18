import { PrismaClient } from '@prisma/client';
import { Client } from '@googlemaps/google-maps-services-js';

const prisma = new PrismaClient();
const googleMapsClient = new Client({});

async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const fullAddress = `${address}, ${city}, ${state}, USA`;
    console.log(`🗺️ Geocoding: ${fullAddress}`);

    const response = await googleMapsClient.geocode({
      params: {
        address: fullAddress,
        key: process.env.GOOGLE_PLACES_API_KEY!,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`✅ Found: ${location.lat}, ${location.lng}`);
      return { lat: location.lat, lng: location.lng };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function main() {
  const gyms = await prisma.gym.findMany();

  console.log(`📍 Re-geocoding ${gyms.length} gyms...`);

  for (const gym of gyms) {
    const coords = await geocodeAddress(gym.address, gym.city, gym.state);

    if (coords) {
      await prisma.gym.update({
        where: { id: gym.id },
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
        },
      });
      console.log(`✅ Updated ${gym.name}`);
    } else {
      console.log(`❌ Failed to geocode ${gym.name}`);
    }

    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('✅ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());