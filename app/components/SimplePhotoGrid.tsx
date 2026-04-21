import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
  },
  photo: {
    borderRadius: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  galleryClose: {
    fontSize: 24,
    color: '#FFFFFF',
    width: 40,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  galleryPhoto: {
    height: (SCREEN_WIDTH - 48) / 2,
    borderRadius: 8,
  },
});

interface SimplePhotoGridProps {
  photos: string[];
  containerWidth?: number;
}

export default function SimplePhotoGrid({ photos, containerWidth = SCREEN_WIDTH - 40 }: SimplePhotoGridProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  if (!photos || photos.length === 0) return null;

  const HEIGHT_MULTIPLIER = 0.7; // Adjust this (0.5 = 50% height, 0.7 = 70% height, etc.)

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

  // 1 photo - full width (not tappable)
  if (photos.length === 1) {
    const photoHeight = containerWidth * HEIGHT_MULTIPLIER;
    return (
      <View style={[styles.container, { width: containerWidth }]}>
        <Image
          source={{ uri: photos[0] }}
          style={[styles.photo, { width: containerWidth, height: photoHeight }]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // 2 photos - 50/50 side by side (not tappable)
  if (photos.length === 2) {
    const photoWidth = (containerWidth - 4) / 2;
    const photoHeight = photoWidth * HEIGHT_MULTIPLIER;
    return (
      <View style={[styles.container, { width: containerWidth }]}>
        <View style={styles.row}>
          {photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={[styles.photo, { width: photoWidth, height: photoHeight }]}
              resizeMode="cover"
            />
          ))}
        </View>
      </View>
    );
  }

  // 3 photos - 50% left, 25% 25% right stacked (not tappable)
  if (photos.length === 3) {
    const leftWidth = (containerWidth - 4) / 2;
    const leftHeight = leftWidth * HEIGHT_MULTIPLIER;
    const rightWidth = (containerWidth - 4) / 2;
    const rightHeight = ((leftWidth - 4) / 2) * HEIGHT_MULTIPLIER;

    return (
      <View style={[styles.container, { width: containerWidth }]}>
        <View style={styles.row}>
          <Image
            source={{ uri: photos[0] }}
            style={[styles.photo, { width: leftWidth, height: leftHeight }]}
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
      </View>
    );
  }

  // 4+ photos - 2x2 grid (tappable to open gallery)
  const photoWidth = (containerWidth - 4) / 2;
  const photoHeight = photoWidth * HEIGHT_MULTIPLIER;
  const displayPhotos = photos.slice(0, 4);
  const extraCount = photos.length - 4;

  return (
    <View style={[styles.container, { width: containerWidth }]}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => setShowAllPhotos(true)}>
          <Image
            source={{ uri: displayPhotos[0] }}
            style={[styles.photo, { width: photoWidth, height: photoHeight }]}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={{ width: 4 }} />

        <TouchableOpacity onPress={() => setShowAllPhotos(true)}>
          <Image
            source={{ uri: displayPhotos[1] }}
            style={[styles.photo, { width: photoWidth, height: photoHeight }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      <View style={{ height: 4 }} />

      <View style={styles.row}>
        <TouchableOpacity onPress={() => setShowAllPhotos(true)}>
          <Image
            source={{ uri: displayPhotos[2] }}
            style={[styles.photo, { width: photoWidth, height: photoHeight }]}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={{ width: 4 }} />

        <TouchableOpacity
          style={{ position: 'relative' }}
          onPress={() => setShowAllPhotos(true)}
        >
          <Image
            source={{ uri: displayPhotos[3] }}
            style={[styles.photo, { width: photoWidth, height: photoHeight }]}
            resizeMode="cover"
          />
          {extraCount > 0 && (
            <View style={[styles.overlay, { width: photoWidth, height: photoHeight }]}>
              <Text style={styles.overlayText}>+{extraCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {renderFullScreenGallery()}
    </View>
  );
}