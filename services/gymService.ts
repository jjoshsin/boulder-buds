import * as SecureStore from 'expo-secure-store';
import locationService from './locationService';

const API_URL = 'http://192.168.1.166:3000';

export interface Gym {
  id: string;
  name: string;
  address?: string;
  borough: string;
  latitude?: number;
  longitude?: number;
  officialPhotos?: string[]; // Changed from photos
  communityPhotos?: CommunityPhoto[]; // New
  amenities?: string[];
  priceRange?: number;
  climbingTypes?: string[];
  rating?: number;
  reviewCount?: number;
  distance?: string;
  tags?: string[];
  reviews?: Review[];
}

export interface CommunityPhoto {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
  user: {
    displayName: string;
  };
}

export interface Review {
  id: string;
  overallRating: number;
  reviewText?: string;
  tags?: string[];
  createdAt: string;
  user: {
    displayName: string;
  };
}

class GymService {
  async getPopularGyms(): Promise<Gym[]> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      
      const response = await fetch(`${API_URL}/gyms/popular`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch popular gyms');
      }

      return await response.json();
    } catch (error) {
      console.error('Get popular gyms error:', error);
      throw error;
    }
  }

async getNearbyGyms(): Promise<Gym[]> {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    
    const response = await fetch(`${API_URL}/gyms/nearby`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch nearby gyms');
    }

    const gyms: Gym[] = await response.json();

    // Get user's real GPS location
    const userLocation = await locationService.getCurrentLocation();

    if (userLocation) {
      const gymsWithDistance = gyms.map(gym => {
        if (gym.latitude && gym.longitude) {
          const distance = locationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            gym.latitude,
            gym.longitude
          );
          return {
            ...gym,
            distance: `${distance} mi`,
          };
        }
        return gym;
      });

      // Sort by closest first
      return gymsWithDistance.sort((a, b) => {
        const distA = parseFloat(a.distance?.replace(' mi', '') || '999');
        const distB = parseFloat(b.distance?.replace(' mi', '') || '999');
        return distA - distB;
      });
    }

    return gyms;
  } catch (error) {
    console.error('Get nearby gyms error:', error);
    throw error;
  }
}

  async getAllGyms(): Promise<Gym[]> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      
      const response = await fetch(`${API_URL}/gyms`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gyms');
      }

      return await response.json();
    } catch (error) {
      console.error('Get gyms error:', error);
      throw error;
    }
  }

  async getGymById(id: string): Promise<Gym> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      
      const response = await fetch(`${API_URL}/gyms/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gym');
      }

      return await response.json();
    } catch (error) {
      console.error('Get gym error:', error);
      throw error;
    }
  }
}

export default new GymService();