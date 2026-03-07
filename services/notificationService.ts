import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  actorId: string;
  entityId?: string;
  entityType?: string;
  message: string;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    displayName: string;
    profilePhoto?: string;
  };
}

class NotificationService {
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/notifications?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }

  async getUnreadCount(): Promise<number> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    const data = await response.json();
    return data.count;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark as read');
    }
  }

  async markAllAsRead(): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  }
}

export default new NotificationService();