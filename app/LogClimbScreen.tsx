import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import climbLogService from '../services/climbLogService';
import gymService, { Gym } from '../services/gymService';
import videoService from '../services/videoService';
import { styles } from '../styles/LogClimbScreen.styles';

const BOULDER_GRADES = [
  'VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8',
  'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17',
];

const ROPE_GRADES = [
  '5.5', '5.6', '5.7', '5.8', '5.9',
  '5.10a', '5.10b', '5.10c', '5.10d',
  '5.11a', '5.11b', '5.11c', '5.11d',
  '5.12a', '5.12b', '5.12c', '5.12d',
  '5.13a', '5.13b', '5.13c', '5.13d',
  '5.14a', '5.14b', '5.14c', '5.14d',
  '5.15a', '5.15b', '5.15c', '5.15d',
];

const OUTCOMES: { value: 'sent' | 'flash' | 'onsight' | 'project'; label: string; icon: string; color: string }[] = [
  { value: 'sent',    label: 'Sent',    icon: 'checkmark-circle', color: '#10B981' },
  { value: 'flash',   label: 'Flash',   icon: 'flash',            color: '#F59E0B' },
  { value: 'onsight', label: 'Onsight', icon: 'eye',              color: '#6366F1' },
  { value: 'project', label: 'Project', icon: 'time',             color: '#9CA3AF' },
];

export default function LogClimbScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [climbType, setClimbType] = useState<'boulder' | 'rope'>('boulder');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<'sent' | 'flash' | 'onsight' | 'project' | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [showGymPicker, setShowGymPicker] = useState(false);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymSearch, setGymSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [attachedVideo, setAttachedVideo] = useState<{ uri: string; filename: string } | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{ videoUrl: string; thumbnailUrl: string } | null>(null);

  const grades = climbType === 'boulder' ? BOULDER_GRADES : ROPE_GRADES;

  useEffect(() => {
    loadGyms();
  }, []);

  useEffect(() => {
    setSelectedGrade(null);
  }, [climbType]);

  const loadGyms = async () => {
    try {
      const all = await gymService.getAllGyms();
      setGyms(all);
    } catch {}
  };

  const filteredGyms = gymSearch.trim()
    ? gyms.filter(g =>
        g.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
        g.city?.toLowerCase().includes(gymSearch.toLowerCase()),
      )
    : gyms;

  const canSave = selectedGym && selectedGrade && selectedOutcome;

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to attach a video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 120,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'video.mp4';
      setAttachedVideo({ uri: asset.uri, filename });
      setUploadResult(null);

      // Start uploading immediately in the background
      setUploadState('uploading');
      videoService.uploadVideo(asset.uri)
        .then(res => {
          setUploadResult(res);
          setUploadState('done');
        })
        .catch(() => {
          setUploadState('error');
        });
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const log = await climbLogService.createLog({
        gymId: selectedGym!.id,
        climbType,
        grade: selectedGrade!,
        outcome: selectedOutcome!,
        notes: notes.trim() || undefined,
      });

      if (attachedVideo) {
        let result = uploadResult;
        if (!result) {
          if (uploadState === 'error') {
            Alert.alert('Upload failed', 'The video failed to upload. Remove it and try again.');
            return;
          }
          Alert.alert('Please wait', 'Your video is still uploading. Try again in a moment.');
          return;
        }
        await videoService.createVideo({
          gymId: selectedGym!.id,
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          climbLogId: log.id,
          isShared: true,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save log');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log a Climb</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || isSaving}
          style={[styles.saveButton, { backgroundColor: canSave ? '#FF8C00' : '#E5E7EB' }]}
        >
          {isSaving
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={[styles.saveButtonText, { color: canSave ? '#FFFFFF' : '#9CA3AF' }]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Gym Picker */}
        <Text style={styles.sectionLabel}>Gym</Text>
        <TouchableOpacity
          onPress={() => setShowGymPicker(true)}
          style={[styles.gymPicker, { borderColor: selectedGym ? '#FF8C00' : '#E5E7EB' }]}
        >
          <Ionicons name="location-outline" size={20} color={selectedGym ? '#FF8C00' : '#9CA3AF'} />
          <Text style={[styles.gymPickerText, { color: selectedGym ? '#1F2937' : '#9CA3AF', fontWeight: selectedGym ? '600' : '400' }]}>
            {selectedGym ? selectedGym.name : 'Select a gym'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Climb Type */}
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.typeRow}>
          {(['boulder', 'rope'] as const).map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setClimbType(type)}
              style={[
                styles.typeButton,
                {
                  backgroundColor: climbType === type ? '#FF8C00' : '#F9FAFB',
                  borderColor: climbType === type ? '#FF8C00' : '#E5E7EB',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={type === 'boulder' ? 'hiking' : 'carabiner'}
                size={20}
                color={climbType === type ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[styles.typeButtonText, { color: climbType === type ? '#FFFFFF' : '#374151' }]}>
                {type === 'boulder' ? 'Bouldering' : 'Rope'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grade Picker */}
        <Text style={styles.sectionLabel}>Grade</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
          <View style={styles.gradeList}>
            {grades.map(grade => (
              <TouchableOpacity
                key={grade}
                onPress={() => setSelectedGrade(grade)}
                style={[
                  styles.gradeChip,
                  {
                    backgroundColor: selectedGrade === grade ? '#FF8C00' : '#F3F4F6',
                    borderColor: selectedGrade === grade ? '#FF8C00' : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.gradeChipText, { color: selectedGrade === grade ? '#FFFFFF' : '#374151' }]}>
                  {grade}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Outcome */}
        <Text style={styles.sectionLabel}>Outcome</Text>
        <View style={styles.outcomeRow}>
          {OUTCOMES.map(o => {
            const active = selectedOutcome === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                onPress={() => setSelectedOutcome(o.value)}
                style={[
                  styles.outcomeButton,
                  {
                    backgroundColor: active ? o.color : '#F9FAFB',
                    borderColor: active ? o.color : '#E5E7EB',
                  },
                ]}
              >
                <Ionicons name={o.icon as any} size={20} color={active ? '#FFFFFF' : o.color} />
                <Text style={[styles.outcomeLabel, { color: active ? '#FFFFFF' : '#374151' }]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Beta, feelings, anything..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={300}
        />

        {/* Attach Video */}
        <Text style={styles.sectionLabel}>Video (optional)</Text>
        {attachedVideo ? (
          <View style={styles.videoPreview}>
            {uploadState === 'uploading'
              ? <ActivityIndicator size="small" color="#FF8C00" />
              : <Ionicons name={uploadState === 'error' ? 'alert-circle' : 'checkmark-circle'} size={22} color={uploadState === 'error' ? '#EF4444' : '#10B981'} />
            }
            <View style={{ flex: 1 }}>
              <Text style={styles.videoPreviewText} numberOfLines={1}>{attachedVideo.filename}</Text>
              <Text style={styles.videoPreviewSub}>
                {uploadState === 'uploading' ? 'Uploading...' : uploadState === 'error' ? 'Upload failed — remove and retry' : 'Ready'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { setAttachedVideo(null); setUploadResult(null); setUploadState('idle'); }}
              style={styles.removeVideoButton}
            >
              <Ionicons name="close-circle" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.attachVideoButton} onPress={handlePickVideo}>
            <Ionicons name="videocam-outline" size={22} color="#9CA3AF" />
            <Text style={styles.attachVideoText}>Attach a clip of your climb</Text>
            <Ionicons name="add-circle-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Gym Picker Modal */}
      <Modal visible={showGymPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowGymPicker(false); setGymSearch(''); }} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Gym</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={gymSearch}
                onChangeText={setGymSearch}
                placeholder="Search gyms..."
                placeholderTextColor="#9CA3AF"
                autoFocus={false}
              />
            </View>
          </View>

          <ScrollView>
            {filteredGyms.map(gym => (
              <TouchableOpacity
                key={gym.id}
                onPress={() => { setSelectedGym(gym); setShowGymPicker(false); setGymSearch(''); }}
                style={styles.gymRow}
              >
                <View style={styles.gymIcon}>
                  <MaterialCommunityIcons name="office-building-outline" size={20} color="#FF8C00" />
                </View>
                <View style={styles.gymRowBody}>
                  <Text style={styles.gymRowName}>{gym.name}</Text>
                  <Text style={styles.gymRowMeta}>{gym.city}{gym.state ? `, ${gym.state}` : ''}</Text>
                </View>
                {selectedGym?.id === gym.id && <Ionicons name="checkmark-circle" size={20} color="#FF8C00" />}
              </TouchableOpacity>
            ))}

            {/* Register gym footer */}
            <TouchableOpacity
              style={styles.registerGymRow}
              onPress={() => {
                setShowGymPicker(false);
                setGymSearch('');
                navigation.navigate('RegisterGym');
              }}
            >
              <View style={[styles.gymIcon, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="add-circle-outline" size={20} color="#6B7280" />
              </View>
              <View style={styles.gymRowBody}>
                <Text style={styles.registerGymText}>Don't see your gym?</Text>
                <Text style={styles.registerGymSub}>Register it here</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
