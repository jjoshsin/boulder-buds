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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const navigation = useNavigation<ProfileNavigationProp>();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
        
        const [reviewsRes, statsRes, userRes] = await Promise.all([
          fetch(`http://192.168.1.166:3000/users/${userData.id}/reviews`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`http://192.168.1.166:3000/users/${userData.id}/follow-stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`http://192.168.1.166:3000/users/${userData.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
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
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.reviewRating}>⭐ {review.overallRating.toFixed(1)}</Text>
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
            <Text style={styles.settingsButtonText}>⚙️</Text>
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
                <Text style={styles.detailChipText}>🧗 {user.climbingType}</Text>
              </View>
            )}
            {user.city && user.state && (
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>📍 {user.city}, {user.state}</Text>
              </View>
            )}
          </View>
        )}

        {/* Reviews Section Title */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.reviewsTitle}>Reviews ({reviews.length})</Text>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {reviews.length > 0 ? (
            reviews.map(renderReview)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>✍️</Text>
              <Text style={styles.emptyStateText}>No reviews yet</Text>
              <Text style={styles.emptyStateSubtext}>Start reviewing gyms to see them here</Text>
            </View>
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