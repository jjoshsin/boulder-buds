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
  const { gymId, gymName } = route.params as { gymId: string; gymName: string };

  // Rating states
  const [overallRating, setOverallRating] = useState(0);
  const [settingQuality, setSettingQuality] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [variety, setVariety] = useState(0);
  const [crowding, setCrowding] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [vibe, setVibe] = useState(0);

  // Other states
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
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

  const handleSubmit = async () => {
    // Validation
    if (overallRating === 0) {
      Alert.alert('Rating required', 'Please provide an overall rating');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync('authToken');

      // Create the review
      const response = await fetch(`http://192.168.1.166:3000/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gymId,
          overallRating,
          settingQuality: settingQuality || null,
          difficulty: difficulty || null,
          variety: variety || null,
          crowding: crowding || null,
          cleanliness: cleanliness || null,
          vibe: vibe || null,
          reviewText: reviewText.trim() || null,
          tags: selectedTags,
          photos: [], // We'll add photo upload later
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      Alert.alert('Success', 'Your review has been posted!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Submit review error:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
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
          <Text style={styles.headerTitle}>Write Review</Text>
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
              <Text style={styles.submitButtonText}>Post Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}