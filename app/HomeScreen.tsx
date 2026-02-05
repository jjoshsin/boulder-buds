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

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [popularGyms, setPopularGyms] = useState<Gym[]>([]);
  const [nearbyGyms, setNearbyGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

const fetchHomeData = async () => {
  try {
    setIsLoading(true);
    
    const [popular, nearby] = await Promise.all([
      gymService.getPopularGyms(),
      gymService.getNearbyGyms(),
    ]);

    console.log('🏋️ Popular Gyms Response:', JSON.stringify(popular, null, 2));
    console.log('📸 First gym photos:', popular[0]?.officialPhotos);

    setPopularGyms(popular);
    setNearbyGyms(nearby);
    
  } catch (error) {
    console.error('Error fetching home data:', error);
    Alert.alert('Error', 'Failed to load gyms. Please try again.');
  } finally {
    setIsLoading(false);
  }
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
      {gym.tags && gym.tags.length > 0 && (
        <Text style={styles.tag} numberOfLines={1}>
          {gym.tags[0]}
        </Text>
      )}
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
          <Text style={styles.tags}>{gym.tags?.join(' • ')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              <Text style={styles.activityUser}>alex_climbs</Text> checked in at{' '}
              <Text style={styles.activityGym}>Brooklyn Boulders</Text>
            </Text>
            <Text style={styles.activityRating}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.activityReview}>"Sick new problems this week!"</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>

          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              <Text style={styles.activityUser}>sarah_sends</Text> reviewed{' '}
              <Text style={styles.activityGym}>Vital Climbing</Text>
            </Text>
            <Text style={styles.activityRating}>⭐⭐⭐⭐</Text>
            <Text style={styles.activityReview}>"Great for beginners!"</Text>
            <Text style={styles.activityTime}>5 hours ago</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}