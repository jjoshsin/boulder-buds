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
import * as SecureStore from 'expo-secure-store';

type AllPopularNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AllPopularGymsScreen() {
  const navigation = useNavigation<AllPopularNavigationProp>();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    try {
      setIsLoading(true);
      const userStr = await SecureStore.getItemAsync('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const climbingType = user?.climbingType || null;
      
      const popularGyms = await gymService.getPopularGyms(climbingType);
      setGyms(popularGyms);
    } catch (error) {
      console.error('Error loading gyms:', error);
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
        <Text style={styles.headerTitle}>Popular This Week</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {gyms.length > 0 ? (
          <>
            <Text style={styles.resultsCount}>
              {gyms.length} {gyms.length === 1 ? 'gym' : 'gyms'}
            </Text>
            {gyms.map(renderGymCard)}
            <View style={styles.bottomPadding} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🏔️</Text>
            <Text style={styles.emptyStateText}>No popular gyms found</Text>
            <Text style={styles.emptyStateSubtext}>
              Check back later for trending gyms
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}