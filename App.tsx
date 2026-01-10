import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity } from 'react-native';
import LoginScreen from './app/LoginScreen';
import WelcomeScreen from './app/WelcomeScreen';
import PersonalizeScreen from './app/PersonalizeScreen';
import authService from './services/authService';

export type RootStackParamList = {
  Login: undefined;
  Welcome: undefined;
  Personalize: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await authService.getStoredToken();
      const user = await authService.getStoredUser();
      
      if (token && user) {
        setIsAuthenticated(true);
        // Check if user has completed their profile
        const profileComplete = await authService.checkProfileComplete(user.id);
        setHasCompletedProfile(profileComplete);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setHasCompletedProfile(false);
  };

  const handleWelcomeComplete = async () => {
    // Mark profile as complete and check preferences
    const user = await authService.getStoredUser();
    if (user) {
      const profileComplete = await authService.checkProfileComplete(user.id);
      if (profileComplete) {
        // Profile is complete, check if they want to do preferences
        setShowPersonalize(true);
      }
    }
  };

  const handlePersonalizeBack = () => {
    setShowPersonalize(false);
  };

  const handlePersonalizeComplete = async () => {
    setShowPersonalize(false);
    // Recheck profile status
    const user = await authService.getStoredUser();
    if (user) {
      const profileComplete = await authService.checkProfileComplete(user.id);
      setHasCompletedProfile(profileComplete);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setHasCompletedProfile(false);
    setShowPersonalize(false);
  };

  if (isLoading) {
    // You can add a splash screen here later
    return null;
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
          ) : hasCompletedProfile ? (
            <Stack.Screen name="Welcome">
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
          ) : !showPersonalize ? (
            <Stack.Screen name="Welcome">
              {(props) => <WelcomeScreen {...props} onBack={handleLogout} onContinue={handleWelcomeComplete} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Personalize">
              {() => (
                <PersonalizeScreen 
                  onComplete={handlePersonalizeComplete}
                  onBack={handlePersonalizeBack}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </>
  );
}