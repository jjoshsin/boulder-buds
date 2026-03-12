import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000';

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  contentType: string;
  contentId?: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  reportedUser?: {
    id: string;
    displayName: string;
  };
}

class ReportingService {
  async reportContent(data: {
    reportedUserId?: string;
    contentType: 'review' | 'video' | 'comment' | 'user';
    contentId?: string;
    reason: 'spam' | 'harassment' | 'inappropriate' | 'false_info' | 'other';
    description?: string;
  }): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to submit report');
    }
  }

  async getMyReports(): Promise<Report[]> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/reports/my-reports`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    return response.json();
  }
}

export default new ReportingService();