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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { styles } from '../styles/SettingsScreen.styles';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SettingsRouteProp = RouteProp<RootStackParamList, 'Settings'>;


interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  climbingType?: string;
  city?: string;
  state?: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const route = useRoute<SettingsRouteProp>();
  const onLogout = (route.params as any)?.onLogout;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit display name
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // Edit preferences
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [selectedClimbingType, setSelectedClimbingType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const climbingTypes: { value: string; label: string; icon: string }[] = [
    { value: 'bouldering', label: 'Bouldering', icon: 'hiking' },
    { value: 'rope', label: 'Rope', icon: 'rope' },
    { value: 'both', label: 'Both', icon: 'terrain' },
  ];

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setNewDisplayName(userData.displayName);
        setSelectedClimbingType(userData.climbingType || '');
        setSelectedCity(userData.city || '');
        setSelectedState(userData.state || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setNameError('Display name cannot be empty');
      return;
    }
    if (newDisplayName.trim().length < 2) {
      setNameError('Display name must be at least 2 characters');
      return;
    }
    setNameError('');

    try {
      setIsSavingName(true);
      const token = await SecureStore.getItemAsync('authToken');

      const response = await fetch(`http://192.168.1.166:3000/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: newDisplayName.trim() }),
      });

      if (response.ok) {
        const updatedUser = { ...user!, displayName: newDisplayName.trim() };
        setUser(updatedUser);
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setIsEditingName(false);
        Alert.alert('Success', 'Display name updated!');
      } else {
        throw new Error('Failed to update display name');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update display name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      const token = await SecureStore.getItemAsync('authToken');

      const response = await fetch(`http://192.168.1.166:3000/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          climbingType: selectedClimbingType,
          city: selectedCity.trim(),
          state: selectedState,
        }),
      });

      if (response.ok) {
        const updatedUser = {
          ...user!,
          climbingType: selectedClimbingType,
          city: selectedCity.trim(),
          state: selectedState,
        };
        setUser(updatedUser);
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setIsEditingPreferences(false);
        Alert.alert('Success', 'Preferences updated!');
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

const handleDeleteAccount = () => {
  Alert.alert(
    'Delete Account',
    'Are you sure you want to delete your account? This will permanently delete:\n\n• Your profile and all photos\n• All your reviews and photos\n• Your followers and following\n• All your activity\n\nThis action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync('authToken');
            const response = await fetch(`http://192.168.1.166:3000/users/${user?.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              // Clear all stored data
              await SecureStore.deleteItemAsync('authToken');
              await SecureStore.deleteItemAsync('user');
              
              // Call the logout handler which will reset everything
              if (onLogout) {
                onLogout();
              }
              
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
            } else {
              throw new Error('Failed to delete account');
            }
          } catch (error) {
            console.error('Delete account error:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again.');
          }
        },
      },
    ]
  );
};

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {/* Edit Display Name */}
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setIsEditingName(!isEditingName)}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Display Name</Text>
                <Text style={styles.settingValue}>{user?.displayName}</Text>
              </View>
              <Ionicons name={isEditingName ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
            </TouchableOpacity>

            {isEditingName && (
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.input, nameError ? styles.inputError : null]}
                  value={newDisplayName}
                  onChangeText={(text) => {
                    setNewDisplayName(text);
                    if (text.trim()) setNameError('');
                  }}
                  placeholder="Enter new display name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditingName(false);
                      setNewDisplayName(user?.displayName || '');
                      setNameError('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, isSavingName && styles.saveButtonDisabled]}
                    onPress={handleSaveDisplayName}
                    disabled={isSavingName}
                  >
                    {isSavingName ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Delete Account */}
          <TouchableOpacity
            style={[styles.settingCard, styles.deleteCard]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setIsEditingPreferences(!isEditingPreferences)}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Climbing Type</Text>
                <Text style={styles.settingValue}>
                  {user?.climbingType
                    ? user.climbingType.charAt(0).toUpperCase() + user.climbingType.slice(1)
                    : 'Not set'}
                </Text>
              </View>
              <Ionicons name={isEditingPreferences ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
            </TouchableOpacity>

            {!isEditingPreferences && (
              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Location</Text>
                  <Text style={styles.settingValue}>
                    {user?.city && user?.state
                      ? `${user.city}, ${user.state}`
                      : 'Not set'}
                  </Text>
                </View>
              </View>
            )}

            {isEditingPreferences && (
              <View style={styles.editContainer}>
                {/* Climbing Type */}
                <Text style={styles.editSectionLabel}>Climbing Type</Text>
                <View style={styles.chipContainer}>
                  {climbingTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.chip,
                        selectedClimbingType === type.value && styles.chipActive,
                      ]}
                      onPress={() => setSelectedClimbingType(type.value)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons
                          name={type.icon as any}
                          size={14}
                          color={selectedClimbingType === type.value ? '#FFFFFF' : '#374151'}
                        />
                        <Text style={[
                          styles.chipText,
                          selectedClimbingType === type.value && styles.chipTextActive,
                          { marginLeft: 4 },
                        ]}>
                          {type.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* City */}
                <Text style={[styles.editSectionLabel, styles.inputSpacing]}>City</Text>
                <TextInput
                  style={styles.input}
                  value={selectedCity}
                  onChangeText={setSelectedCity}
                  placeholder="e.g., New York"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />

                {/* State */}
                <Text style={[styles.editSectionLabel, styles.inputSpacing]}>State</Text>
                <TouchableOpacity
                  style={[styles.input, styles.stateSelector]}
                  onPress={() => setShowStatePicker(true)}
                >
                  <Text style={selectedState ? styles.stateSelectorText : styles.statePlaceholder}>
                    {selectedState || 'Select a state'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditingPreferences(false);
                      setSelectedClimbingType(user?.climbingType || '');
                      setSelectedCity(user?.city || '');
                      setSelectedState(user?.state || '');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, isSavingPreferences && styles.saveButtonDisabled]}
                    onPress={handleSavePreferences}
                    disabled={isSavingPreferences}
                  >
                    {isSavingPreferences ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <TouchableOpacity
                style={styles.settingInfo}
                onPress={() => Alert.alert('Terms of Service', 'Coming soon.')}
              >
                <Text style={styles.settingLabel}>Terms of Service</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <TouchableOpacity
                style={styles.settingInfo}
                onPress={() => Alert.alert('Privacy Policy', 'Coming soon.')}
              >
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.statePickerContainer}>
          <View style={styles.statePickerHeader}>
            <TouchableOpacity onPress={() => setShowStatePicker(false)}>
              <Ionicons name="close" size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.statePickerTitle}>Select State</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView>
            {US_STATES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.stateOption,
                  selectedState === s && styles.stateOptionSelected,
                ]}
                onPress={() => {
                  setSelectedState(s);
                  setShowStatePicker(false);
                }}
              >
                <Text style={[
                  styles.stateOptionText,
                  selectedState === s && styles.stateOptionTextSelected,
                ]}>
                  {s}
                </Text>
                {selectedState === s && (
                  <Ionicons name="checkmark" size={20} color="#FF8C00" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}