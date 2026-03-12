import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000';

export interface FavoriteGym {
  id: string;
  listType: string;
  notes?: string;
  createdAt: string;
  gym: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    rating: number;
    reviewCount: number;
    officialPhotos: string[];
    amenities: string[];
    climbingTypes: string[];
  };
}

export interface FavoriteStatus {
  favorites: boolean;
  want_to_visit: boolean;
  bucket_list: boolean;
}

export interface FavoriteCounts {
  favorites: number;
  want_to_visit: number;
  bucket_list: number;
  total: number;
}

class FavoritesService {
  async addFavorite(gymId: string, listType: string, notes?: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ gymId, listType, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add favorite');
    }
  }

  async removeFavorite(gymId: string, listType: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/favorites/${gymId}/${listType}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove favorite');
    }
  }

  async getUserFavorites(listType?: string): Promise<FavoriteGym[]> {
    const token = await SecureStore.getItemAsync('authToken');
    const queryParam = listType ? `?listType=${listType}` : '';

    const response = await fetch(`${API_URL}/favorites${queryParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch favorites');
    }

    return response.json();
  }

  async getFavoriteStatus(gymId: string): Promise<FavoriteStatus> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/favorites/status/${gymId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        favorites: false,
        want_to_visit: false,
        bucket_list: false,
      };
    }

    return response.json();
  }

  async getFavoriteCounts(): Promise<FavoriteCounts> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/favorites/counts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch favorite counts');
    }

    return response.json();
  }

  async updateNotes(gymId: string, listType: string, notes: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/favorites/${gymId}/${listType}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error('Failed to update notes');
    }
  }
}

export default new FavoritesService();