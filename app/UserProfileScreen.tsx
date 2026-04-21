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
import { getSettingLabel, getDifficultyLabel } from './utils/reviewLabels';
import videoService from '../services/videoService';
import blockingService from '../services/blockingService';
import ReportModal from './components/ReportModal';
import { FontAwesome } from '@expo/vector-icons';

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
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [activeTab, setActiveTab] = useState<'reviews' | 'videos'>('reviews');
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useEffect(() => {
    loadUserProfile();
    checkIfBlocked();
  }, [userId]);

  const checkIfBlocked = async () => {
    try {
      const blocked = await blockingService.isBlocked(userId);
      setIsBlocked(blocked);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('authToken');

      const [userRes, reviewsRes, statsRes, followStatusRes, videosData] = await Promise.all([
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
        videoService.getUserVideos(userId),
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

      setVideos(videosData);
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

  const handleBlockToggle = async () => {
    try {
      if (isBlocked) {
        await blockingService.unblockUser(userId);
        setIsBlocked(false);
        Alert.alert('Success', 'User unblocked');
      } else {
        Alert.alert(
          'Block User',
          `Are you sure you want to block ${user?.displayName}? You will no longer see their content and they cannot interact with you.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                await blockingService.blockUser(userId);
                setIsBlocked(true);
                Alert.alert('Blocked', 'User has been blocked');
              },
            },
          ]
        );
      }
      setShowOptionsMenu(false);
    } catch (error) {
      console.error('Error toggling block:', error);
      Alert.alert('Error', 'Failed to update block status');
    }
  };

  const renderReview = (review: UserReview) => (
    <View key={review.id} style={styles.reviewCard}>
      <TouchableOpacity onPress={() => navigation.navigate('GymDetail', { gymId: review.gym.id })}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewGymInfo}>
            <Text style={styles.reviewGymName}>{review.gym.name}</Text>
            <Text style={styles.reviewGymBorough}>
              {review.gym.city}{review.gym.state ? `, ${review.gym.state}` : ''} · {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Tags */}
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
        <SimplePhotoGrid
          photos={review.photos}
          containerWidth={SCREEN_WIDTH - 40 - 32}
        />
      )}
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
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
          >
            <Text style={styles.optionsButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Options Menu */}
        {showOptionsMenu && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionsMenuItem}
              onPress={handleBlockToggle}
            >
              <Text style={styles.optionsMenuText}>
                {isBlocked ? '🔓 Unblock User' : '🚫 Block User'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionsMenuItem, styles.optionsMenuItemLast]}
              onPress={() => {
                setShowOptionsMenu(false);
                setShowReportModal(true);
              }}
            >
              <Text style={[styles.optionsMenuText, styles.optionsMenuTextDanger]}>
                🚩 Report User
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
        </View>

        {/* Content based on active tab */}
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
                      <Text style={styles.videoStat}>👁 {video.views}</Text>
                      <Text style={styles.videoStat}>❤️ {video.likeCount}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🎥</Text>
                <Text style={styles.emptyStateText}>No videos yet</Text>
              </View>
            )
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="user"
        reportedUserId={userId}
        reportedUserName={user?.displayName}
      />
    </SafeAreaView>
  );
}