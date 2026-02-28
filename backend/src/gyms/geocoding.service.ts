import { Injectable } from '@nestjs/common';
import { Client } from '@googlemaps/google-maps-services-js';

@Injectable()
export class GeocodingService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
  }

async geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use full address with city and state for better accuracy
    const fullAddress = `${address}, ${city}, ${state}, USA`;

    console.log(`Geocoding address: ${fullAddress}`);

    const response = await this.client.geocode({
      params: {
        address: fullAddress,
        key: this.apiKey,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Geocoded to: ${location.lat}, ${location.lng}`);
      return { lat: location.lat, lng: location.lng };
    }

    console.log(`No results found for: ${fullAddress}`);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}