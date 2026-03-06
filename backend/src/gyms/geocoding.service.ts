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

  async geocodeAddressWithValidation(
    address: string,
    city: string,
    state: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const fullAddress = `${address}, ${city}, ${state}, USA`;

    try {
      console.log(`Geocoding with validation: ${fullAddress}`);

      const response = await this.client.geocode({
        params: {
          address: fullAddress,
          key: this.apiKey,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        const addressComponents = result.address_components;

        // Validate that the result actually contains the city and state we specified
        const hasCity = addressComponents.some(
          (component: any) =>
            component.types.includes('locality') &&
            component.long_name.toLowerCase().includes(city.toLowerCase()),
        );

        const hasState = addressComponents.some(
          (component: any) =>
            component.types.includes('administrative_area_level_1') &&
            component.short_name === state,
        );

        // Must have street_number to be a valid street address
        const hasStreetNumber = addressComponents.some(
          (component: any) => component.types.includes('street_number'),
        );

        // Must have route (street name)
        const hasRoute = addressComponents.some(
          (component: any) => component.types.includes('route'),
        );

        // Check location type - should be ROOFTOP or RANGE_INTERPOLATED for valid addresses
        const locationType = result.geometry.location_type;
        const isAccurateLocation = 
          locationType === 'ROOFTOP' || 
          locationType === 'RANGE_INTERPOLATED';

        // Verify coordinates are in continental USA
        const inUSA = 
          location.lat >= 24 && location.lat <= 50 &&
          location.lng >= -125 && location.lng <= -65;

        console.log('Geocode validation:', {
          hasCity,
          hasState,
          hasStreetNumber,
          hasRoute,
          locationType,
          isAccurateLocation,
          inUSA,
        });

        // All checks must pass
        if (hasCity && hasState && hasStreetNumber && hasRoute && isAccurateLocation && inUSA) {
          console.log(`✅ Address validated: ${location.lat}, ${location.lng}`);
          return {
            lat: location.lat,
            lng: location.lng,
          };
        }

        console.warn('❌ Address validation failed - missing required components or inaccurate location');
        return null;
      }

      console.warn('❌ Geocoding returned no results');
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