import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Modal } from 'react-native';
import AddGymPhotoScreen from './AddGymPhotoScreen';
import { RootStackParamList } from '../App';
import { styles } from '../styles/GymDetailScreen.styles';
import EditAmenitiesScreen from './EditAmenitiesScreen';
import gymService, { Gym } from '../services/gymService';
import * as SecureStore from 'expo-secure-store';
import PhotoGrid from './components/PhotoGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type GymDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;


export default function GymDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<GymDetailScreenNavigationProp>();
  const { gymId } = route.params as { gymId: string };

  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);

  useEffect(() => {
    fetchGymDetails();
    loadCurrentUser();
  }, [gymId]);

  const loadCurrentUser = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchGymDetails = async () => {
  try {
    setIsLoading(true);
    const gymData = await gymService.getGymById(gymId);
    console.log('📸 Reviews with photos:', JSON.stringify(
      gymData.reviews?.map((r: any) => ({ id: r.id, photos: r.photos })),
      null, 2
    ));
    setGym(gymData);
  } catch (error) {
    console.error('Error fetching gym details:', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('authToken');
              const response = await fetch(`http://192.168.1.166:3000/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                throw new Error('Failed to delete review');
              }

              Alert.alert('Success', 'Review deleted');
              fetchGymDetails(); // Refresh the gym details
            } catch (error) {
              console.error('Delete review error:', error);
              Alert.alert('Error', 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  const renderAmenityIcon = (amenity: string) => {
    const amenityIcons: { [key: string]: string } = {
      moon_board: '🌙',
      kilter_board: '🧗',
      training_area: '💪',
      spray_wall: '🎨',
      cafe: '☕',
      showers: '🚿',
      parking: '🅿️',
      yoga: '🧘',
      weights: '🏋️',
      lockers: '🔒',
    };
    return amenityIcons[amenity] || '✨';
  };

  const getPriceRangeText = (priceRange: number) => {
    return '$'.repeat(priceRange);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Gym not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Gallery */}
        {gym.officialPhotos && gym.officialPhotos.length > 0 && (
          <View style={styles.photoGallery}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActivePhotoIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {gym.officialPhotos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            
            {/* Photo Pagination Dots */}
            {gym.officialPhotos.length > 1 && (
              <View style={styles.pagination}>
                {gym.officialPhotos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      activePhotoIndex === index && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Gym Info */}
        <View style={styles.infoSection}>
          <Text style={styles.gymName}>{gym.name}</Text>
          
          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>
              ⭐ {gym.rating ? gym.rating.toFixed(1) : 'New'}
            </Text>
            <Text style={styles.reviewCount}>
              ({gym.reviewCount || 0} {gym.reviewCount === 1 ? 'review' : 'reviews'})
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.priceRange}>{getPriceRangeText(gym.priceRange || 2)}</Text>
          </View>
        </View>
          {/* Address */}
<View style={styles.addressRow}>
  <View style={styles.addressInfo}>
    <Text style={styles.address}>{gym.address || 'Address not available'}</Text>
    <Text style={styles.borough}>{gym.city}, {gym.state}</Text>
  </View>
</View>

          {/* Climbing Types */}
          {gym.climbingTypes && gym.climbingTypes.length > 0 && (
            <View style={styles.climbingTypes}>
              {gym.climbingTypes.map((type, index) => {
                let displayText = '';
                if (type === 'bouldering') {
                  displayText = '🧗 Bouldering';
                } else if (type === 'rope') {
                  displayText = '🪢 Rope Climbing';
                } else {
                  displayText = `🧗 ${type}`;
                }
                
                return (
                  <View key={index} style={styles.typeChip}>
                    <Text style={styles.typeChipText}>
                      {displayText}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Action Buttons */}
<View style={styles.actionButtons}>
  <TouchableOpacity 
    style={styles.primaryButton}
    onPress={() => navigation.navigate('WriteReview', { 
      gymId: gym.id, 
      gymName: gym.name 
    })}
  >
    <Text style={styles.primaryButtonText}>✍️ Write Review</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={styles.secondaryButton}
    onPress={() => setShowPhotoUpload(true)}
  >
    <Text style={styles.secondaryButtonText}>📸 Add Photos</Text>
  </TouchableOpacity>
</View>

        {/* Amenities */}
{gym.amenities && gym.amenities.length > 0 && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Amenities</Text>
      <TouchableOpacity onPress={() => setShowAmenitiesModal(true)}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.amenitiesGrid}>
      {gym.amenities.map((amenity, index) => {
        if (!amenity || typeof amenity !== 'string') {
          console.warn('Invalid amenity:', amenity);
          return null;
        }
        
        const formattedAmenity = amenity
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        return (
          <View key={index} style={styles.amenityItem}>
            <Text style={styles.amenityIcon}>{renderAmenityIcon(amenity)}</Text>
            <Text style={styles.amenityText}>
              {formattedAmenity}
            </Text>
          </View>
        );
      })}
    </View>
  </View>
)}

{/* If no amenities, show add button */}
{(!gym.amenities || gym.amenities.length === 0) && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Amenities</Text>
    <TouchableOpacity 
      style={styles.addAmenitiesButton}
      onPress={() => setShowAmenitiesModal(true)}
    >
      <Text style={styles.addAmenitiesText}>+ Add Amenities</Text>
    </TouchableOpacity>
  </View>
)}

{/* Reviews */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Reviews</Text>
    {gym.reviewCount !== undefined && gym.reviewCount > 0 && (
      <Text style={styles.seeAllText}>
        {gym.reviewCount} {gym.reviewCount === 1 ? 'review' : 'reviews'}
      </Text>
    )}
  </View>

  {gym.reviews && gym.reviews.length > 0 ? (
    gym.reviews.map((review: any, index: number) => {
      if (!review || !review.user || !review.user.displayName) return null;
      const isOwnReview = currentUserId === review.userId;

      return (
        <View key={index} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewUserInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {review.user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.reviewUserName}>{review.user.displayName}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.reviewRatingContainer}>
              <Text style={styles.reviewRating}>
                ⭐ {review.overallRating ? review.overallRating.toFixed(1) : 'N/A'}
              </Text>
              {isOwnReview && (
                <TouchableOpacity
                  style={styles.reviewOptionsButton}
                  onPress={() => {
                    Alert.alert(
                      'Review Options',
                      'What would you like to do?',
                      [
                        {
                          text: 'Edit',
                          onPress: () => navigation.navigate('WriteReview', {
                            gymId: gym.id,
                            gymName: gym.name,
                            reviewId: review.id,
                            existingReview: review,
                          } as any),
                        },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => handleDeleteReview(review.id),
                        },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.reviewOptionsText}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Review Text */}
          {review.reviewText && typeof review.reviewText === 'string' && (
            <Text style={styles.reviewText} numberOfLines={3}>
              {review.reviewText}
            </Text>
          )}

          {/* Tags */}
          {review.tags && Array.isArray(review.tags) && review.tags.length > 0 && (
            <View style={styles.reviewTags}>
              {review.tags.slice(0, 2).map((tag: any, tagIndex: number) => {
                if (!tag || typeof tag !== 'string') return null;
                return (
                  <View key={tagIndex} style={styles.reviewTag}>
                    <Text style={styles.reviewTagText}>
                      {tag.replace(/_/g, ' ')}
                    </Text>
                  </View>
                );
              })}
              {review.tags.length > 2 && (
                <View style={styles.reviewTag}>
                  <Text style={styles.reviewTagText}>
                    +{review.tags.length - 2} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Photo Grid */}
          {review.photos && review.photos.length > 0 && (
  <PhotoGrid
    photos={review.photos}
    reviewId={review.id}
    initialLikeCount={review.likeCount || 0}
    initialLiked={review.likes?.some((l: any) => l.userId === currentUserId) || false}
    currentUserId={currentUserId || ''}
    containerWidth={SCREEN_WIDTH - 40 - 32}
  />
)}
        </View>
      );
    })
  ) : (
    <View style={styles.noReviewsContainer}>
      <Text style={styles.noReviewsEmoji}>✍️</Text>
      <Text style={styles.noReviewsText}>No reviews yet</Text>
      <Text style={styles.noReviewsSubtext}>Be the first to review this gym!</Text>
    </View>
  )}
</View>
        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
        <Modal
          visible={showPhotoUpload}
          animationType="slide"
          presentationStyle="pageSheet"
          >
        <AddGymPhotoScreen 
          onClose={() => {
            setShowPhotoUpload(false);
            fetchGymDetails();
            }}
          preselectedGym={{ id: gym.id, name: gym.name }}
        />
      </Modal>
      {/* Amenities Edit Modal */}
<Modal
  visible={showAmenitiesModal}
  animationType="slide"
  presentationStyle="pageSheet"
>
  <EditAmenitiesScreen
    gymId={gym.id}
    currentAmenities={gym.amenities || []}
    onClose={() => {
      setShowAmenitiesModal(false);
      fetchGymDetails(); // Refresh to show updated amenities
    }}
  />
</Modal>
    </SafeAreaView>
  );
}