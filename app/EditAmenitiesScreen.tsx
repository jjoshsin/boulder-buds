import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/EditAmenitiesScreen.styles';
import * as SecureStore from 'expo-secure-store';

interface EditAmenitiesScreenProps {
  gymId: string;
  currentAmenities: string[];
  onClose: () => void;
}

export default function EditAmenitiesScreen({ 
  gymId, 
  currentAmenities, 
  onClose 
}: EditAmenitiesScreenProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(currentAmenities);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableAmenities = [
    'kilter_board',
    'moon_board',
    'spray_wall',
    'training_area',
    'cafe',
    'showers',
    'parking',
    'yoga',
    'weights',
    'lockers',
    'sauna',
    'pool',
    'childcare',
    'pro_shop',
  ];

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync('authToken');

      const response = await fetch(
        `http://192.168.1.166:3000/gyms/${gymId}/amenities`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ amenities: selectedAmenities }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Amenities updated!', [
          {
            text: 'OK',
            onPress: onClose,
          },
        ]);
      } else {
        throw new Error('Failed to update amenities');
      }
    } catch (error) {
      console.error('Update amenities error:', error);
      Alert.alert('Error', 'Failed to update amenities');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmenityName = (amenity: string) => {
    return amenity
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Amenities</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select all that apply</Text>
          <Text style={styles.sectionSubtitle}>
            Help others know what this gym offers
          </Text>

          <View style={styles.amenitiesContainer}>
            {availableAmenities.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.amenityChip,
                  selectedAmenities.includes(amenity) && styles.amenityChipActive,
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text
                  style={[
                    styles.amenityChipText,
                    selectedAmenities.includes(amenity) && styles.amenityChipTextActive,
                  ]}
                >
                  {formatAmenityName(amenity)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            💡 Changes are visible to all users immediately
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}