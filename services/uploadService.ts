import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000';

class UploadService {
  async uploadImage(uri: string): Promise<string> {
    try {
      const token = await SecureStore.getItemAsync('authToken');

      // Create form data
      const formData = new FormData();
      
      // Get file extension
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }
}

export default new UploadService();