import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.166:3000'; // Change to your backend URL

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
  async signUp(email: string, username: string, password: string, age: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          displayName: username,
          password,
          age,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sign up failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token securely
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));

      return data;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token securely
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));

      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
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

  async updateUserProfile(userId: string, displayName: string, birthday: string): Promise<User> {
    try {
      const token = await this.getStoredToken();
      
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName,
          birthday,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser: User = await response.json();
      
      // Update stored user
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async updateUserPreferences(
    userId: string, 
    preferences: { climbingLevel: string; climbingType: string }
  ): Promise<void> {
    try {
      const token = await this.getStoredToken();
      
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }

  async checkProfileComplete(userId: string): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const user = await response.json();
      
      // Check if user has completed basic profile (email/password users already have displayName and age from signup)
      // Profile is considered complete if they have displayName (which they do from signup)
      return !!(user.displayName && user.displayName !== 'Climber');
    } catch (error) {
      console.error('Check profile error:', error);
      return false;
    }
  }
}

export default new AuthService();