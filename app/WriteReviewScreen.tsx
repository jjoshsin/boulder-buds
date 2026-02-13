import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../styles/WriteReviewScreen.styles';
import * as SecureStore from 'expo-secure-store';

interface RatingCategory {
  key: string;
  label: string;
  icon: string;
}

type WriteReviewNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function WriteReviewScreen() {
  const route = useRoute();
  const navigation = useNavigation<WriteReviewNavigationProp>();
  const { gymId, gymName, reviewId, existingReview } = route.params as { 
    gymId: string; 
    gymName: string;
    reviewId?: string;
    existingReview?: any;
  };

  const isEditing = !!reviewId;

  // Initialize with existing review data if editing
  const [overallRating, setOverallRating] = useState(existingReview?.overallRating || 0);
  const [settingQuality, setSettingQuality] = useState(existingReview?.settingQuality || 0);
  const [difficulty, setDifficulty] = useState(existingReview?.difficulty || 0);
  const [variety, setVariety] = useState(existingReview?.variety || 0);
  const [crowding, setCrowding] = useState(existingReview?.crowding || 0);
  const [cleanliness, setCleanliness] = useState(existingReview?.cleanliness || 0);
  const [vibe, setVibe] = useState(existingReview?.vibe || 0);
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(existingReview?.tags || []);
  const [selectedImages, setSelectedImages] = useState<string[]>(existingReview?.photos || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingCategories: RatingCategory[] = [
    { key: 'setting', label: 'Setting', icon: '🧗' },
    { key: 'difficulty', label: 'Difficulty', icon: '💪' },
    { key: 'variety', label: 'Variety', icon: '🎨' },
    { key: 'crowding', label: 'Crowding', icon: '👥' },
    { key: 'cleanliness', label: 'Cleanliness', icon: '✨' },
    { key: 'vibe', label: 'Vibe', icon: '🎵' },
  ];

  const availableTags = [
    'beginner_friendly',
    'comp_style',
    'soft_grades',
    'stiff_grades',
    'good_for_training',
    'family_friendly',
    'great_setting',
    'crowded',
    'well_maintained',
    'friendly_staff',
  ];

  const getRatingState = (key: string) => {
    switch (key) {
      case 'setting': return settingQuality;
      case 'difficulty': return difficulty;
      case 'variety': return variety;
      case 'crowding': return crowding;
      case 'cleanliness': return cleanliness;
      case 'vibe': return vibe;
      default: return 0;
    }
  };

  const setRatingState = (key: string, value: number) => {
    switch (key) {
      case 'setting': setSettingQuality(value); break;
      case 'difficulty': setDifficulty(value); break;
      case 'variety': setVariety(value); break;
      case 'crowding': setCrowding(value); break;
      case 'cleanliness': setCleanliness(value); break;
      case 'vibe': setVibe(value); break;
    }
  };

  const renderStars = (rating: number, onPress: (star: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
          >
            <Text style={styles.starText}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const uris = result.assets.map(asset => asset.uri);
        setSelectedImages([...selectedImages, ...uris]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

const uploadPhotos = async (imageUris: string[]): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  const token = await SecureStore.getItemAsync('authToken');

  console.log('📸 Starting upload for', imageUris.length, 'photos');

  for (const uri of imageUris) {
    try {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('image', { uri, name: filename, type } as any); // 'image' not 'photo'

      const response = await fetch('http://192.168.1.166:3000/upload/image', { // /upload/image not /upload/photo
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Uploaded URL:', data.url);
        uploadedUrls.push(data.url);
      } else {
        const error = await response.json();
        console.error('❌ Upload failed:', error);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
    }
  }

  return uploadedUrls;
};

const handleSubmit = async () => {
  if (overallRating === 0) {
    Alert.alert('Rating required', 'Please provide an overall rating');
    return;
  }

  try {
    setIsSubmitting(true);
    const token = await SecureStore.getItemAsync('authToken');

    // Upload photos first if any selected
    let uploadedPhotoUrls: string[] = [];
    if (selectedImages.length > 0) {
      uploadedPhotoUrls = await uploadPhotos(selectedImages);
    }

    const url = isEditing
      ? `http://192.168.1.166:3000/reviews/${reviewId}`
      : `http://192.168.1.166:3000/reviews`;

    const method = isEditing ? 'PATCH' : 'POST';

    const body: any = {
      overallRating,
      settingQuality: settingQuality || null,
      difficulty: difficulty || null,
      variety: variety || null,
      crowding: crowding || null,
      cleanliness: cleanliness || null,
      vibe: vibe || null,
      reviewText: reviewText.trim() || null,
      tags: selectedTags,
      photos: uploadedPhotoUrls,
    };

    if (!isEditing) {
      body.gymId = gymId;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit review');
    }

    Alert.alert(
      'Success',
      isEditing ? 'Your review has been updated!' : 'Your review has been posted!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to submit review');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Review' : 'Write Review'}
            </Text>          
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Gym Name */}
          <Text style={styles.gymName}>{gymName}</Text>

          {/* Overall Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating *</Text>
            {renderStars(overallRating, setOverallRating)}
          </View>

          {/* Detailed Ratings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Different Aspects</Text>
            <Text style={styles.sectionSubtitle}>Optional but helpful!</Text>
            
            {ratingCategories.map((category) => (
              <View key={category.key} style={styles.ratingRow}>
                <View style={styles.ratingLabel}>
                  <Text style={styles.ratingIcon}>{category.icon}</Text>
                  <Text style={styles.ratingLabelText}>{category.label}</Text>
                </View>
                {renderStars(getRatingState(category.key), (value) => setRatingState(category.key, value))}
              </View>
            ))}
          </View>

          {/* Review Text */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Share your experience at this gym..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={reviewText}
              onChangeText={setReviewText}
              maxLength={500}
            />
            <Text style={styles.charCount}>{reviewText.length}/500</Text>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Tags</Text>
            <View style={styles.tagsContainer}>
              {availableTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    selectedTags.includes(tag) && styles.tagChipSelected,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagChipText,
                    selectedTags.includes(tag) && styles.tagChipTextSelected,
                  ]}>
                    {tag.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Photos</Text>
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
              <Text style={styles.addPhotoIcon}>📸</Text>
              <Text style={styles.addPhotoText}>Add Photos</Text>
            </TouchableOpacity>

            {selectedImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (overallRating === 0 || isSubmitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={overallRating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Review' : 'Post Review'}
              </Text>            
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}