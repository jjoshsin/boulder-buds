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

async geocodeAddress(address: string, borough: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Normalize hyphenated NYC addresses e.g. "23-10 41st Ave" → "2310 41st Ave"
    const normalizedAddress = address.replace(/(\d+)-(\d+)/, '$1$2');
    
    // Try with normalized address first
    const fullAddress = `${normalizedAddress}, ${borough}, New York, NY`;
    
    console.log(`🗺️ Geocoding address: ${fullAddress}`);

    const response = await this.client.geocode({
      params: {
        address: fullAddress,
        key: this.apiKey,
        // Bias results to NYC bounding box
        bounds: {
          northeast: { lat: 40.9176, lng: -73.7004 },
          southwest: { lat: 40.4774, lng: -74.2591 },
        },
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`✅ Geocoded to: ${location.lat}, ${location.lng}`);
      return { lat: location.lat, lng: location.lng };
    }

    // Fallback: try original address if normalized didn't work
    console.warn(`⚠️ Normalized address failed, trying original...`);
    const fallbackResponse = await this.client.geocode({
      params: {
        address: `${address}, ${borough}, New York, NY`,
        key: this.apiKey,
      },
    });

    if (fallbackResponse.data.results && fallbackResponse.data.results.length > 0) {
      const location = fallbackResponse.data.results[0].geometry.location;
      console.log(`✅ Fallback geocoded to: ${location.lat}, ${location.lng}`);
      return { lat: location.lat, lng: location.lng };
    }

    console.warn(`⚠️ No geocoding results found for: ${address}`);
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