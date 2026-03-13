import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000';

export interface SavedGym {
  id: string;
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

class FavoritesService {
  async saveGym(gymId: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/saved-gyms/${gymId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save gym');
    }
  }

  async unsaveGym(gymId: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/saved-gyms/${gymId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to unsave gym');
    }
  }

  async isSaved(gymId: string): Promise<boolean> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/saved-gyms/check/${gymId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.saved;
  }

  async getSavedGyms(): Promise<SavedGym[]> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/saved-gyms`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch saved gyms');
    }

    return response.json();
  }

  async getSavedCount(): Promise<number> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/saved-gyms/count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch saved count');
    }

    const data = await response.json();
    return data.count;
  }
}

export default new FavoritesService();