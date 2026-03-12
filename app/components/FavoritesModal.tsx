import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { styles } from '../../styles/FavoritesModal.styles';
import favoritesService, { FavoriteStatus } from '../../services/favoritesService';

interface FavoritesModalProps {
  visible: boolean;
  onClose: () => void;
  gymId: string;
  gymName: string;
}

export default function FavoritesModal({
  visible,
  onClose,
  gymId,
  gymName,
}: FavoritesModalProps) {
  const [status, setStatus] = useState<FavoriteStatus>({
    favorites: false,
    want_to_visit: false,
    bucket_list: false,
  });
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFavoriteStatus();
    }
  }, [visible, gymId]);

  const loadFavoriteStatus = async () => {
    try {
      const favoriteStatus = await favoritesService.getFavoriteStatus(gymId);
      setStatus(favoriteStatus);
    } catch (error) {
      console.error('Error loading favorite status:', error);
    }
  };

  const handleToggle = async (listType: 'favorites' | 'want_to_visit' | 'bucket_list') => {
    try {
      setIsLoading(true);

      if (status[listType]) {
        // Remove from list
        await favoritesService.removeFavorite(gymId, listType);
        setStatus({ ...status, [listType]: false });
        Alert.alert('Success', 'Removed from list');
      } else {
        // Add to list
        await favoritesService.addFavorite(gymId, listType, notes.trim() || undefined);
        setStatus({ ...status, [listType]: true });
        Alert.alert('Success', 'Added to list');
        setNotes('');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', error.message || 'Failed to update list');
    } finally {
      setIsLoading(false);
    }
  };

  const lists = [
    { type: 'favorites' as const, label: '❤️ Favorites', description: 'Your top gyms' },
    { type: 'want_to_visit' as const, label: '📍 Want to Visit', description: 'Gyms on your radar' },
    { type: 'bucket_list' as const, label: '🎯 Bucket List', description: 'Dream destinations' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Save to List</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.gymName}>{gymName}</Text>

          <Text style={styles.sectionTitle}>Add to your lists</Text>

          {lists.map((list) => (
            <TouchableOpacity
              key={list.type}
              style={[
                styles.listOption,
                status[list.type] && styles.listOptionSelected,
              ]}
              onPress={() => handleToggle(list.type)}
              disabled={isLoading}
            >
              <View style={styles.listOptionLeft}>
                <Text style={styles.listOptionLabel}>{list.label}</Text>
                <Text style={styles.listOptionDescription}>{list.description}</Text>
              </View>
              <View style={[
                styles.checkbox,
                status[list.type] && styles.checkboxSelected,
              ]}>
                {status[list.type] && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Add notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add personal notes about this gym..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
            maxLength={200}
          />
          <Text style={styles.charCount}>{notes.length}/200</Text>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FF8C00" />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}