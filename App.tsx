import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity } from 'react-native';
import LandingScreen from './app/LandingScreen';
import SignUpScreen from './app/SignUpScreen';
import LoginScreen from './app/LoginScreen';
import PersonalizeScreen from './app/PersonalizeScreen';
import authService from './services/authService';

export type RootStackParamList = {
  Landing: undefined;
  SignUp: undefined;
  Login: undefined;
  Personalize: undefined;
  GymList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'signup' | 'login'>('landing');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await authService.getStoredToken();
      const user = await authService.getStoredUser();
      
      console.log('🔍 Checking auth status...');
      console.log('Token exists:', !!token);
      console.log('User:', user);
      
      if (token && user) {
        setIsAuthenticated(true);
        // Check if user has completed their profile
        const profileComplete = await authService.checkProfileComplete(user.id);
        console.log('Profile complete:', profileComplete);
        setHasCompletedProfile(profileComplete);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSuccess = async () => {
    setIsAuthenticated(true);
    // Email/password users complete their profile during signup, so they can skip personalize
    // But we'll show personalize to let them set climbing preferences (optional)
    setHasCompletedProfile(false);
  };

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    
    // Check if user already has a complete profile
    const user = await authService.getStoredUser();
    if (user) {
      const profileComplete = await authService.checkProfileComplete(user.id);
      console.log('After login - Profile complete:', profileComplete);
      setHasCompletedProfile(profileComplete);
    }
  };

  const handlePersonalizeComplete = async () => {
    // Mark profile as complete and go to gym list
    setHasCompletedProfile(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setHasCompletedProfile(false);
    setCurrentScreen('landing');
  };

  if (isLoading) {
    return null;
  }

  console.log('📱 Navigation State:', {
    isAuthenticated,
    hasCompletedProfile,
  });

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!isAuthenticated ? (
            <>
              {currentScreen === 'landing' && (
                <Stack.Screen name="Landing">
                  {() => (
                    <LandingScreen 
                      onGetStarted={() => setCurrentScreen('signup')}
                      onLogin={() => setCurrentScreen('login')}
                    />
                  )}
                </Stack.Screen>
              )}
              {currentScreen === 'signup' && (
                <Stack.Screen name="SignUp">
                  {() => (
                    <SignUpScreen 
                      onBack={() => setCurrentScreen('landing')}
                      onContinue={handleSignUpSuccess}
                    />
                  )}
                </Stack.Screen>
              )}
              {currentScreen === 'login' && (
                <Stack.Screen name="Login">
                  {() => (
                    <LoginScreen 
                      onBack={() => setCurrentScreen('landing')}
                      onLoginSuccess={handleLoginSuccess}
                    />
                  )}
                </Stack.Screen>
              )}
            </>
          ) : hasCompletedProfile ? (
            <Stack.Screen name="GymList">
              {() => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>
                    Gym List Coming Soon!
                  </Text>
                  <TouchableOpacity 
                    onPress={handleLogout}
                    style={{ marginTop: 20, padding: 12, backgroundColor: '#FF8C00', borderRadius: 8 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Logout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Personalize">
              {() => (
                <PersonalizeScreen 
                  onComplete={handlePersonalizeComplete}
                  onBack={handleLogout}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </>
  );
}