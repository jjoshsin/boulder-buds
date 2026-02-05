import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity } from 'react-native';
import LandingScreen from './app/LandingScreen';
import SignUpScreen from './app/SignUpScreen';
import LoginScreen from './app/LoginScreen';
import PersonalizeScreen from './app/PersonalizeScreen';
import HomeScreen from './app/HomeScreen';
import ExploreScreen from './app/ExploreScreen';
import PostScreen from './app/PostScreen';
import ProfileScreen from './app/ProfileScreen';
import GymDetailScreen from './app/GymDetailScreen';
import WriteReviewScreen from './app/WriteReviewScreen';
import authService from './services/authService';

export type RootStackParamList = {
  Landing: undefined;
  SignUp: undefined;
  Login: undefined;
  Personalize: undefined;
  MainTabs: undefined;
  GymDetail: { gymId: string };
  WriteReview: { 
    gymId: string; 
    gymName: string;
    reviewId?: string;
    existingReview?: string; 
  };
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Post: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF8C00',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ marginTop: -2 }}>
              <Text style={{ fontSize: 28, color }}>➕</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      >
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

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
    setHasCompletedProfile(false);
  };

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    
    const user = await authService.getStoredUser();
    if (user) {
      const profileComplete = await authService.checkProfileComplete(user.id);
      console.log('After login - Profile complete:', profileComplete);
      setHasCompletedProfile(profileComplete);
    }
  };

  const handlePersonalizeComplete = async () => {
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
            <>
              <Stack.Screen name="MainTabs">
                {() => <MainTabs onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen 
                name="GymDetail" 
                component={GymDetailScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="WriteReview" 
                component={WriteReviewScreen}
                options={{ headerShown: false }}
              />
            </>
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