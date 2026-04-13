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
import { RootStackParamList } from '../App';
import { styles } from '../styles/GymDetailScreen.styles';
import EditAmenitiesScreen from './EditAmenitiesScreen';
import gymService, { Gym } from '../services/gymService';
import { getSettingLabel, getDifficultyLabel } from './utils/reviewLabels';
import * as SecureStore from 'expo-secure-store';
import PhotoGrid from './components/PhotoGrid';
import videoService, { Video as VideoType } from '../services/videoService';
import favoritesService from '../services/favoritesService';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';


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
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchGymDetails();
    loadCurrentUser();
    checkIfSaved();
  }, [gymId]);

  const fetchGymDetails = async () => {
    try {
      setIsLoading(true);
      const [gymData, gymVideos] = await Promise.all([
        gymService.getGymById(gymId),
        videoService.getGymVideos(gymId, 'mostRecent', 3),
      ]);
      setGym(gymData);
      setVideos(gymVideos);
    } catch (error) {
      console.error('Error fetching gym details:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const checkIfSaved = async () => {
    try {
      const saved = await favoritesService.isSaved(gymId);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        await favoritesService.unsaveGym(gymId);
        setIsSaved(false);
      } else {
        await favoritesService.saveGym(gymId);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      Alert.alert('Error', 'Failed to update saved status');
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
              fetchGymDetails();
            } catch (error) {
              console.error('Delete review error:', error);
              Alert.alert('Error', 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGym = async () => {
    Alert.alert(
      'Delete Gym',
      'Are you sure you want to delete this gym? This will permanently remove all reviews, photos, and videos associated with it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('authToken');
              const response = await fetch(`http://192.168.1.166:3000/gyms/${gymId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete gym');
              }

              Alert.alert('Deleted', 'Gym deleted successfully', [
                { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
              ]);
            } catch (error: any) {
              console.error('Delete gym error:', error);
              Alert.alert('Error', error.message || 'Failed to delete gym');
            }
          },
        },
      ]
    );
  };

  const renderAmenityIcon = (amenity: string) => {
    const amenityIcons: { [key: string]: { lib: 'mci' | 'ionicons'; name: string } } = {
      moon_board:    { lib: 'mci',     name: 'moon-waning-crescent' },
      kilter_board:  { lib: 'mci',     name: 'grid-large' },
      training_area: { lib: 'mci',     name: 'dumbbell' },
      spray_wall:    { lib: 'mci',     name: 'spray' },
      cafe:          { lib: 'mci',     name: 'coffee' },
      showers:       { lib: 'mci',     name: 'shower' },
      parking:       { lib: 'mci',     name: 'parking' },
      yoga:          { lib: 'mci',     name: 'yoga' },
      weights:       { lib: 'mci',     name: 'weight-lifter' },
      lockers:       { lib: 'mci',     name: 'locker' },
    };
    const icon = amenityIcons[amenity];
    if (icon) {
      return <MaterialCommunityIcons name={icon.name as any} size={20} color="#FF8C00" />;
    }
    return <MaterialCommunityIcons name="star-outline" size={20} color="#FF8C00" />;
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
{/* Header with Back Button and Bookmark */}
<View style={styles.header}>
  <TouchableOpacity 
    style={styles.backButton}
    onPress={() => navigation.goBack()}
  >
    <Ionicons name="arrow-back" size={22} color="#1F2937" />
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.bookmarkButton}
    onPress={handleToggleSave}
  >
    <FontAwesome 
      name={isSaved ? "bookmark" : "bookmark-o"} 
      size={22} 
      color="#1F2937" 
    />
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
          
          <View style={styles.ratingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="star" size={14} color="#FF8C00" />
              <Text style={[styles.rating, { marginLeft: 4 }]}>
                {gym.rating ? gym.rating.toFixed(1) : 'New'}
              </Text>
            </View>
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

        {/* Registered By */}
        {gym.registeredByUser && (
          <View style={styles.registeredByContainer}>
            <Text style={styles.registeredByText}>
              Registered by{' '}
              <Text 
                style={styles.registeredByName}
                onPress={() => {
                  if (gym.registeredByUser) {
                    if (gym.registeredByUser.id === currentUserId) {
                      navigation.navigate('MainTabs');
                    } else {
                      navigation.navigate('UserProfile', { userId: gym.registeredByUser.id });
                    }
                  }
                }}
              >
                {gym.registeredByUser.displayName}
              </Text>
            </Text>
          </View>
        )}

        {/* Temporary Delete Button - Only show if current user registered the gym */}
        {gym.registeredByUser && gym.registeredByUser.id === currentUserId && (
          <TouchableOpacity
            style={styles.deleteGymButton}
            onPress={handleDeleteGym}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[styles.deleteGymButtonText, { marginLeft: 6 }]}>Delete This Gym</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Climbing Types */}
        {gym.climbingTypes && gym.climbingTypes.length > 0 && (
          <View style={styles.climbingTypes}>
            {gym.climbingTypes.map((type, index) => {
              let displayText = '';
              if (type === 'bouldering') {
                displayText = 'Bouldering';
              } else if (type === 'rope') {
                displayText = 'Rope Climbing';
              } else {
                displayText = `${type}`;
              }
              
              return (
                <View key={index} style={styles.typeChip}>
                  <Text style={styles.typeChipText}>{displayText}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.primaryButtonFull}
          onPress={() => navigation.navigate('WriteReview', { 
            gymId: gym.id, 
            gymName: gym.name 
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.primaryButtonText, { marginLeft: 6 }]}>Write Review</Text>
          </View>
        </TouchableOpacity>

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
                    <View style={styles.amenityIcon}>{renderAmenityIcon(amenity)}</View>
                    <Text style={styles.amenityText}>{formattedAmenity}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

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

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="star" size={14} color="#FF8C00" />
              <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Reviews ({gym.reviewCount})</Text>
            </View>
            {gym.reviews && gym.reviews.length > 3 && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('AllReviews', {
                  reviews: gym.reviews || [],
                  currentUserId: currentUserId || '',
                  gymName: gym.name,
                })}
              >
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {gym.reviews && gym.reviews.length > 0 ? (
            gym.reviews.slice(0, 3).map((review: any) => {
              if (!review || !review.user || !review.user.displayName) return null;
              const isOwnReview = currentUserId === review.userId;

              return (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUserInfo}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FontAwesome name="star" size={12} color="#FF8C00" />
                        <Text style={[styles.reviewRating, { marginLeft: 3 }]}>
                          {review.overallRating ? review.overallRating.toFixed(1) : 'N/A'}
                        </Text>
                      </View>
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

                  {/* Setting & Difficulty Tags */}
                  <View style={styles.reviewTagsRow}>
                    <View style={styles.reviewTag}>
                      <Text style={styles.reviewTagText}>{getSettingLabel(review.setting)}</Text>
                    </View>
                    <View style={styles.reviewTag}>
                      <Text style={styles.reviewTagText}>{getDifficultyLabel(review.difficulty)}</Text>
                    </View>
                  </View>

                  {review.reviewText && (
                    <Text style={styles.reviewText} numberOfLines={3}>
                      {review.reviewText}
                    </Text>
                  )}

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
            <View style={styles.emptyReviews}>
              <Ionicons name="create-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyReviewsText}>No reviews yet</Text>
              <Text style={styles.emptyReviewsSubtext}>Be the first to review!</Text>
            </View>
          )}
        </View>

        {/* Videos Section */}
        {videos && videos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="videocam-outline" size={18} color="#FF8C00" />
                <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Videos ({videos.length})</Text>
              </View>
              {videos.length >= 3 && (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('AllVideos', {
                    gymId: gym.id,
                    gymName: gym.name,
                  })}
                >
                  <Text style={styles.seeAllButton}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosScroll}>
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoThumbnail}
                  onPress={() => navigation.navigate('VideoPlayer', {
                    videoId: video.id,
                    videos: videos,
                  })}
                >
                  <Image
                    source={{ uri: video.thumbnailUrl }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  <View style={styles.videoOverlay}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <View style={styles.videoInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="eye-outline" size={12} color="#FFFFFF" />
                      <Text style={[styles.videoStats, { marginLeft: 3 }]}>{video.views}</Text>
                      <Text style={[styles.videoStats, { marginHorizontal: 4 }]}>•</Text>
                      <Ionicons name="heart-outline" size={12} color="#FFFFFF" />
                      <Text style={[styles.videoStats, { marginLeft: 3 }]}>{video.likeCount}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Upload Video Button */}
        <TouchableOpacity 
          style={styles.uploadVideoButton}
          onPress={() => navigation.navigate('UploadVideo', { 
            gymId: gym.id, 
            gymName: gym.name 
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="videocam-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.uploadVideoButtonText, { marginLeft: 6 }]}>Upload Video</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

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
            fetchGymDetails();
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}