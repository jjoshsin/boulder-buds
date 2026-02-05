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
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/UserProfileScreen.styles';
import * as SecureStore from 'expo-secure-store';

type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  climbingLevel?: string;
  climbingType?: string;
  borough?: string;
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

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation<UserProfileNavigationProp>();
  const { userId } = route.params as { userId: string };

  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [photos, setPhotos] = useState<CommunityPhoto[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'photos'>('reviews');

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('authToken');

      const [userRes, reviewsRes, photosRes, statsRes, followStatusRes] = await Promise.all([
        fetch(`http://192.168.1.166:3000/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://192.168.1.166:3000/users/${userId}/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://192.168.1.166:3000/users/${userId}/photos`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://192.168.1.166:3000/users/${userId}/follow-stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://192.168.1.166:3000/follows/check/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
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

      if (followStatusRes.ok) {
        const followData = await followStatusRes.json();
        setIsFollowing(followData.isFollowing);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(
        `http://192.168.1.166:3000/follows/${userId}`,
        {
          method: isFollowing ? 'DELETE' : 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
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

      <Text style={styles.reviewDate}>
        {new Date(review.createdAt).toLocaleDateString()}
      </Text>
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
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.displayName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          {/* Follow Button */}
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollowToggle}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
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
        {(user.climbingType || user.borough || user.climbingLevel) && (
          <View style={styles.detailsContainer}>
            {user.climbingLevel && (
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>🧗 {user.climbingLevel}</Text>
              </View>
            )}
            {user.climbingType && (
              <View style={styles.detailChip}>
                <Text style={styles.detailChipText}>⛰️ {user.climbingType}</Text>
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
              </View>
            )
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}