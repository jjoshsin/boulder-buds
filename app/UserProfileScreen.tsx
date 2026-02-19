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
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/UserProfileScreen.styles';
import * as SecureStore from 'expo-secure-store';
import SimplePhotoGrid from './components/SimplePhotoGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  climbingLevel?: string;
  climbingType?: string;
  city?: string;
  state?: string;
}

interface UserReview {
  id: string;
  overallRating: number;
  reviewText?: string;
  createdAt: string;
  tags: string[];
  photos: string[];
  gym: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
}

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation<UserProfileNavigationProp>();
  const { userId } = route.params as { userId: string };

  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('authToken');

      const [userRes, reviewsRes, statsRes, followStatusRes] = await Promise.all([
        fetch(`http://192.168.1.166:3000/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://192.168.1.166:3000/users/${userId}/reviews`, {
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

      {/* Photo Grid */}
      {review.photos && review.photos.length > 0 && (
        <SimplePhotoGrid 
          photos={review.photos} 
          containerWidth={SCREEN_WIDTH - 40 - 32}
        />
      )}

      <Text style={styles.reviewDate}>
        {new Date(review.createdAt).toLocaleDateString()}
      </Text>
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
        {(user.climbingType || user.city || user.climbingLevel) && (
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
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}