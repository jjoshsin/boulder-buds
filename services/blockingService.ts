import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000';

export interface BlockedUser {
  id: string;
  displayName: string;
  profilePhoto?: string;
}

class BlockingService {
  async blockUser(userId: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/blocking/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to block user');
    }
  }

  async unblockUser(userId: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/blocking/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to unblock user');
    }
  }

  async getBlockedUsers(): Promise<BlockedUser[]> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/blocking`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch blocked users');
    }

    return response.json();
  }

  async isBlocked(userId: string): Promise<boolean> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/blocking/check/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.blocked;
  }
}

export default new BlockingService();