import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/ProfileScreen.styles';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import SimplePhotoGrid from './components/SimplePhotoGrid';
import { getSettingLabel, getDifficultyLabel } from './utils/reviewLabels';
import videoService from '../services/videoService';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import favoritesService, { SavedGym } from '../services/favoritesService';


type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileScreenProps {
  onLogout: () => void;
}

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  profilePhoto?: string;
  climbingLevel?: string;
  climbingType?: string;
  city?: string;
  state?: string;
  age?: string;
}

interface UserReview {
  id: string;
  overallRating: number;
  reviewText?: string;
  createdAt: string;
  setting: string;
  difficulty: string;
  tags: string[];
  photos: string[];
  gym: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
}

interface UserVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption?: string;
  views: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  gym: {
    id: string;
    name: string;
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const navigation = useNavigation<ProfileNavigationProp>();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [activeTab, setActiveTab] = useState<'reviews' | 'videos' | 'saved'>('reviews');
  const [savedGyms, setSavedGyms] = useState<SavedGym[]>([]);


  useEffect(() => {
    loadProfileData();
  }, []);

const loadProfileData = async () => {
  try {
    setIsLoading(true);

    const userStr = await SecureStore.getItemAsync('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);

      const token = await SecureStore.getItemAsync('authToken');
      
      const [reviewsRes, statsRes, userRes, videosData, savedGymsData] = await Promise.all([
        fetch(`http://192.168.1.166:3000/users/${userData.id}/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://192.168.1.166:3000/users/${userData.id}/follow-stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://192.168.1.166:3000/users/${userData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        videoService.getUserVideos(userData.id),
        favoritesService.getSavedGyms(),
      ]);

      if (userRes.ok) {
        const freshUserData = await userRes.json();
        setUser(freshUserData);
        await SecureStore.setItemAsync('user', JSON.stringify(freshUserData));
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setFollowersCount(statsData.followersCount);
        setFollowingCount(statsData.followingCount);
      }

      setVideos(videosData);
      setSavedGyms(savedGymsData);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
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
            loadProfileData(); // Reload data
          } catch (error) {
            console.error('Error removing saved gym:', error);
            Alert.alert('Error', 'Failed to remove gym');
          }
        },
      },
    ]
  );
};

const renderSavedGym = (savedGym: SavedGym) => (
  <TouchableOpacity
    key={savedGym.id}
    style={styles.savedGymCard}
    onPress={() => navigation.navigate('GymDetail', { gymId: savedGym.gym.id })}
  >
    {savedGym.gym.officialPhotos && savedGym.gym.officialPhotos.length > 0 ? (
      <Image
        source={{ uri: savedGym.gym.officialPhotos[0] }}
        style={styles.savedGymImage}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.savedGymPlaceholder}>
        <Ionicons name="image-outline" size={28} color="#9CA3AF" />
      </View>
    )}

    <View style={styles.savedGymInfo}>
      <View style={styles.savedGymHeader}>
        <Text style={styles.savedGymName} numberOfLines={1}>
          {savedGym.gym.name}
        </Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleUnsave(savedGym.gym.id);
          }}
        >
          <Ionicons name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.savedGymMeta}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome name="star" size={12} color="#FF8C00" />
          <Text style={[styles.savedGymRating, { marginLeft: 3 }]}>
            {savedGym.gym.rating ? savedGym.gym.rating.toFixed(1) : 'New'}
          </Text>
        </View>
        <Text style={styles.savedGymSeparator}>•</Text>
        <Text style={styles.savedGymReviews}>
          {savedGym.gym.reviewCount || 0} {savedGym.gym.reviewCount === 1 ? 'review' : 'reviews'}
        </Text>
      </View>

      <Text style={styles.savedGymLocation}>
        {savedGym.gym.city}{savedGym.gym.state ? `, ${savedGym.gym.state}` : ''}
      </Text>
    </View>
  </TouchableOpacity>
);

  const handleUploadProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && user) {
        setIsUploadingPhoto(true);

        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const formData = new FormData();
        formData.append('photo', {
          uri,
          name: filename,
          type,
        } as any);

        const token = await SecureStore.getItemAsync('authToken');
        const response = await fetch(
          `http://192.168.1.166:3000/users/${user.id}/profile-photo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUser({ ...user, profilePhoto: data.profilePhoto });
          
          const updatedUser = { ...user, profilePhoto: data.profilePhoto };
          await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
          
          Alert.alert('Success', 'Profile photo updated!');
        } else {
          throw new Error('Failed to upload photo');
        }
      }
    } catch (error) {
      console.error('Upload photo error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
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
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (response.ok) {
                Alert.alert('Success', 'Review deleted');
                loadProfileData();
              } else {
                throw new Error('Failed to delete');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  const renderReview = (review: UserReview) => (
    <View key={review.id} style={styles.reviewCard}>
      <TouchableOpacity onPress={() => navigation.navigate('GymDetail', { gymId: review.gym.id })}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewGymInfo}>
            <Text style={styles.reviewGymName}>{review.gym.name}</Text>
            <Text style={styles.reviewGymBorough}>
              {review.gym.city}{review.gym.state ? `, ${review.gym.state}` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome name="star" size={12} color="#FF8C00" />
            <Text style={[styles.reviewRating, { marginLeft: 3 }]}>{review.overallRating.toFixed(1)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Setting & Difficulty Tags */}
      {review.setting && review.difficulty && (
        <View style={styles.reviewTagsRow}>
          <View style={styles.reviewTag}>
            <Text style={styles.reviewTagText}>{getSettingLabel(review.setting)}</Text>
          </View>
          <View style={styles.reviewTag}>
            <Text style={styles.reviewTagText}>{getDifficultyLabel(review.difficulty)}</Text>
          </View>
        </View>
      )}

      {review.reviewText && (
        <Text style={styles.reviewText} numberOfLines={3}>
          {review.reviewText}
        </Text>
      )}

      {/* Photo Grid */}
      {review.photos && review.photos.length > 0 && (
        <SimplePhotoGrid 
          photos={review.photos} 
          containerWidth={SCREEN_WIDTH - 40 - 32}
        />
      )}

      <View style={styles.reviewFooter}>
        <Text style={styles.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.reviewActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('WriteReview', {
              gymId: review.gym.id,
              gymName: review.gym.name,
              reviewId: review.id,
              existingReview: review,
            } as any)}
          >
            <Text style={styles.reviewActionText}>Edit</Text>
          </TouchableOpacity>
          <Text style={styles.reviewActionSeparator}>•</Text>
          <TouchableOpacity onPress={() => handleDeleteReview(review.id)}>
            <Text style={[styles.reviewActionText, styles.reviewActionDelete]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              {user.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.uploadPhotoButton}
                onPress={handleUploadProfilePhoto}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.uploadPhotoIcon}>+</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.displayName}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings', { onLogout: onLogout })}
          >
            <Ionicons name="settings-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('FollowList', { 
              userId: user.id, 
              tab: 'followers' 
            })}
          >
            <Text style={styles.statValue}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('FollowList', { 
              userId: user.id, 
              tab: 'following' 
            })}
          >
            <Text style={styles.statValue}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* User Details */}
        {(user.climbingType || user.city) && (
          <View style={styles.detailsContainer}>
            {user.climbingType && (
              <View style={styles.detailChip}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="hiking" size={14} color="#6B7280" />
                <Text style={[styles.detailChipText, { marginLeft: 4 }]}>{user.climbingType}</Text>
              </View>
              </View>
            )}
            {user.city && user.state && (
              <View style={styles.detailChip}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={[styles.detailChipText, { marginLeft: 4 }]}>{user.city}, {user.state}</Text>
              </View>
              </View>
            )}
          </View>
        )}

{/* Tabs */}
<View style={styles.tabsContainer}>
  <TouchableOpacity
    style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
    onPress={() => setActiveTab('reviews')}
  >
    <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
      Reviews ({reviews.length})
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
    onPress={() => setActiveTab('videos')}
  >
    <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
      Videos ({videos.length})
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
    onPress={() => setActiveTab('saved')}
  >
    <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
      Saved ({savedGyms.length})
    </Text>
  </TouchableOpacity>
</View>

{/* Content based on active tab */}
<View style={styles.contentContainer}>
  {activeTab === 'reviews' ? (
    reviews.length > 0 ? (
      reviews.map(renderReview)
    ) : (
      <View style={styles.emptyState}>
        <Ionicons name="create-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyStateText}>No reviews yet</Text>
        <Text style={styles.emptyStateSubtext}>Start reviewing gyms to see them here</Text>
      </View>
    )
  ) : activeTab === 'videos' ? (
    videos.length > 0 ? (
      <View style={styles.videosGrid}>
        {videos.map((video) => (
          <TouchableOpacity
            key={video.id}
            style={styles.videoCard}
            onPress={() => navigation.navigate('VideoPlayer', {
              videoId: video.id,
              videos: videos,
            })}
          >
            <Image
              source={{ uri: video.thumbnailUrl }}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <Text style={styles.videoPlayIcon}>▶</Text>
            </View>
            <View style={styles.videoStats}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="eye-outline" size={12} color="#FFFFFF" />
                <Text style={[styles.videoStat, { marginLeft: 2 }]}>{video.views}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                <Ionicons name="heart-outline" size={12} color="#FFFFFF" />
                <Text style={[styles.videoStat, { marginLeft: 2 }]}>{video.likeCount}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    ) : (
      <View style={styles.emptyState}>
        <Ionicons name="videocam-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyStateText}>No videos yet</Text>
        <Text style={styles.emptyStateSubtext}>Upload videos to see them here</Text>
      </View>
    )
  ) : (
    savedGyms.length > 0 ? (
      savedGyms.map(renderSavedGym)
    ) : (
      <View style={styles.emptyState}>
        <Ionicons name="bookmark-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyStateText}>No saved gyms yet</Text>
        <Text style={styles.emptyStateSubtext}>Start saving gyms to see them here</Text>
      </View>
    )
  )}
</View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}