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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/RegisterGymScreen.styles';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons } from '@expo/vector-icons';

type RegisterGymNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterGymScreen() {
  const navigation = useNavigation<RegisterGymNavigationProp>();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [climbingTypes, setClimbingTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing
  const [dayPassPrice, setDayPassPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [studentDiscount, setStudentDiscount] = useState(false);
  const [studentDiscountDetails, setStudentDiscountDetails] = useState('');

  // Error states
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [cityError, setCityError] = useState('');
  const [stateError, setStateError] = useState('');
  const [climbingTypesError, setClimbingTypesError] = useState('');

  // US States array
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  const [showStatePicker, setShowStatePicker] = useState(false);
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
      if (climbingTypes.includes('bouldering') && climbingTypes.includes('rope')) {
        setClimbingTypes([]);
      } else {
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

const handleSubmit = async () => {
  // Clear previous errors
  setAddressError('');
  setCityError('');
  setStateError('');
  setNameError('');
  setClimbingTypesError('');

  // Validate required fields
  let hasError = false;

  // Gym name must be at least 3 characters
  if (!name.trim()) {
    setNameError('Gym name is required');
    hasError = true;
  } else if (name.trim().length < 3) {
    setNameError('Gym name must be at least 3 characters');
    hasError = true;
  }

  // Address must be at least 5 characters and contain a number
  if (!address.trim()) {
    setAddressError('Street address is required');
    hasError = true;
  } else if (address.trim().length < 5) {
    setAddressError('Please enter a complete street address');
    hasError = true;
  } else if (!/\d/.test(address)) {
    setAddressError('Street address must include a street number');
    hasError = true;
  }

  // City must be at least 2 characters
  if (!city.trim()) {
    setCityError('City is required');
    hasError = true;
  } else if (city.trim().length < 2) {
    setCityError('Please enter a valid city name');
    hasError = true;
  }

  if (!state) {
    setStateError('Please select a state');
    hasError = true;
  }

  if (climbingTypes.length === 0) {
    setClimbingTypesError('Please select at least one climbing type');
    hasError = true;
  }

  if (hasError) {
    return;
  }

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
        city: city.trim(),
        state,
        climbingTypes,
        amenities: selectedAmenities,
        dayPassPrice: dayPassPrice ? parseFloat(dayPassPrice) : undefined,
        monthlyMembershipPrice: monthlyPrice ? parseFloat(monthlyPrice) : undefined,
        studentDiscountAvailable: studentDiscount,
        studentDiscountDetails: studentDiscount && studentDiscountDetails.trim()
          ? studentDiscountDetails.trim()
          : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (response.status === 400 && data.message) {
        // Check if it's an address validation error
        if (data.message.includes('Invalid address') || 
            data.message.includes('Unable to verify') ||
            data.message.includes('outside the United States')) {
          setAddressError(data.message);
          setCityError('Please verify city is correct');
          setStateError('Please verify state is correct');
        } else {
          Alert.alert('Error', data.message);
        }
      } else {
        throw new Error(data.message || 'Failed to register gym');
      }
      return;
    }

    // Upload photos if any
    if (selectedImages.length > 0) {
      await uploadPhotos(selectedImages, data.id);
    }

    navigation.goBack();
  } catch (error: any) {
    console.error('Registration error:', error);
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
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
                if (nameError) setNameError('');
              }}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={[styles.input, addressError ? styles.inputError : null]}
              placeholder="e.g., 575 Degraw St"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (addressError) setAddressError('');
              }}
            />
            {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, cityError ? styles.inputError : null]}
              placeholder="e.g., New York"
              placeholderTextColor="#9CA3AF"
              value={city}
              onChangeText={(text) => {
                setCity(text);
                if (cityError) setCityError('');
              }}
            />
            {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}
          </View>

          {/* State */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <TouchableOpacity
              style={[styles.input, styles.stateSelector, stateError ? styles.inputError : null]}
              onPress={() => setShowStatePicker(true)}
            >
              <Text style={state ? styles.stateSelectorText : styles.statePlaceholder}>
                {state || 'Select a state'}
              </Text>
              <Text style={styles.stateChevron}>▼</Text>
            </TouchableOpacity>
            {stateError ? <Text style={styles.errorText}>{stateError}</Text> : null}

            {/* State Picker Modal */}
            <Modal
              visible={showStatePicker}
              animationType="slide"
              presentationStyle="pageSheet"
            >
              <SafeAreaView style={styles.statePickerContainer}>
                <View style={styles.statePickerHeader}>
                  <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                    <Text style={styles.statePickerClose}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.statePickerTitle}>Select State</Text>
                  <View style={{ width: 40 }} />
                </View>
                <ScrollView>
                  {usStates.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.stateOption,
                        state === s && styles.stateOptionSelected,
                      ]}
                      onPress={() => {
                        setState(s);
                        if (stateError) setStateError('');
                        setShowStatePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.stateOptionText,
                        state === s && styles.stateOptionTextSelected,
                      ]}>
                        {s}
                      </Text>
                      {state === s && <Text style={styles.stateCheckmark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </SafeAreaView>
            </Modal>
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

          {/* Pricing */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pricing (Optional)</Text>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { fontSize: 14, marginBottom: 6 }]}>Day Pass ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 25"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={dayPassPrice}
                  onChangeText={setDayPassPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { fontSize: 14, marginBottom: 6 }]}>Monthly ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 70"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={monthlyPrice}
                  onChangeText={setMonthlyPrice}
                />
              </View>
            </View>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
              onPress={() => {
                setStudentDiscount(!studentDiscount);
                if (studentDiscount) setStudentDiscountDetails('');
              }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 22, height: 22, borderRadius: 4, borderWidth: 2,
                borderColor: studentDiscount ? '#FF8C00' : '#D1D5DB',
                backgroundColor: studentDiscount ? '#FF8C00' : '#FFFFFF',
                justifyContent: 'center', alignItems: 'center', marginRight: 10,
              }}>
                {studentDiscount && <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text style={[styles.label, { marginBottom: 0, fontWeight: '500' }]}>Student discount available</Text>
            </TouchableOpacity>

            {studentDiscount && (
              <TextInput
                style={styles.input}
                placeholder="e.g. 10% off with valid student ID"
                placeholderTextColor="#9CA3AF"
                value={studentDiscountDetails}
                onChangeText={setStudentDiscountDetails}
              />
            )}
          </View>

          {/* Photos */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photos (Optional)</Text>
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
              <Ionicons name="camera-outline" size={24} color="#6B7280" style={{ marginRight: 10 }} />
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