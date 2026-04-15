import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000';

export interface ClimbLog {
  id: string;
  userId: string;
  gymId: string;
  gym: { id: string; name: string; city: string; state: string };
  climbType: 'boulder' | 'rope';
  grade: string;
  outcome: 'sent' | 'flash' | 'onsight' | 'project';
  notes?: string;
  date: string;
  createdAt: string;
}

export interface FriendClimbLog extends ClimbLog {
  user: { id: string; displayName: string; profilePhoto?: string };
}

export interface ClimbStats {
  totalSessions: number;
  sent: number;
  boulderGrades: Record<string, number>;
  ropeGrades: Record<string, number>;
}

class ClimbLogService {
  private async getHeaders() {
    const token = await SecureStore.getItemAsync('authToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async createLog(data: {
    gymId: string;
    climbType: 'boulder' | 'rope';
    grade: string;
    outcome: 'sent' | 'flash' | 'onsight' | 'project';
    notes?: string;
    date?: string;
  }): Promise<ClimbLog> {
    const response = await fetch(`${API_URL}/climb-logs`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to save log');
    }
    return response.json();
  }

  async getMyLogs(limit = 50): Promise<ClimbLog[]> {
    const response = await fetch(`${API_URL}/climb-logs/me?limit=${limit}`, {
      headers: await this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  }

  async getMyStats(): Promise<ClimbStats> {
    const response = await fetch(`${API_URL}/climb-logs/me/stats`, {
      headers: await this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  async getFriendFeed(): Promise<FriendClimbLog[]> {
    const response = await fetch(`${API_URL}/climb-logs/feed`, {
      headers: await this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch feed');
    return response.json();
  }

  async getUserLogs(userId: string): Promise<ClimbLog[]> {
    const response = await fetch(`${API_URL}/climb-logs/user/${userId}`, {
      headers: await this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  }

  async deleteLog(logId: string): Promise<void> {
    const response = await fetch(`${API_URL}/climb-logs/${logId}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete log');
  }
}

export default new ClimbLogService();
