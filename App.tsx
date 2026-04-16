import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AuthContext } from './contexts/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import AllReviewsScreen from './app/AllReviewsScreen';
import LandingScreen from './app/LandingScreen';
import SignUpScreen from './app/SignUpScreen';
import LoginScreen from './app/LoginScreen';
import PersonalizeScreen from './app/PersonalizeScreen';
import HomeScreen from './app/HomeScreen';
import ExploreScreen from './app/ExploreScreen';
import PeopleScreen from './app/PeopleScreen';
import ProfileScreen from './app/ProfileScreen';
import LogScreen from './app/LogScreen';
import LogClimbScreen from './app/LogClimbScreen';
import GymDetailScreen from './app/GymDetailScreen';
import SettingsScreen from './app/SettingsScreen';
import WriteReviewScreen from './app/WriteReviewScreen';
import FollowListScreen from './app/FollowListScreen';
import UserProfileScreen from './app/UserProfileScreen';
import authService from './services/authService';
import ForgotPasswordScreen from './app/ForgotPasswordScreen';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import RegisterGymScreen from './app/RegisterGymScreen';
import UploadVideoScreen from './app/UploadVideoScreen';
import VideoPlayerScreen from './app/VideoPlayerScreen';
import AllVideosScreen from './app/AllVideosScreen';
import AllPopularGymsScreen from './app/AllPopularGymsScreen';
import AllNearbyGymsScreen from './app/AllNearbyGymsScreen';
import NotificationsScreen from './app/NotificationsScreen';
import SavedGymsScreen from './app/SavedGymsScreen';

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
    existingReview?: any;
  };
  FollowList: { userId: string; tab: 'followers' | 'following' };
  UserProfile: { userId: string };
  Settings: undefined;
  AllReviews: { reviews: any[]; currentUserId: string; gymName: string };
  RegisterGym: undefined;
  UploadVideo: { gymId: string; gymName: string };
  VideoPlayer: { videoId: string; videos: any[] };
  AllVideos: { gymId: string; gymName: string };
  AllPopularGyms: undefined;
  AllNearbyGyms: undefined;
  Notifications: undefined;
  SavedGyms: undefined;
  ForgotPassword: undefined;
  LogClimb: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ITEMS = [
  { name: 'Home',    icon: 'home'        as const, size: 24 },
  { name: 'Explore', icon: 'search'      as const, size: 24 },
  { name: 'People',  icon: 'people'      as const, size: 24 },
  { name: 'Log',     icon: 'journal-outline' as const, size: 24 },
  { name: 'Profile', icon: 'person'      as const, size: 24 },
];

function MainTabs({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const pagerRef = useRef<PagerView>(null);

  const goToTab = (index: number) => {
    setActiveTab(index);
    setVisited(prev => new Set([...prev, index]));
    pagerRef.current?.setPage(index);
  };

  const onPageSelected = (e: { nativeEvent: { position: number } }) => {
    const index = e.nativeEvent.position;
    setActiveTab(index);
    setVisited(prev => new Set([...prev, index]));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={onPageSelected}
      >
        <View key="0" style={{ flex: 1 }}>
          {visited.has(0) && <HomeScreen />}
        </View>
        <View key="1" style={{ flex: 1 }}>
          {visited.has(1) && <ExploreScreen />}
        </View>
        <View key="2" style={{ flex: 1 }}>
          {visited.has(2) && <PeopleScreen />}
        </View>
        <View key="3" style={{ flex: 1 }}>
          {visited.has(3) && <LogScreen />}
        </View>
        <View key="4" style={{ flex: 1 }}>
          {visited.has(4) && <ProfileScreen onLogout={onLogout} />}
        </View>
      </PagerView>

      {/* Custom bottom tab bar */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
        paddingBottom: 12,
        height: 70,
      }}>
        {TAB_ITEMS.map((tab, index) => {
          const active = activeTab === index;
          return (
            <TouchableOpacity
              key={tab.name}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => goToTab(index)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={tab.size}
                color={active ? '#FF8C00' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
                color: active ? '#FF8C00' : '#9CA3AF',
              }}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
        registerPushToken();
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
    const user = await authService.getStoredUser();
    if (user) {
      const profileComplete = await authService.checkProfileComplete(user.id);
      console.log('After login - Profile complete:', profileComplete);
      setHasCompletedProfile(profileComplete);
    }
    setIsAuthenticated(true);
    registerPushToken();
  };

  const handlePersonalizeComplete = async () => {
    setHasCompletedProfile(true);
  };

  const registerPushToken = async () => {
    // Push notifications are not supported in Expo Go — skip silently
    if (Constants.executionEnvironment === 'storeClient') return;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      const authToken = await SecureStore.getItemAsync('authToken');
      if (!token || !authToken) return;
      await fetch('http://192.168.1.166:3000/users/me/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ token }),
      });
    } catch (err) {
      console.error('Push token registration error:', err);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setHasCompletedProfile(false);
    setCurrentScreen('landing');
  };

  const authContextValue = useMemo(() => ({ onLogout: handleLogout }), []);

  if (isLoading) {
    return null;
  }

  console.log('📱 Navigation State:', {
    isAuthenticated,
    hasCompletedProfile,
  });

  return (
    <AuthContext.Provider value={authContextValue}>
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
                <>
                  <Stack.Screen name="Login">
                    {() => (
                      <LoginScreen
                        onBack={() => setCurrentScreen('landing')}
                        onLoginSuccess={handleLoginSuccess}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
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
              <Stack.Screen 
                name="FollowList" 
                component={FollowListScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="UserProfile" 
                component={UserProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="AllReviews" 
                component={AllReviewsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="RegisterGym" 
                component={RegisterGymScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="UploadVideo" 
                component={UploadVideoScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="VideoPlayer" 
                component={VideoPlayerScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="AllVideos" 
                component={AllVideosScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="AllPopularGyms" 
                component={AllPopularGymsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="AllNearbyGyms" 
                component={AllNearbyGymsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Notifications" 
                component={NotificationsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SavedGyms"
                component={SavedGymsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="LogClimb"
                component={LogClimbScreen}
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
    </AuthContext.Provider>
  );
}