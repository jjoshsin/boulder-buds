import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/AllGymsScreen.styles';
import gymService, { Gym } from '../services/gymService';
import * as Location from 'expo-location';

type AllNearbyGymsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AllNearbyGymsScreen() {
  const navigation = useNavigation<AllNearbyGymsNavigationProp>();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadNearbyGyms();
  }, []);


 
  
  
const loadNearbyGyms = async () => {
  try {
    setIsLoading(true);

    // Get user's location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      const defaultGyms = await gymService.getAllGyms();
      setGyms(defaultGyms);
      setIsLoading(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    console.log('User location:', location.coords.latitude, location.coords.longitude);
    
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    // Get gyms within 15 miles
    const nearbyGyms = await gymService.getGymsNearLocation(
      location.coords.latitude,
      location.coords.longitude,
      15
    );

    console.log('Nearby gyms found:', nearbyGyms.length);
    setGyms(nearbyGyms);
  } catch (error) {
    console.error('Error loading nearby gyms:', error);
    // Show more detail
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    setIsLoading(false);
  }
};

  const renderGymCard = (gym: Gym) => (
    <TouchableOpacity
      key={gym.id}
      style={styles.gymCard}
      onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
    >
      {gym.officialPhotos && gym.officialPhotos.length > 0 ? (
        <Image
          source={{ uri: gym.officialPhotos[0] }}
          style={styles.gymImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>🏔️</Text>
        </View>
      )}

      <View style={styles.gymInfo}>
        <Text style={styles.gymName}>{gym.name}</Text>
        
        <View style={styles.gymMeta}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <FontAwesome name="star" size={12} color="#FF8C00" />
            <Text style={styles.gymRating}>
              {gym.rating ? gym.rating.toFixed(1) : 'New'}
            </Text>
          </View>
          <Text style={styles.gymSeparator}>•</Text>
          <Text style={styles.gymReviews}>
            {gym.reviewCount || 0} {gym.reviewCount === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        <Text style={styles.gymLocation}>
          {gym.city}{gym.state ? `, ${gym.state}` : ''}
        </Text>

        {gym.distance !== undefined && (
          <Text style={styles.gymDistance}>📍 {gym.distance} miles away</Text>
        )}

        {gym.amenities && gym.amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {gym.amenities.slice(0, 2).map((amenity, index) => (
              <View key={index} style={styles.amenityBadge}>
                <Text style={styles.amenityBadgeText}>
                  {amenity.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
            {gym.amenities.length > 2 && (
              <Text style={styles.moreAmenities}>+{gym.amenities.length - 2}</Text>
            )}
          </View>
        )}
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Gyms</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {gyms.length > 0 ? (
          <>
            <Text style={styles.resultsCount}>
              {gyms.length} {gyms.length === 1 ? 'gym' : 'gyms'} within 15 miles
            </Text>
            {gyms.map(renderGymCard)}
            <View style={styles.bottomPadding} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🏔️</Text>
            <Text style={styles.emptyStateText}>No gyms nearby</Text>
            <Text style={styles.emptyStateSubtext}>
              There are no gyms within 15 miles of your location
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}