import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/HomeScreen.styles';
import gymService, { Gym } from '../services/gymService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import * as SecureStore from 'expo-secure-store';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Activity {
  type: 'review' | 'photo';
  id: string;
  user: string;
  gym: string;
  gymId: string;
  rating?: number;
  text?: string;
  photos?: string[];
  photoUrl?: string;
  createdAt: string;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [popularGyms, setPopularGyms] = useState<Gym[]>([]);
  const [nearbyGyms, setNearbyGyms] = useState<Gym[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

const fetchHomeData = async () => {
  try {
    setIsLoading(true);
    const token = await SecureStore.getItemAsync('authToken');

    // Get user's climbing preference
    const userStr = await SecureStore.getItemAsync('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const climbingType = user?.climbingType || null;

    const [popular, nearby, activityRes] = await Promise.all([
      gymService.getPopularGyms(climbingType),
      gymService.getNearbyGyms(climbingType),
      fetch(`http://192.168.1.166:3000/follows/feed/activity?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
    ]);

    setPopularGyms(popular);
    setNearbyGyms(nearby);

    if (activityRes.ok) {
      const activityData = await activityRes.json();
      setRecentActivity(activityData);
    }
  } catch (error) {
    console.error('Error fetching home data:', error);
    Alert.alert('Error', 'Failed to load gyms. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

const renderPopularGym = (gym: Gym) => (
  <TouchableOpacity 
    key={gym.id} 
    style={styles.popularCard} 
    activeOpacity={0.8}
    onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
  >    
    <View style={styles.popularImage}>
      {gym.officialPhotos && gym.officialPhotos.length > 0 ? (
        <Image 
          source={{ uri: gym.officialPhotos[0] }} 
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🏔️</Text>
          <Text style={styles.placeholderSubtext}>No photos yet</Text>
        </View>
      )}
    </View>
    <View style={styles.popularInfo}>
      <Text style={styles.popularName} numberOfLines={1}>
        {gym.name}
      </Text>
      <View style={styles.ratingRow}>
        {gym.rating && gym.rating > 0 ? (
          <>
            <Text style={styles.rating}>⭐ {gym.rating}</Text>
            <Text style={styles.reviewCount}>({gym.reviewCount})</Text>
          </>
        ) : (
          <Text style={styles.reviewCount}>No reviews yet</Text>
        )}
      </View>
      <Text style={styles.tag} numberOfLines={1}>
        {gym.city}{gym.state ? `, ${gym.state}` : ''}
      </Text>
    </View>
  </TouchableOpacity>
);

const renderNearbyGym = (gym: Gym) => (
  <TouchableOpacity 
    key={gym.id} 
    style={styles.nearbyCard} 
    activeOpacity={0.8}
    onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
  >
    <View style={styles.nearbyContent}>
      <View style={styles.nearbyHeader}>
        <Text style={styles.nearbyName} numberOfLines={1}>
          {gym.name}
        </Text>
        <Text style={styles.distance}>{gym.distance}</Text>
      </View>
      <View style={styles.nearbyMeta}>
        <Text style={styles.rating}>⭐ {gym.rating}</Text>
        <Text style={styles.metaSeparator}>•</Text>
        <Text style={styles.tags}>
          {gym.city}{gym.state ? `, ${gym.state}` : ''}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const renderActivity = (activity: Activity, index: number) => {
  if (activity.type === 'review') {
    return (
      <TouchableOpacity 
        key={index} 
        style={styles.activityCard}
        onPress={() => navigation.navigate('GymDetail', { gymId: activity.gymId })}
      >
        <Text style={styles.activityText}>
          <Text style={styles.activityUser}>{activity.user}</Text> reviewed{' '}
          <Text style={styles.activityGym}>{activity.gym}</Text>
        </Text>
        {activity.rating && (
          <Text style={styles.activityRating}>
            {'⭐'.repeat(Math.round(activity.rating))}
          </Text>
        )}
        {activity.text && (
          <Text style={styles.activityReview} numberOfLines={2}>
            "{activity.text}"
          </Text>
        )}
        
        {/* Show first photo if review has photos */}
        {activity.photos && activity.photos.length > 0 && (
          <Image 
            source={{ uri: activity.photos[0] }} 
            style={styles.activityPhoto}
            resizeMode="cover"
          />
        )}
        
        <Text style={styles.activityTime}>{getTimeAgo(activity.createdAt)}</Text>
      </TouchableOpacity>
    );
  } else {
    // Keep photo activity as-is
    return (
      <TouchableOpacity 
        key={index} 
        style={styles.activityCard}
        onPress={() => navigation.navigate('GymDetail', { gymId: activity.gymId })}
      >
        <Text style={styles.activityText}>
          <Text style={styles.activityUser}>{activity.user}</Text> added a photo to{' '}
          <Text style={styles.activityGym}>{activity.gym}</Text>
        </Text>
        {activity.photoUrl && !activity.photoUrl.toLowerCase().endsWith('.heic') && (
          <Image 
            source={{ uri: activity.photoUrl }} 
            style={styles.activityPhoto}
            resizeMode="cover"
          />
        )}
        {activity.photoUrl && activity.photoUrl.toLowerCase().endsWith('.heic') && (
          <View style={[styles.activityPhoto, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 32 }}>📸</Text>
          </View>
        )}
        <Text style={styles.activityTime}>{getTimeAgo(activity.createdAt)}</Text>
      </TouchableOpacity>
    );
  }
};

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Boulder Buds</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Popular This Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Popular This Week</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {popularGyms.map(renderPopularGym)}
          </ScrollView>
        </View>

        {/* Near You */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Near You</Text>
          {nearbyGyms.map(renderNearbyGym)}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Recent Activity</Text>
          {recentActivity.length > 0 ? (
            recentActivity.map(renderActivity)
          ) : (
            <View style={styles.emptyActivityContainer}>
              <Text style={styles.emptyActivityEmoji}>👥</Text>
              <Text style={styles.emptyActivityText}>No recent activity</Text>
              <Text style={styles.emptyActivitySubtext}>
                Follow other climbers to see their activity here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}