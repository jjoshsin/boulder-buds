import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/RegisterGymScreen.styles';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

interface RegisterGymScreenProps {
  onClose: () => void;
}

export default function RegisterGymScreen({ onClose }: RegisterGymScreenProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [borough, setBorough] = useState('');
  const [climbingTypes, setClimbingTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error states
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [boroughError, setBoroughError] = useState('');
  const [climbingTypesError, setClimbingTypesError] = useState('');

  const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
  const types = ['bouldering', 'rope', 'both'];
  const amenities = [
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
  ];

  const toggleClimbingType = (type: string) => {
  setClimbingTypesError('');
  
  if (type === 'both') {
    // If both is already selected, deselect everything
    if (climbingTypes.includes('bouldering') && climbingTypes.includes('rope')) {
      setClimbingTypes([]);
    } else {
      // Select both
      setClimbingTypes(['bouldering', 'rope']);
    }
  } else {
    if (climbingTypes.includes(type)) {
      setClimbingTypes(climbingTypes.filter(t => t !== type));
    } else {
      setClimbingTypes([...climbingTypes, type]);
    }
  }
};

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
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

  const uploadPhotos = async (imageUris: string[], gymId: string): Promise<void> => {
    const token = await SecureStore.getItemAsync('authToken');
    
    for (const uri of imageUris) {
      try {
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const formData = new FormData();
        formData.append('photo', {
          uri,
          name: filename,
          type,
        } as any);

        const response = await fetch('http://192.168.1.166:3000/upload/photo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          
          await fetch(`http://192.168.1.166:3000/gyms/${gymId}/community-photos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ url: data.url, caption: null }),
          });
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }
  };

  const validate = () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Gym name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!address.trim()) {
      setAddressError('Address is required');
      isValid = false;
    } else {
      setAddressError('');
    }

    if (!borough) {
      setBoroughError('Please select a borough');
      isValid = false;
    } else {
      setBoroughError('');
    }

    if (climbingTypes.length === 0) {
      setClimbingTypesError('Please select at least one climbing type');
      isValid = false;
    } else {
      setClimbingTypesError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync('authToken');

      const response = await fetch('http://192.168.1.166:3000/gyms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          borough,
          climbingTypes,
          amenities: selectedAmenities,
        }),
      });

      if (response.ok) {
        const gym = await response.json();
        
        if (selectedImages.length > 0) {
          await uploadPhotos(selectedImages, gym.id);
        }
        
        Alert.alert('Success', 'Gym registered successfully!', [
          { text: 'OK', onPress: onClose },
        ]);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register gym');
      }
    } catch (error: any) {
      console.error('Register gym error:', error);
      Alert.alert('Error', error.message || 'Failed to register gym');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register Gym</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Gym Information</Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gym Name *</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="e.g., Brooklyn Boulders"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (text.trim()) setNameError('');
              }}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, addressError ? styles.inputError : null]}
              placeholder="e.g., 575 Degraw St"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (text.trim()) setAddressError('');
              }}
            />
            {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
          </View>

          {/* Borough */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Borough *</Text>
            <View style={styles.chipContainer}>
              {boroughs.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[
                    styles.chip,
                    borough === b && styles.chipActive,
                    boroughError ? styles.chipErrorBorder : null,
                  ]}
                  onPress={() => {
                    setBorough(b);
                    setBoroughError('');
                  }}
                >
                  <Text style={[styles.chipText, borough === b && styles.chipTextActive]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {boroughError ? <Text style={styles.errorText}>{boroughError}</Text> : null}
          </View>

{/* Climbing Types */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Climbing Types *</Text>
  <View style={styles.chipContainer}>
    <TouchableOpacity
      style={[
        styles.chip,
        climbingTypes.includes('bouldering') && styles.chipActive,
        climbingTypesError ? styles.chipErrorBorder : null,
      ]}
      onPress={() => toggleClimbingType('bouldering')}
    >
      <Text style={[styles.chipText, climbingTypes.includes('bouldering') && styles.chipTextActive]}>
        Bouldering
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.chip,
        climbingTypes.includes('rope') && styles.chipActive,
        climbingTypesError ? styles.chipErrorBorder : null,
      ]}
      onPress={() => toggleClimbingType('rope')}
    >
      <Text style={[styles.chipText, climbingTypes.includes('rope') && styles.chipTextActive]}>
        Rope
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.chip,
        (climbingTypes.includes('bouldering') && climbingTypes.includes('rope')) && styles.chipActive,
        climbingTypesError ? styles.chipErrorBorder : null,
      ]}
      onPress={() => toggleClimbingType('both')}
    >
      <Text style={[
        styles.chipText,
        (climbingTypes.includes('bouldering') && climbingTypes.includes('rope')) && styles.chipTextActive,
      ]}>
        Both
      </Text>
    </TouchableOpacity>
  </View>
  {climbingTypesError ? <Text style={styles.errorText}>{climbingTypesError}</Text> : null}
</View>

          {/* Amenities */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amenities (Optional)</Text>
            <View style={styles.chipContainer}>
              {amenities.map((amenity) => (
                <TouchableOpacity
                  key={amenity}
                  style={[styles.chip, selectedAmenities.includes(amenity) && styles.chipActive]}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Text style={[styles.chipText, selectedAmenities.includes(amenity) && styles.chipTextActive]}>
                    {amenity.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photos */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photos (Optional)</Text>
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
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Register Gym</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}