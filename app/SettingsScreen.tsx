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
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/SettingsScreen.styles';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  climbingType?: string;
  city?: string;
  state?: string;
}

interface BlockedUser {
  id: string;
  displayName: string;
  profilePhoto?: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const API = 'http://192.168.1.166:3000';

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { onLogout } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Account ──────────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // Change password
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // ── Preferences ──────────────────────────────────────────
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [selectedClimbingType, setSelectedClimbingType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // ── Privacy ──────────────────────────────────────────────
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);

  // ── Notifications ─────────────────────────────────────────
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifReviewLikes, setNotifReviewLikes] = useState(true);
  const [notifNewReviews, setNotifNewReviews] = useState(true);

  const climbingTypes: { value: string; label: string; icon: string }[] = [
    { value: 'bouldering', label: 'Bouldering', icon: 'hiking' },
    { value: 'rope',       label: 'Rope',       icon: 'carabiner' },
    { value: 'both',       label: 'Both',       icon: 'terrain' },
  ];

  useEffect(() => {
    loadUser();
    loadLocalPrefs();
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

  const loadLocalPrefs = async () => {
    try {
      const prefs = await SecureStore.getItemAsync('notificationPrefs');
      if (prefs) {
        const p = JSON.parse(prefs);
        setNotifFollows(p.follows ?? true);
        setNotifReviewLikes(p.reviewLikes ?? true);
        setNotifNewReviews(p.newReviews ?? true);
      }
      const privacy = await SecureStore.getItemAsync('privacyPrefs');
      if (privacy) {
        const p = JSON.parse(privacy);
        setPrivateProfile(p.privateProfile ?? false);
      }
    } catch {}
  };

  const saveNotifPrefs = async (key: string, value: boolean) => {
    const current = {
      follows: notifFollows,
      reviewLikes: notifReviewLikes,
      newReviews: notifNewReviews,
      [key]: value,
    };
    await SecureStore.setItemAsync('notificationPrefs', JSON.stringify(current));
  };

  const savePrivacyPrefs = async (privateProfile: boolean) => {
    await SecureStore.setItemAsync('privacyPrefs', JSON.stringify({ privateProfile }));
  };

  // ── Handlers ─────────────────────────────────────────────

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) { setNameError('Display name cannot be empty'); return; }
    if (newDisplayName.trim().length < 2) { setNameError('Must be at least 2 characters'); return; }
    setNameError('');
    try {
      setIsSavingName(true);
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`${API}/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ displayName: newDisplayName.trim() }),
      });
      if (response.ok) {
        const updatedUser = { ...user!, displayName: newDisplayName.trim() };
        setUser(updatedUser);
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setIsEditingName(false);
        Alert.alert('Success', 'Display name updated!');
      } else { throw new Error(); }
    } catch { Alert.alert('Error', 'Failed to update display name'); }
    finally { setIsSavingName(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required'); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match'); return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters'); return;
    }
    setPasswordError('');
    try {
      setIsSavingPassword(true);
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`${API}/users/me/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (response.ok) {
        setIsChangingPassword(false);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        Alert.alert('Success', 'Password updated!');
      } else {
        const data = await response.json();
        setPasswordError(data.message || 'Incorrect current password');
      }
    } catch { setPasswordError('Failed to update password'); }
    finally { setIsSavingPassword(false); }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`${API}/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ climbingType: selectedClimbingType, city: selectedCity.trim(), state: selectedState }),
      });
      if (response.ok) {
        const updatedUser = { ...user!, climbingType: selectedClimbingType, city: selectedCity.trim(), state: selectedState };
        setUser(updatedUser);
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setIsEditingPreferences(false);
        Alert.alert('Success', 'Preferences updated!');
      } else { throw new Error(); }
    } catch { Alert.alert('Error', 'Failed to update preferences'); }
    finally { setIsSavingPreferences(false); }
  };

  const loadBlockedUsers = async () => {
    try {
      setIsLoadingBlocked(true);
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`${API}/users/me/blocked`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) setBlockedUsers(await response.json());
    } catch { Alert.alert('Error', 'Failed to load blocked users'); }
    finally { setIsLoadingBlocked(false); }
  };

  const handleUnblock = async (blockedId: string, name: string) => {
    Alert.alert('Unblock', `Unblock ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync('authToken');
            await fetch(`${API}/users/me/blocked/${blockedId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            });
            setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
          } catch { Alert.alert('Error', 'Failed to unblock user'); }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile, reviews, and all activity. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('authToken');
              const response = await fetch(`${API}/users/${user?.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (response.ok) {
                await SecureStore.deleteItemAsync('authToken');
                await SecureStore.deleteItemAsync('user');
                if (onLogout) onLogout();
              } else { throw new Error(); }
            } catch { Alert.alert('Error', 'Failed to delete account. Please try again.'); }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  const handleReportBug = () => {
    Alert.alert(
      'Report a Bug',
      'To report a bug or send feedback, please email us at support@boulderbuds.app',
      [{ text: 'OK' }]
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {/* Display Name */}
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow} onPress={() => setIsEditingName(!isEditingName)}>
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
                  onChangeText={t => { setNewDisplayName(t); if (t.trim()) setNameError(''); }}
                  placeholder="Enter new display name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsEditingName(false); setNewDisplayName(user?.displayName || ''); setNameError(''); }}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveButton, isSavingName && styles.saveButtonDisabled]} onPress={handleSaveDisplayName} disabled={isSavingName}>
                    {isSavingName ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Change Password */}
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow} onPress={() => setIsChangingPassword(!isChangingPassword)}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Change Password</Text>
              </View>
              <Ionicons name={isChangingPassword ? 'chevron-up' : 'chevron-forward'} size={18} color="#6B7280" />
            </TouchableOpacity>
            {isChangingPassword && (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={t => { setCurrentPassword(t); setPasswordError(''); }}
                  placeholder="Current password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={t => { setNewPassword(t); setPasswordError(''); }}
                  placeholder="New password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={t => { setConfirmPassword(t); setPasswordError(''); }}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsChangingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveButton, isSavingPassword && styles.saveButtonDisabled]} onPress={handleChangePassword} disabled={isSavingPassword}>
                    {isSavingPassword ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Log Out */}
          <TouchableOpacity style={styles.settingCard} onPress={handleLogout}>
            <View style={[styles.settingRow]}>
              <Text style={[styles.settingLabel, { color: '#FF8C00' }]}>Log Out</Text>
              <Ionicons name="log-out-outline" size={20} color="#FF8C00" />
            </View>
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity style={[styles.settingCard, styles.deleteCard]} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow} onPress={() => setIsEditingPreferences(!isEditingPreferences)}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Climbing Type</Text>
                <Text style={styles.settingValue}>
                  {user?.climbingType ? user.climbingType.charAt(0).toUpperCase() + user.climbingType.slice(1) : 'Not set'}
                </Text>
              </View>
              <Ionicons name={isEditingPreferences ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
            </TouchableOpacity>
            {!isEditingPreferences && (
              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Location</Text>
                  <Text style={styles.settingValue}>{user?.city && user?.state ? `${user.city}, ${user.state}` : 'Not set'}</Text>
                </View>
              </View>
            )}
            {isEditingPreferences && (
              <View style={styles.editContainer}>
                <Text style={styles.editSectionLabel}>Climbing Type</Text>
                <View style={styles.chipContainer}>
                  {climbingTypes.map(type => (
                    <TouchableOpacity key={type.value} style={[styles.chip, selectedClimbingType === type.value && styles.chipActive]} onPress={() => setSelectedClimbingType(type.value)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name={type.icon as any} size={14} color={selectedClimbingType === type.value ? '#FFFFFF' : '#374151'} />
                        <Text style={[styles.chipText, selectedClimbingType === type.value && styles.chipTextActive, { marginLeft: 4 }]}>{type.label}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.editSectionLabel, styles.inputSpacing]}>City</Text>
                <TextInput style={styles.input} value={selectedCity} onChangeText={setSelectedCity} placeholder="e.g., New York" placeholderTextColor="#9CA3AF" autoCapitalize="words" />
                <Text style={[styles.editSectionLabel, styles.inputSpacing]}>State</Text>
                <TouchableOpacity style={[styles.input, styles.stateSelector]} onPress={() => setShowStatePicker(true)}>
                  <Text style={selectedState ? styles.stateSelectorText : styles.statePlaceholder}>{selectedState || 'Select a state'}</Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsEditingPreferences(false); setSelectedClimbingType(user?.climbingType || ''); setSelectedCity(user?.city || ''); setSelectedState(user?.state || ''); }}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveButton, isSavingPreferences && styles.saveButtonDisabled]} onPress={handleSavePreferences} disabled={isSavingPreferences}>
                    {isSavingPreferences ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingCard}>
            {[
              { label: 'New Followers', value: notifFollows, key: 'follows', setter: setNotifFollows },
              { label: 'Review Likes', value: notifReviewLikes, key: 'reviewLikes', setter: setNotifReviewLikes },
              { label: 'New Reviews on Saved Gyms', value: notifNewReviews, key: 'newReviews', setter: setNotifNewReviews },
            ].map((item, i) => (
              <View key={item.key} style={[styles.settingRow, i > 0 && styles.settingRowBorder]}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Switch
                  value={item.value}
                  onValueChange={v => { item.setter(v); saveNotifPrefs(item.key, v); }}
                  trackColor={{ false: '#D1D5DB', true: '#FF8C00' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Privacy ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Private Profile</Text>
                <Text style={styles.settingValue}>Only followers can see your activity</Text>
              </View>
              <Switch
                value={privateProfile}
                onValueChange={v => { setPrivateProfile(v); savePrivacyPrefs(v); }}
                trackColor={{ false: '#D1D5DB', true: '#FF8C00' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <TouchableOpacity
              style={[styles.settingRow, styles.settingRowBorder]}
              onPress={() => { setShowBlockedModal(true); loadBlockedUsers(); }}
            >
              <Text style={styles.settingLabel}>Blocked Users</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Support ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow} onPress={handleReportBug}>
              <Text style={styles.settingLabel}>Report a Bug</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.statePickerContainer}>
          <View style={styles.statePickerHeader}>
            <TouchableOpacity onPress={() => setShowStatePicker(false)}>
              <Ionicons name="close" size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.statePickerTitle}>Select State</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView>
            {US_STATES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.stateOption, selectedState === s && styles.stateOptionSelected]}
                onPress={() => { setSelectedState(s); setShowStatePicker(false); }}
              >
                <Text style={[styles.stateOptionText, selectedState === s && styles.stateOptionTextSelected]}>{s}</Text>
                {selectedState === s && <Ionicons name="checkmark" size={20} color="#FF8C00" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Blocked Users Modal */}
      <Modal visible={showBlockedModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={styles.statePickerHeader}>
            <TouchableOpacity onPress={() => setShowBlockedModal(false)}>
              <Ionicons name="close" size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.statePickerTitle}>Blocked Users</Text>
            <View style={{ width: 40 }} />
          </View>

          {isLoadingBlocked ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FF8C00" />
            </View>
          ) : blockedUsers.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
              <Ionicons name="person-remove-outline" size={48} color="#D1D5DB" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16, textAlign: 'center' }}>No blocked users</Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>Users you block won't be able to see your profile or interact with you</Text>
            </View>
          ) : (
            <ScrollView>
              {blockedUsers.map(u => (
                <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  {u.profilePhoto ? (
                    <Image source={{ uri: u.profilePhoto }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 14 }} />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#9CA3AF' }}>{u.displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#1F2937' }}>{u.displayName}</Text>
                  <TouchableOpacity
                    onPress={() => handleUnblock(u.id, u.displayName)}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
