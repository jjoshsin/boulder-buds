import React, { useState, useEffect } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/SavedGymsScreen.styles';
import favoritesService, { SavedGym } from '../services/favoritesService';

type SavedGymsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SavedGymsScreen() {
  const navigation = useNavigation<SavedGymsNavigationProp>();
  const [savedGyms, setSavedGyms] = useState<SavedGym[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadSavedGyms();
    }, [])
  );

  const loadSavedGyms = async () => {
    try {
      setIsLoading(true);
      const data = await favoritesService.getSavedGyms();
      setSavedGyms(data);
    } catch (error) {
      console.error('Error loading saved gyms:', error);
      Alert.alert('Error', 'Failed to load saved gyms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (gymId: string) => {
    Alert.alert(
      'Remove from saved',
      'Are you sure you want to remove this gym from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoritesService.unsaveGym(gymId);
              loadSavedGyms();
            } catch (error) {
              console.error('Error removing saved gym:', error);
              Alert.alert('Error', 'Failed to remove gym');
            }
          },
        },
      ]
    );
  };

  const renderGymCard = (savedGym: SavedGym) => (
    <TouchableOpacity
      key={savedGym.id}
      style={styles.gymCard}
      onPress={() => navigation.navigate('GymDetail', { gymId: savedGym.gym.id })}
    >
      {savedGym.gym.officialPhotos && savedGym.gym.officialPhotos.length > 0 ? (
        <Image
          source={{ uri: savedGym.gym.officialPhotos[0] }}
          style={styles.gymImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>🏔️</Text>
        </View>
      )}

      <View style={styles.gymInfo}>
        <View style={styles.gymHeader}>
          <Text style={styles.gymName} numberOfLines={1}>
            {savedGym.gym.name}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleUnsave(savedGym.gym.id);
            }}
          >
            <Text style={styles.removeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gymMeta}>
          <Text style={styles.gymRating}>
            ⭐ {savedGym.gym.rating ? savedGym.gym.rating.toFixed(1) : 'New'}
          </Text>
          <Text style={styles.gymSeparator}>•</Text>
          <Text style={styles.gymReviews}>
            {savedGym.gym.reviewCount || 0} {savedGym.gym.reviewCount === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        <Text style={styles.gymLocation}>
          {savedGym.gym.city}{savedGym.gym.state ? `, ${savedGym.gym.state}` : ''}
        </Text>

        {savedGym.gym.amenities && savedGym.gym.amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {savedGym.gym.amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityBadge}>
                <Text style={styles.amenityBadgeText}>
                  {amenity.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
            {savedGym.gym.amenities.length > 3 && (
              <Text style={styles.moreAmenities}>+{savedGym.gym.amenities.length - 3}</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Gyms</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {savedGyms.length > 0 ? (
          <>
            <Text style={styles.resultsCount}>
              {savedGyms.length} {savedGyms.length === 1 ? 'gym' : 'gyms'}
            </Text>
            {savedGyms.map(renderGymCard)}
            <View style={styles.bottomPadding} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🏔️</Text>
            <Text style={styles.emptyStateText}>No saved gyms yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start saving your favorite gyms to see them here
            </Text>
<TouchableOpacity
  style={styles.exploreButton}
  onPress={() => navigation.navigate('MainTabs')}
>
  <Text style={styles.exploreButtonText}>Explore Gyms</Text>
</TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}