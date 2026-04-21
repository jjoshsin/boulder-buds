import * as SecureStore from 'expo-secure-store';
import locationService from './locationService';

const API_URL = 'http://192.168.1.166:3000';

export interface Gym {
  id: string;
  name: string;
  address?: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  officialPhotos?: string[];
  communityPhotos?: CommunityPhoto[];
  amenities?: string[];
  priceRange?: number;
  climbingTypes?: string[];
  rating?: number;
  reviewCount?: number;
  distance?: number | string;
  tags?: string[];
  reviews?: Review[];
  likeCount?: number;
  registeredByUser?: {
    id: string;
    displayName: string;
    profilePhoto?: string;
  };
  dayPassPrice?: number | null;
  monthlyMembershipPrice?: number | null;
  studentDiscountAvailable?: boolean;
  studentDiscountDetails?: string | null;
}

export interface CommunityPhoto {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
  likeCount: number;
  user: {
    id: string;
    displayName: string;
    profilePhoto?: string;
  };
}

export interface Review {
  id: string;
  overallRating: number;
  reviewText?: string;
  tags?: string[];
  createdAt: string;
  userId?: string;
  setting?: string;
  difficulty?: string;
  photos?: string[];
  likes?: { userId: string }[];
  likeCount?: number;
  user: {
    id?: string;
    displayName: string;
    profilePhoto?: string;
  };
}

class GymService {
async getPopularGyms(climbingType?: string | null): Promise<Gym[]> {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    
    const url = climbingType && climbingType !== 'both'
      ? `${API_URL}/gyms/popular?climbingType=${climbingType}`
      : `${API_URL}/gyms/popular`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch popular gyms');
    return await response.json();
  } catch (error) {
    console.error('Get popular gyms error:', error);
    throw error;
  }
}

async getNearbyGyms(climbingType?: string | null): Promise<Gym[]> {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    
    const url = climbingType && climbingType !== 'both'
      ? `${API_URL}/gyms/nearby?climbingType=${climbingType}`
      : `${API_URL}/gyms/nearby`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch nearby gyms');

    const gyms: Gym[] = await response.json();
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
          return { ...gym, distance: `${distance} mi` };
        }
        return gym;
      });

return gymsWithDistance.sort((a, b) => {
  const distA = typeof a.distance === 'string' 
    ? parseFloat(a.distance.replace(' mi', '')) 
    : (a.distance || 999);
  const distB = typeof b.distance === 'string' 
    ? parseFloat(b.distance.replace(' mi', '')) 
    : (b.distance || 999);
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

async getGymsNearLocation(latitude: number, longitude: number, radiusMiles: number = 15): Promise<Gym[]> {
  const token = await SecureStore.getItemAsync('authToken');
  const url = `${API_URL}/gyms/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radiusMiles}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response:', errorText);
    throw new Error(`Failed to fetch nearby gyms: ${response.status} - ${errorText}`);
  }

  return response.json();
}
  async updatePricing(gymId: string, data: {
    dayPassPrice?: number | null;
    monthlyMembershipPrice?: number | null;
    studentDiscountAvailable?: boolean;
    studentDiscountDetails?: string | null;
  }): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');
    const response = await fetch(`${API_URL}/gyms/${gymId}/pricing`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update pricing');
  }
}


export default new GymService();