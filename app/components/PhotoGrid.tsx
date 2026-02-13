import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, SCREEN_WIDTH } from '../../styles/PhotoGrid.styles';
import * as SecureStore from 'expo-secure-store';

interface PhotoGridProps {
  photos: string[];
  containerWidth?: number;
  reviewId: string;
  initialLikeCount: number;
  initialLiked: boolean;
  currentUserId: string;
}

export default function PhotoGrid({
  photos,
  containerWidth = SCREEN_WIDTH - 40,
  reviewId,
  initialLikeCount,
  initialLiked,
  currentUserId,
}: PhotoGridProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialLiked);

  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const lastTap = useRef<number | null>(null);

  if (!photos || photos.length === 0) return null;

  const showHeartAnimation = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(
        `http://192.168.1.166:3000/reviews/${reviewId}/like`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      showHeartAnimation();
      if (!isLiked) {
        handleLike();
      }
      lastTap.current = null;
    } else {
      lastTap.current = now;
    }
  };

  const renderHeartOverlay = (width: number, height: number) => (
    <>
      <Animated.View
        style={[
          styles.heartOverlay,
          {
            width,
            height,
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.heartEmoji}>❤️</Text>
      </Animated.View>

      {likeCount > 0 && (
        <View style={styles.likeCountContainer} pointerEvents="none">
          <Text style={styles.likeCountText}>
            {isLiked ? '❤️' : '🤍'} {likeCount}
          </Text>
        </View>
      )}
    </>
  );

  const renderFullScreenGallery = () => (
    <Modal
      visible={showAllPhotos}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.galleryContainer}>
        <View style={styles.galleryHeader}>
          <TouchableOpacity onPress={() => setShowAllPhotos(false)}>
            <Text style={styles.galleryClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.galleryTitle}>{photos.length} Photos</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.galleryGrid}>
          {photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={[styles.galleryPhoto, { width: (SCREEN_WIDTH - 48) / 2 }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // 1 photo - full width
  if (photos.length === 1) {
    return (
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={[styles.container, { width: containerWidth }]}>
          <Image
            source={{ uri: photos[0] }}
            style={[styles.photo, { width: containerWidth, height: containerWidth }]}
            resizeMode="cover"
          />
          {renderHeartOverlay(containerWidth, containerWidth)}
          {renderFullScreenGallery()}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // 2 photos - 50/50
  if (photos.length === 2) {
    const photoWidth = (containerWidth - 4) / 2;
    return (
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={[styles.container, { width: containerWidth }]}>
          <View style={styles.row}>
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={[styles.photo, { width: photoWidth, height: photoWidth }]}
                resizeMode="cover"
              />
            ))}
          </View>
          {renderHeartOverlay(containerWidth, photoWidth)}
          {renderFullScreenGallery()}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // 3 photos - 50% left, 25% 25% right stacked
  if (photos.length === 3) {
    const leftWidth = (containerWidth - 4) / 2;
    const rightWidth = (containerWidth - 4) / 2;
    const rightHeight = (leftWidth - 4) / 2;

    return (
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={[styles.container, { width: containerWidth }]}>
          <View style={styles.row}>
            <Image
              source={{ uri: photos[0] }}
              style={[styles.photo, { width: leftWidth, height: leftWidth }]}
              resizeMode="cover"
            />
            <View style={{ width: 4 }} />
            <View style={{ width: rightWidth }}>
              <Image
                source={{ uri: photos[1] }}
                style={[styles.photo, { width: rightWidth, height: rightHeight }]}
                resizeMode="cover"
              />
              <View style={{ height: 4 }} />
              <Image
                source={{ uri: photos[2] }}
                style={[styles.photo, { width: rightWidth, height: rightHeight }]}
                resizeMode="cover"
              />
            </View>
          </View>
          {renderHeartOverlay(containerWidth, leftWidth)}
          {renderFullScreenGallery()}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // 4+ photos - 2x2 grid
const photoWidth = (containerWidth - 4) / 2;
const displayPhotos = photos.slice(0, 4);
const extraCount = photos.length - 4;

return (
  <TouchableWithoutFeedback onPress={handleDoubleTap}>
    <View style={[styles.container, { width: containerWidth }]}>
      <View style={styles.row}>
        <Image
          source={{ uri: displayPhotos[0] }}
          style={[styles.photo, { width: photoWidth, height: photoWidth }]}
          resizeMode="cover"
        />
        <View style={{ width: 4 }} />
        <Image
          source={{ uri: displayPhotos[1] }}
          style={[styles.photo, { width: photoWidth, height: photoWidth }]}
          resizeMode="cover"
        />
      </View>

      <View style={{ height: 4 }} />

      <View style={styles.row}>
        <Image
          source={{ uri: displayPhotos[2] }}
          style={[styles.photo, { width: photoWidth, height: photoWidth }]}
          resizeMode="cover"
        />
        <View style={{ width: 4 }} />
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: displayPhotos[3] }}
            style={[styles.photo, { width: photoWidth, height: photoWidth }]}
            resizeMode="cover"
          />
          {extraCount > 0 && (
            <TouchableOpacity   
              style={[styles.overlay, { width: photoWidth, height: photoWidth }]}
              onPress={(e) => {
                e.stopPropagation();  // Prevent double tap from firing
                setShowAllPhotos(true);
              }}
            >
              <Text style={styles.overlayText}>+{extraCount}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderHeartOverlay(containerWidth, containerWidth)}
      {renderFullScreenGallery()}
    </View>
  </TouchableWithoutFeedback>
);
}