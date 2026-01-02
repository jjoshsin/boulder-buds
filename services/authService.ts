// ============================================
// FILE: services/authService.ts
// ============================================
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3000'; // Change to your backend URL

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  async signInWithApple(identityToken: string, user: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken,
          user,
        }),
      });

      if (!response.ok) {
        throw new Error('Apple sign in failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token securely
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  }

  async signInWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Google sign in failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token securely
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('authToken');
  }

  async getStoredUser(): Promise<User | null> {
    const userString = await SecureStore.getItemAsync('user');
    return userString ? JSON.parse(userString) : null;
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('user');
  }
}

export default new AuthService();

// ============================================
// INSTALL SECURE STORE:
// npx expo install expo-secure-store
// ============================================