import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/AllVideosScreen.styles';
import videoService, { Video } from '../services/videoService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AllVideosNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SortOption = 'mostLiked' | 'mostRecent' | 'mostViewed' | 'mostCommented';

export default function AllVideosScreen() {
  const route = useRoute();
  const navigation = useNavigation<AllVideosNavigationProp>();
  const { gymId, gymName } = route.params as { gymId: string; gymName: string };

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('mostRecent');

  useEffect(() => {
    loadVideos();
  }, [sortBy]);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      const videosData = await videoService.getGymVideos(gymId, sortBy);
      setVideos(videosData);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Sort Options */}
      <View style={styles.sortSection}>
        <Text style={styles.sortLabel}>Sort by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortBar}>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'mostRecent' && styles.sortChipActive]}
            onPress={() => setSortBy('mostRecent')}
          >
            <Text style={[styles.sortText, sortBy === 'mostRecent' && styles.sortTextActive]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'mostLiked' && styles.sortChipActive]}
            onPress={() => setSortBy('mostLiked')}
          >
            <Text style={[styles.sortText, sortBy === 'mostLiked' && styles.sortTextActive]}>
              Most Liked
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'mostViewed' && styles.sortChipActive]}
            onPress={() => setSortBy('mostViewed')}
          >
            <Text style={[styles.sortText, sortBy === 'mostViewed' && styles.sortTextActive]}>
              Most Viewed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'mostCommented' && styles.sortChipActive]}
            onPress={() => setSortBy('mostCommented')}
          >
            <Text style={[styles.sortText, sortBy === 'mostCommented' && styles.sortTextActive]}>
              Most Commented
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Videos Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
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
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.videoOverlay}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
                
                <View style={styles.videoInfo}>
                  <View style={styles.userRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {video.user.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.userName} numberOfLines={1}>
                      {video.user.displayName}
                    </Text>
                  </View>
                  
                  {video.caption && (
                    <Text style={styles.caption} numberOfLines={2}>
                      {video.caption}
                    </Text>
                  )}
                  
                  <View style={styles.stats}>
                    <Text style={styles.stat}>👁 {video.views}</Text>
                    <Text style={styles.stat}>❤️ {video.likeCount}</Text>
                    <Text style={styles.stat}>💬 {video.commentCount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {videos.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎥</Text>
              <Text style={styles.emptyText}>No videos yet</Text>
              <Text style={styles.emptySubtext}>Be the first to upload!</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}