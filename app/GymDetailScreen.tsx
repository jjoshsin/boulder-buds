import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
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
import OptionsPopover from './components/OptionsPopover';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import UserAvatar from './components/UserAvatar';


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
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingDayPass, setPricingDayPass] = useState('');
  const [pricingMonthly, setPricingMonthly] = useState('');
  const [pricingStudentDiscount, setPricingStudentDiscount] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showReviewOptions, setShowReviewOptions] = useState(false);
  const [reviewOptionsAnchor, setReviewOptionsAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState(false);
  const [showDeleteGymConfirm, setShowDeleteGymConfirm] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [isDeletingGym, setIsDeletingGym] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchGymDetails();
    }, [gymId])
  );

  useEffect(() => {
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
      // Pre-fill pricing edit state
      setPricingDayPass(gymData.dayPassPrice != null ? String(gymData.dayPassPrice) : '');
      setPricingMonthly(gymData.monthlyMembershipPrice != null ? String(gymData.monthlyMembershipPrice) : '');
      setPricingStudentDiscount(gymData.studentDiscountAvailable ?? false);
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

  const confirmDeleteReview = async () => {
    if (!selectedReview) return;
    setIsDeletingReview(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`http://192.168.1.166:3000/reviews/${selectedReview.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete review');
      setShowDeleteReviewConfirm(false);
      setSelectedReview(null);
      fetchGymDetails();
    } catch (error) {
      console.error('Delete review error:', error);
      Alert.alert('Error', 'Failed to delete review');
    } finally {
      setIsDeletingReview(false);
    }
  };

  const confirmDeleteGym = async () => {
    setIsDeletingGym(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`http://192.168.1.166:3000/gyms/${gymId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete gym');
      }
      setShowDeleteGymConfirm(false);
      navigation.navigate('MainTabs');
    } catch (error: any) {
      console.error('Delete gym error:', error);
      Alert.alert('Error', error.message || 'Failed to delete gym');
    } finally {
      setIsDeletingGym(false);
    }
  };

  const handleSavePricing = async () => {
    try {
      setIsSavingPricing(true);
      await gymService.updatePricing(gymId, {
        dayPassPrice: pricingDayPass ? parseFloat(pricingDayPass) : null,
        monthlyMembershipPrice: pricingMonthly ? parseFloat(pricingMonthly) : null,
        studentDiscountAvailable: pricingStudentDiscount,
        studentDiscountDetails: null,
      });
      setShowPricingModal(false);
      fetchGymDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to save pricing');
    } finally {
      setIsSavingPricing(false);
    }
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

  const getPriceRangeText = (dayPassPrice?: number | null): string | null => {
    if (dayPassPrice == null) return null;
    if (dayPassPrice <= 20) return '$';
    if (dayPassPrice <= 30) return '$$';
    return '$$$';
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

  const isOwner = !!currentUserId && gym.registeredByUser?.id === currentUserId;

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
            {getPriceRangeText(gym.dayPassPrice) && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.priceRange}>{getPriceRangeText(gym.dayPassPrice)}</Text>
              </>
            )}
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
            onPress={() => setShowDeleteGymConfirm(true)}
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

        {/* Pricing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            {!!currentUserId && (
              <TouchableOpacity onPress={() => setShowPricingModal(true)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {gym.dayPassPrice != null || gym.monthlyMembershipPrice != null || gym.studentDiscountAvailable ? (
            <View style={styles.pricingGrid}>
              {gym.dayPassPrice != null && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Day Pass</Text>
                  <Text style={styles.pricingValue}>${gym.dayPassPrice.toFixed(2)}</Text>
                </View>
              )}
              {gym.monthlyMembershipPrice != null && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Monthly</Text>
                  <Text style={styles.pricingValue}>${gym.monthlyMembershipPrice.toFixed(2)}/mo</Text>
                </View>
              )}
              {gym.studentDiscountAvailable && (
                <View style={styles.pricingDiscountBadge}>
                  <MaterialCommunityIcons name="school-outline" size={16} color="#10B981" />
                  <Text style={styles.pricingDiscountText}>
                    Student Discount
                    {gym.studentDiscountDetails ? ` — ${gym.studentDiscountDetails}` : ''}
                  </Text>
                </View>
              )}
            </View>
          ) : !!currentUserId ? (
            <TouchableOpacity style={styles.addAmenitiesButton} onPress={() => setShowPricingModal(true)}>
              <Text style={styles.addAmenitiesText}>+ Add Pricing Info</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Amenities */}
        {gym.amenities && gym.amenities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              {!!currentUserId && (
                <TouchableOpacity onPress={() => setShowAmenitiesModal(true)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              )}
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
            {!!currentUserId && (
              <TouchableOpacity
                style={styles.addAmenitiesButton}
                onPress={() => setShowAmenitiesModal(true)}
              >
                <Text style={styles.addAmenitiesText}>+ Add Amenities</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews ({gym.reviewCount})</Text>
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
                      <UserAvatar
                        displayName={review.user.displayName}
                        profilePhoto={review.user.profilePhoto}
                        size={36}
                      />
                      <View>
                        <Text style={styles.reviewUserName}>{review.user.displayName}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    {isOwnReview && (
                      <TouchableOpacity
                        style={styles.reviewOptionsButton}
                        onPress={(e) => {
                          const { pageX, pageY } = e.nativeEvent;
                          setSelectedReview(review);
                          setReviewOptionsAnchor({ x: pageX, y: pageY });
                          setShowReviewOptions(true);
                        }}
                      >
                        <Text style={styles.reviewOptionsText}>⋯</Text>
                      </TouchableOpacity>
                    )}
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

                  {/* Star Rating */}
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <FontAwesome
                        key={i}
                        name={i < Math.round(review.overallRating ?? 0) ? 'star' : 'star-o'}
                        size={15}
                        color="#FF8C00"
                        style={{ marginRight: 3 }}
                      />
                    ))}
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

      {/* Pricing Edit Modal */}
      <Modal visible={showPricingModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <TouchableOpacity onPress={() => setShowPricingModal(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { flex: 1, textAlign: 'center' }]}>Edit Pricing</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pricingLabel}>Day Pass ($)</Text>
                <TextInput
                  style={styles.pricingInput}
                  placeholder="e.g. 25"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={pricingDayPass}
                  onChangeText={setPricingDayPass}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pricingLabel}>Monthly ($)</Text>
                <TextInput
                  style={styles.pricingInput}
                  placeholder="e.g. 70"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={pricingMonthly}
                  onChangeText={setPricingMonthly}
                />
              </View>
            </View>

            <Text style={[styles.pricingLabel, { marginBottom: 10 }]}>Student Discount</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                  borderWidth: 2,
                  borderColor: pricingStudentDiscount ? '#FF8C00' : '#E5E7EB',
                  backgroundColor: pricingStudentDiscount ? '#FFF7ED' : '#F9FAFB',
                }}
                onPress={() => setPricingStudentDiscount(true)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: pricingStudentDiscount ? '#FF8C00' : '#6B7280' }}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                  borderWidth: 2,
                  borderColor: !pricingStudentDiscount ? '#FF8C00' : '#E5E7EB',
                  backgroundColor: !pricingStudentDiscount ? '#FFF7ED' : '#F9FAFB',
                }}
                onPress={() => setPricingStudentDiscount(false)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: !pricingStudentDiscount ? '#FF8C00' : '#6B7280' }}>No</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButtonFull, { marginHorizontal: 0, marginTop: 8 }]}
              onPress={handleSavePricing}
              disabled={isSavingPricing}
            >
              {isSavingPricing
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.primaryButtonText}>Save Pricing</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
            fetchGymDetails();
          }}
        />
      </Modal>

      {/* Review options popover */}
      <OptionsPopover
        visible={showReviewOptions}
        anchor={reviewOptionsAnchor}
        onClose={() => setShowReviewOptions(false)}
        options={[
          {
            label: 'Edit Review',
            onPress: () => {
              if (!selectedReview) return;
              navigation.navigate('WriteReview', {
                gymId: gym.id,
                gymName: gym.name,
                reviewId: selectedReview.id,
                existingReview: selectedReview,
              } as any);
            },
          },
          {
            label: 'Delete Review',
            destructive: true,
            onPress: () => setShowDeleteReviewConfirm(true),
          },
        ]}
      />

      {/* Delete review confirmation */}
      <ConfirmDeleteModal
        visible={showDeleteReviewConfirm}
        title="Delete Review"
        message="Are you sure you want to delete this review? This cannot be undone."
        loading={isDeletingReview}
        onConfirm={confirmDeleteReview}
        onCancel={() => {
          setShowDeleteReviewConfirm(false);
          setSelectedReview(null);
        }}
      />

      {/* Delete gym confirmation */}
      <ConfirmDeleteModal
        visible={showDeleteGymConfirm}
        title="Delete Gym"
        message="This will permanently remove all reviews, photos, and videos associated with this gym."
        confirmText="Delete Gym"
        loading={isDeletingGym}
        onConfirm={confirmDeleteGym}
        onCancel={() => setShowDeleteGymConfirm(false)}
      />
    </SafeAreaView>
  );
}