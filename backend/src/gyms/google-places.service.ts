import { Injectable } from '@nestjs/common';
import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';

@Injectable()
export class GooglePlacesService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
  }

  async searchGym(gymName: string, address?: string): Promise<string | null> {
    try {
      const query = address ? `${gymName} ${address}` : gymName;
      
      const response = await this.client.findPlaceFromText({
        params: {
          input: query,
          inputtype: PlaceInputType.textQuery,
          fields: ['place_id', 'name'],
          key: this.apiKey,
        },
      });

      if (response.data.candidates && response.data.candidates.length > 0) {
        return response.data.candidates[0].place_id;
      }

      return null;
    } catch (error) {
      console.error('Error searching for gym:', error);
      return null;
    }
  }

  async getGymPhotos(placeId: string, maxPhotos: number = 3): Promise<string[]> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: ['photos'],
          key: this.apiKey,
        },
      });

      if (!response.data.result.photos) {
        console.log('No photos found for place:', placeId);
        return [];
      }

      // Get photo URLs (limit to maxPhotos)
      const photos = response.data.result.photos.slice(0, maxPhotos);
      
      const photoUrls = photos.map(photo => {
        // Google Photos API URL
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${this.apiKey}`;
      });

      return photoUrls;
    } catch (error) {
      console.error('Error fetching gym photos:', error);
      return [];
    }
  }

  async fetchAndSetGymPhotos(gymName: string, address?: string): Promise<string[]> {
    try {
      console.log(`🔍 Searching for gym: ${gymName}`);
      
      // Step 1: Find the gym's Place ID
      const placeId = await this.searchGym(gymName, address);
      
      if (!placeId) {
        console.log(`Could not find place ID for: ${gymName}`);
        return [];
      }

      console.log(`Found place ID: ${placeId}`);

      // Step 2: Get photos for this gym
      const photoUrls = await this.getGymPhotos(placeId, 3);
      
      console.log(`Found ${photoUrls.length} photos for ${gymName}`);
      
      return photoUrls;
    } catch (error) {
      console.error('Error in fetchAndSetGymPhotos:', error);
      return [];
    }
  }
}