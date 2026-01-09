import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
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
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await authService.getStoredToken();
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowPersonalize(false);
  };

  const handleWelcomeComplete = () => {
    setShowPersonalize(true);
  };

  const handlePersonalizeComplete = () => {
    // TODO: Navigate to Gym List
    console.log('Personalization complete - ready for Gym List!');
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
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
          ) : !showPersonalize ? (
            <Stack.Screen name="Welcome">
              {(props) => <WelcomeScreen {...props} onBack={handleLogout} onContinue={handleWelcomeComplete} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Personalize">
              {(props) => <PersonalizeScreen {...props} onComplete={handlePersonalizeComplete} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </>
  );
}