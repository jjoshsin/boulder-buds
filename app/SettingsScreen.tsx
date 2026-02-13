import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/SettingsScreen.styles';
import * as SecureStore from 'expo-secure-store';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  climbingType?: string;
  borough?: string;
}

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();

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
  const [selectedBorough, setSelectedBorough] = useState('');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
  const climbingTypes = [
    { value: 'bouldering', label: '🧗 Bouldering' },
    { value: 'rope', label: '🪢 Rope' },
    { value: 'both', label: '🏔️ Both' },
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
        setSelectedBorough(userData.borough || '');
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
          borough: selectedBorough,
        }),
      });

      if (response.ok) {
        const updatedUser = {
          ...user!,
          climbingType: selectedClimbingType,
          borough: selectedBorough,
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
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available soon.'),
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
          <Text style={styles.backButton}>←</Text>
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
              onPress={() => {
                setIsEditingName(!isEditingName);
              }}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Display Name</Text>
                <Text style={styles.settingValue}>{user?.displayName}</Text>
              </View>
              <Text style={styles.chevron}>
                {isEditingName ? '▲' : '▼'}
              </Text>
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
              <Text style={styles.chevron}>
                {isEditingPreferences ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {!isEditingPreferences && (
              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Borough</Text>
                  <Text style={styles.settingValue}>
                    {user?.borough || 'Not set'}
                  </Text>
                </View>
              </View>
            )}

            {isEditingPreferences && (
              <View style={styles.editContainer}>
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
                      <Text style={[
                        styles.chipText,
                        selectedClimbingType === type.value && styles.chipTextActive,
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.editSectionLabel, styles.inputSpacing]}>Borough</Text>
                <View style={styles.chipContainer}>
                  {boroughs.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.chip,
                        selectedBorough === b && styles.chipActive,
                      ]}
                      onPress={() => setSelectedBorough(b)}
                    >
                      <Text style={[
                        styles.chipText,
                        selectedBorough === b && styles.chipTextActive,
                      ]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditingPreferences(false);
                      setSelectedClimbingType(user?.climbingType || '');
                      setSelectedBorough(user?.borough || '');
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
              <Text style={styles.chevron}>›</Text>
            </View>
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <TouchableOpacity
                style={styles.settingInfo}
                onPress={() => Alert.alert('Privacy Policy', 'Coming soon.')}
              >
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.chevron}>›</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}