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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/ProfileScreen.styles';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

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
  borough?: string;
  age?: string;
}

interface UserReview {
  id: string;
  overallRating: number;
  reviewText?: string;
  createdAt: string;
  tags: string[];
  gym: {
    id: string;
    name: string;
    borough: string;
  };
}

interface CommunityPhoto {
  id: string;
  url: string;
  createdAt: string;
  gym: {
    id: string;
    name: string;
  };
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const navigation = useNavigation<ProfileNavigationProp>();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [photos, setPhotos] = useState<CommunityPhoto[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'photos'>('reviews');

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
        
        const [reviewsRes, photosRes, statsRes, userRes] = await Promise.all([
          fetch(`http://192.168.1.166:3000/users/${userData.id}/reviews`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`http://192.168.1.166:3000/users/${userData.id}/photos`, {
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
          // Update stored user data
          await SecureStore.setItemAsync('user', JSON.stringify(freshUserData));
        }

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }

        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setPhotos(photosData);
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
          
          // Update stored user data
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
    <TouchableOpacity
      key={review.id}
      style={styles.reviewCard}
      onPress={() => navigation.navigate('GymDetail', { gymId: review.gym.id })}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.reviewGymInfo}>
          <Text style={styles.reviewGymName}>{review.gym.name}</Text>
          <Text style={styles.reviewGymBorough}>{review.gym.borough}</Text>
        </View>
        <Text style={styles.reviewRating}>⭐ {review.overallRating.toFixed(1)}</Text>
      </View>

      {review.reviewText && (
        <Text style={styles.reviewText} numberOfLines={3}>
          {review.reviewText}
        </Text>
      )}

      {review.tags && review.tags.length > 0 && (
        <View style={styles.reviewTags}>
          {review.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.reviewTag}>
              <Text style={styles.reviewTagText}>{tag.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
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
    </TouchableOpacity>
  );

  const renderPhoto = (photo: CommunityPhoto) => (
    <TouchableOpacity
      key={photo.id}
      style={styles.photoCard}
      onPress={() => navigation.navigate('GymDetail', { gymId: photo.gym.id })}
    >
      <Image source={{ uri: photo.url }} style={styles.photoImage} resizeMode="cover" />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoGymName} numberOfLines={1}>
          {photo.gym.name}
        </Text>
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
  onPress={() => navigation.navigate('Settings')}
>
  <Text style={styles.settingsIcon}>⚙️</Text>
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
        {(user.climbingType || user.borough) && (
          <View style={styles.detailsContainer}>
            {user.climbingType && (
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>🧗 {user.climbingType}</Text>
              </View>
            )}
            {user.borough && (
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>📍 {user.borough}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
            onPress={() => setActiveTab('photos')}
          >
            <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
              Photos ({photos.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'reviews' ? (
            reviews.length > 0 ? (
              reviews.map(renderReview)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>✍️</Text>
                <Text style={styles.emptyStateText}>No reviews yet</Text>
                <Text style={styles.emptyStateSubtext}>Start reviewing gyms to see them here</Text>
              </View>
            )
          ) : (
            photos.length > 0 ? (
              <View style={styles.photosGrid}>
                {photos.map(renderPhoto)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📸</Text>
                <Text style={styles.emptyStateText}>No photos yet</Text>
                <Text style={styles.emptyStateSubtext}>Upload photos to gyms to see them here</Text>
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