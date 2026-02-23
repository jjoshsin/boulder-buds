import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/AllReviewsScreen.styles';
import PhotoGrid from './components/PhotoGrid';
import * as SecureStore from 'expo-secure-store';
import { getSettingLabel, getDifficultyLabel } from './utils/reviewLabels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AllReviewsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SortOption = 'mostLiked' | 'mostRecent' | 'highestRating' | 'lowestRating';

export default function AllReviewsScreen() {
  const route = useRoute();
  const navigation = useNavigation<AllReviewsNavigationProp>();
  const { reviews, currentUserId, gymName } = route.params as any;

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('mostLiked');

  // Filter by rating
  const filteredByRating = selectedRating
    ? reviews.filter((r: any) => Math.round(r.overallRating) === selectedRating)
    : reviews;

  // Sort reviews
  const sortedReviews = [...filteredByRating].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'mostLiked':
        return (b.likeCount || 0) - (a.likeCount || 0);
      case 'mostRecent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'highestRating':
        return b.overallRating - a.overallRating;
      case 'lowestRating':
        return a.overallRating - b.overallRating;
      default:
        return 0;
    }
  });

  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter((r: any) => Math.round(r.overallRating) === rating).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { rating, count, percentage };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{gymName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Rating Breakdown */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Filter by rating</Text>
          {ratingBreakdown.map(({ rating, count, percentage }) => (
            <TouchableOpacity
              key={rating}
              style={styles.ratingRow}
              onPress={() => setSelectedRating(selectedRating === rating ? null : rating)}
            >
              <Text style={styles.ratingStars}>{rating} ⭐</Text>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${percentage}%` }]} />
              </View>
              <Text style={styles.ratingPercentage}>{percentage.toFixed(0)}%</Text>
            </TouchableOpacity>
          ))}
          {selectedRating && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={() => setSelectedRating(null)}
            >
              <Text style={styles.clearFilterText}>Clear filter</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Options */}
        <View style={styles.sortSection}>
          <Text style={styles.sortLabel}>Sort by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortBar}>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'mostLiked' && styles.sortChipActive]}
              onPress={() => setSortBy('mostLiked')}
            >
              <Text style={[styles.sortText, sortBy === 'mostLiked' && styles.sortTextActive]}>
                Most Liked
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'mostRecent' && styles.sortChipActive]}
              onPress={() => setSortBy('mostRecent')}
            >
              <Text style={[styles.sortText, sortBy === 'mostRecent' && styles.sortTextActive]}>
                Most Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'highestRating' && styles.sortChipActive]}
              onPress={() => setSortBy('highestRating')}
            >
              <Text style={[styles.sortText, sortBy === 'highestRating' && styles.sortTextActive]}>
                Highest Rating
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'lowestRating' && styles.sortChipActive]}
              onPress={() => setSortBy('lowestRating')}
            >
              <Text style={[styles.sortText, sortBy === 'lowestRating' && styles.sortTextActive]}>
                Lowest Rating
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Results Count */}
        <Text style={styles.resultsCount}>
          {sortedReviews.length} {sortedReviews.length === 1 ? 'review' : 'reviews'}
        </Text>

        {/* Reviews List */}
        {sortedReviews.map((review: any) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {review.user.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userName}>{review.user.displayName}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.rating}>⭐ {review.overallRating.toFixed(1)}</Text>
            </View>

            {/* Setting & Difficulty Tags */}
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{getSettingLabel(review.setting)}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{getDifficultyLabel(review.difficulty)}</Text>
              </View>
            </View>

            {review.reviewText && (
              <Text style={styles.reviewText}>{review.reviewText}</Text>
            )}

            {review.photos && review.photos.length > 0 && (
              <PhotoGrid
                photos={review.photos}
                reviewId={review.id}
                initialLikeCount={review.likeCount}
                initialLiked={review.likes?.some((l: any) => l.userId === currentUserId)}
                currentUserId={currentUserId}
                containerWidth={SCREEN_WIDTH - 72}
              />
            )}

            <Text style={styles.likeCount}>
              {review.likeCount > 0 ? `❤️ ${review.likeCount}` : '🤍 0'}
            </Text>
          </View>
        ))}

        {sortedReviews.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>
              No {selectedRating ? `${selectedRating}-star` : ''} reviews yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}