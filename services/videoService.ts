import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000';

export interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption?: string;
  gymId: string;
  userId: string;
  views: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto?: string;
  };
  gym: {
    id: string;
    name: string;
  };
  likes?: { userId: string }[];
}

export interface VideoComment {
  id: string;
  text: string;
  userId: string;
  videoId: string;
  parentId?: string;
  likeCount: number;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto?: string;
  };
  likes: { userId: string }[];
  replies?: VideoComment[];
}

export interface VideoDetail extends Video {
  comments: VideoComment[];
}

class VideoService {
  async uploadVideo(videoUri: string): Promise<{ videoUrl: string; thumbnailUrl: string }> {
    const token = await SecureStore.getItemAsync('authToken');
    
    const filename = videoUri.split('/').pop() || 'video.mp4';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : 'video/mp4';

    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_URL}/upload/video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload video');
    }

    return response.json();
  }

  async createVideo(data: {
    gymId: string;
    videoUrl: string;
    thumbnailUrl: string;
    caption?: string;
  }): Promise<Video> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create video');
    }

    return response.json();
  }

  async getGymVideos(
    gymId: string,
    sortBy?: 'mostLiked' | 'mostRecent' | 'mostViewed' | 'mostCommented',
    limit?: number,
  ): Promise<Video[]> {
    const params = new URLSearchParams();
    if (sortBy) params.append('sortBy', sortBy);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(
      `${API_URL}/videos/gym/${gymId}?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch gym videos');
    }

    return response.json();
  }

  async getUserVideos(userId: string): Promise<Video[]> {
    const response = await fetch(`${API_URL}/videos/user/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch user videos');
    }

    return response.json();
  }

  async getVideoById(videoId: string): Promise<VideoDetail> {
    const response = await fetch(`${API_URL}/videos/${videoId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch video');
    }

    return response.json();
  }

  async incrementViews(videoId: string): Promise<void> {
    await fetch(`${API_URL}/videos/${videoId}/view`, {
      method: 'POST',
    });
  }

  async toggleLike(videoId: string): Promise<{ liked: boolean }> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/videos/${videoId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }

    return response.json();
  }

  async addComment(videoId: string, text: string, parentId?: string): Promise<VideoComment> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/videos/${videoId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text, parentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return response.json();
  }

  async toggleCommentLike(commentId: string): Promise<{ liked: boolean; likeCount: number }> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/videos/comments/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to toggle comment like');
    }

    return response.json();
  }

  async deleteComment(commentId: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/videos/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete video');
    }
  }
}

export default new VideoService();