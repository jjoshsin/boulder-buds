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
import * as ImageManipulator from 'expo-image-manipulator';
import { styles } from '../styles/WriteReviewScreen.styles';
import * as SecureStore from 'expo-secure-store';

type WriteReviewNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SETTING_OPTIONS = [
  { value: 'comp_style', label: 'Comp Style'},
  { value: 'fun', label: 'Fun'},
  { value: 'creative', label: 'Creative'},
  { value: 'straightforward', label: 'Straightforward'},
];

const DIFFICULTY_OPTIONS = [
  { value: 'soft', label: 'Soft'},
  { value: 'normal', label: 'Normal'},
  { value: 'hard', label: 'Hard' },
];

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

  const [overallRating, setOverallRating] = useState(existingReview?.overallRating || 0);
  const [setting, setSetting] = useState(existingReview?.setting || '');
  const [difficulty, setDifficulty] = useState(existingReview?.difficulty || '');
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
  const [selectedImages, setSelectedImages] = useState<string[]>(existingReview?.photos || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const convertToJpeg = async (uri: string): Promise<string> => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error converting image:', error);
      return uri;
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
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const convertedUris = await Promise.all(
          result.assets.map(asset => convertToJpeg(asset.uri))
        );
        setSelectedImages([...selectedImages, ...convertedUris]);
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
        formData.append('image', { uri, name: filename, type } as any);

        const response = await fetch('http://192.168.1.166:3000/upload/image', {
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

    if (!setting) {
      Alert.alert('Setting required', 'Please select a setting quality');
      return;
    }

    if (!difficulty) {
      Alert.alert('Difficulty required', 'Please select a difficulty level');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync('authToken');

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
        setting,
        difficulty,
        reviewText: reviewText.trim() || null,
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

          {/* Setting Quality */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Setting Quality *</Text>
            <View style={styles.optionsContainer}>
{SETTING_OPTIONS.map((option) => (
  <TouchableOpacity
    key={option.value}
    style={[
      styles.optionChip,
      setting === option.value && styles.optionChipSelected,
    ]}
    onPress={() => setSetting(option.value)}
  >
    <Text style={[
      styles.optionText,
      setting === option.value && styles.optionTextSelected,
    ]}>
      {option.label}
    </Text>
  </TouchableOpacity>
))}
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty *</Text>
            <View style={styles.optionsContainer}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionChip,
                    difficulty === option.value && styles.optionChipSelected,
                  ]}
                  onPress={() => setDifficulty(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    difficulty === option.value && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
            style={[
              styles.submitButton, 
              (overallRating === 0 || !setting || !difficulty || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={overallRating === 0 || !setting || !difficulty || isSubmitting}
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