import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import * as ImagePicker from 'expo-image-picker';
import { ResizeMode, Video } from 'expo-av';
import { styles } from '../styles/UploadVideoScreen.styles';
import videoService from '../services/videoService';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';

type UploadVideoNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UploadVideoScreen() {
  const navigation = useNavigation<UploadVideoNavigationProp>();
  const route = useRoute();
  const { gymId, gymName } = route.params as { gymId: string; gymName: string };

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);  // Add this

const pickVideo = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.5,  // Reduce quality to 50%
      videoMaxDuration: 30, // Limit to 30 seconds
      videoQuality: 0,  // 0 = low, 1 = medium, 2 = high
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  } catch (error) {
    console.error('Error picking video:', error);
    Alert.alert('Error', 'Failed to pick video');
  }
};

const recordVideo = async () => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.5,  // Reduce quality
      videoMaxDuration: 30,
      videoQuality: 0,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  } catch (error) {
    console.error('Error recording video:', error);
    Alert.alert('Error', 'Failed to record video');
  }
};

const handleUpload = async () => {
  if (!videoUri) {
    Alert.alert('No video', 'Please select a video first');
    return;
  }

  try {
    setIsUploading(true);
    setUploadProgress(0);

    console.log('📤 Starting video upload...');

    // Simulate progress (since we can't track actual upload progress easily)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 1000);

    // Upload video and generate thumbnail
    const { videoUrl, thumbnailUrl } = await videoService.uploadVideo(videoUri);
    
    clearInterval(progressInterval);
    setUploadProgress(100);

    // Create video entry
    await videoService.createVideo({
      gymId,
      videoUrl,
      thumbnailUrl,
      caption: caption.trim() || undefined,
    });

    Alert.alert('Success', 'Video uploaded successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    Alert.alert('Error', error.message || 'Failed to upload video. Please try again.');
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Video</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Gym Name */}
          <Text style={styles.gymName}>{gymName}</Text>

          {/* Video Preview */}
          {videoUri ? (
            <View style={styles.videoPreview}>
              <Video
                source={{ uri: videoUri }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
              <TouchableOpacity
                style={styles.changeVideoButton}
                onPress={() => setVideoUri(null)}
              >
                <Text style={styles.changeVideoText}>Change Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.placeholderEmoji}>🎥</Text>
              <Text style={styles.placeholderText}>No video selected</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={pickVideo}>
                  <Text style={styles.actionButtonIcon}>📷</Text>
                  <Text style={styles.actionButtonText}>Choose Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={recordVideo}>
                  <Text style={styles.actionButtonIcon}>📹</Text>
                  <Text style={styles.actionButtonText}>Record Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Caption */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Add a caption to your video..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={caption}
              onChangeText={setCaption}
              maxLength={200}
            />
            <Text style={styles.charCount}>{caption.length}/200</Text>
          </View>

          {/* Upload Button */}
          <TouchableOpacity
            style={[styles.uploadButton, (!videoUri || isUploading) && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={!videoUri || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload Video</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}