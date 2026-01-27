import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../styles/AddGymPhotoScreen.styles';
import uploadService from '../services/uploadService';
import gymService from '../services/gymService';

interface AddGymPhotoScreenProps {
  onClose: () => void;
}

export default function AddGymPhotoScreen({ onClose }: AddGymPhotoScreenProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [gyms, setGyms] = useState<any[]>([]);
  const [selectedGym, setSelectedGym] = useState<string | null>(null);

  React.useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    try {
      const allGyms = await gymService.getAllGyms();
      setGyms(allGyms);
    } catch (error) {
      console.error('Error loading gyms:', error);
    }
  };

  const pickImage = async () => {
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
        aspect: [16, 9],
      });

      if (!result.canceled) {
        const uris = result.assets.map(asset => asset.uri);
        setSelectedImages([...selectedImages, ...uris]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled) {
        setSelectedImages([...selectedImages, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUpload = async () => {
    if (!selectedGym) {
      Alert.alert('Select a gym', 'Please select which gym these photos are for');
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert('No photos', 'Please add at least one photo');
      return;
    }

    try {
      setIsUploading(true);

      // Upload all images
      const uploadPromises = selectedImages.map(uri => uploadService.uploadImage(uri));
      const imageUrls = await Promise.all(uploadPromises);

      console.log('✅ Uploaded images:', imageUrls);
      Alert.alert('Success', `Uploaded ${imageUrls.length} photo(s) to ${gyms.find(g => g.id === selectedGym)?.name}`);
      
      // TODO: Update gym photos in database
      // You'll need to create an endpoint to add photos to a gym
      
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Gym Photos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Select Gym */}
        <Text style={styles.sectionTitle}>Select Gym</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gymScroll}>
          {gyms.map(gym => (
            <TouchableOpacity
              key={gym.id}
              style={[
                styles.gymChip,
                selectedGym === gym.id && styles.gymChipSelected,
              ]}
              onPress={() => setSelectedGym(gym.id)}
            >
              <Text style={[
                styles.gymChipText,
                selectedGym === gym.id && styles.gymChipTextSelected,
              ]}>
                {gym.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <Text style={styles.actionButtonIcon}>📷</Text>
            <Text style={styles.actionButtonText}>Choose Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Text style={styles.actionButtonIcon}>📸</Text>
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Selected Photos ({selectedImages.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedGym || selectedImages.length === 0 || isUploading) && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedGym || selectedImages.length === 0 || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload {selectedImages.length} Photo(s)</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}