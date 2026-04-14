import { Injectable } from '@nestjs/common';
import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';

interface PhotoCache {
  urls: string[];
  timestamp: number;
}

@Injectable()
export class GooglePlacesService {
  private client: Client;
  private apiKey: string;
  // Cache photo references per placeId for 1 hour to avoid re-hitting Google on every proxy request
  private photoCache = new Map<string, PhotoCache>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000;

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

      const photos = response.data.result.photos.slice(0, maxPhotos);

      return photos.map(
        photo =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${this.apiKey}`,
      );
    } catch (error) {
      console.error('Error fetching gym photos:', error);
      return [];
    }
  }

  // Returns fresh photo URLs for a placeId, using an in-memory cache to avoid
  // hammering the Google API on every proxy request.
  async getFreshPhotoUrls(placeId: string, maxPhotos: number = 3): Promise<string[]> {
    const cached = this.photoCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.urls;
    }

    const urls = await this.getGymPhotos(placeId, maxPhotos);
    this.photoCache.set(placeId, { urls, timestamp: Date.now() });
    return urls;
  }

  async fetchAndSetGymPhotos(
    gymName: string,
    address?: string,
  ): Promise<{ placeId: string | null; photoUrls: string[] }> {
    try {
      console.log(`🔍 Searching for gym: ${gymName}`);

      const placeId = await this.searchGym(gymName, address);
      if (!placeId) {
        console.log(`Could not find place ID for: ${gymName}`);
        return { placeId: null, photoUrls: [] };
      }

      console.log(`Found place ID: ${placeId}`);

      const photoUrls = await this.getGymPhotos(placeId, 3);
      // Warm the cache while we're here
      this.photoCache.set(placeId, { urls: photoUrls, timestamp: Date.now() });

      console.log(`Found ${photoUrls.length} photos for ${gymName}`);

      return { placeId, photoUrls };
    } catch (error) {
      console.error('Error in fetchAndSetGymPhotos:', error);
      return { placeId: null, photoUrls: [] };
    }
  }
}
