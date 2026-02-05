import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/PeopleScreen.styles';
import * as SecureStore from 'expo-secure-store';

type PeopleNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
  id: string;
  displayName: string;
  email: string;
  climbingLevel?: string;
  borough?: string;
}

export default function PeopleScreen() {
  const navigation = useNavigation<PeopleNavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }

    try {
      setIsSearching(true);
      const token = await SecureStore.getItemAsync('authToken');

      const response = await fetch(
        `http://192.168.1.166:3000/users/search/query?q=${encodeURIComponent(query)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data);

        // Check following status for each user
        const statuses: { [key: string]: boolean } = {};
        await Promise.all(
          data.map(async (user: User) => {
            const statusRes = await fetch(
              `http://192.168.1.166:3000/follows/check/${user.id}`,
              {
                headers: { 'Authorization': `Bearer ${token}` },
              }
            );
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              statuses[user.id] = statusData.isFollowing;
            }
          })
        );
        setFollowingStatus(statuses);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const isFollowing = followingStatus[userId];

      const response = await fetch(
        `http://192.168.1.166:3000/follows/${userId}`,
        {
          method: isFollowing ? 'DELETE' : 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setFollowingStatus({
          ...followingStatus,
          [userId]: !isFollowing,
        });
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const renderUser = (user: User) => {
    const isFollowing = followingStatus[user.id];

    return (
      <TouchableOpacity
        key={user.id}
        style={styles.userCard}
        onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.displayName}</Text>
          <View style={styles.userMeta}>
            {user.climbingLevel && (
              <Text style={styles.userMetaText}>🧗 {user.climbingLevel}</Text>
            )}
            {user.borough && (
              <>
                {user.climbingLevel && <Text style={styles.userMetaSeparator}>•</Text>}
                <Text style={styles.userMetaText}>📍 {user.borough}</Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => handleFollowToggle(user.id)}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find People</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchUsers(text);
            }}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setUsers([]);
            }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8C00" />
          </View>
        ) : users.length > 0 ? (
          <>
            <Text style={styles.resultsCount}>
              {users.length} {users.length === 1 ? 'person' : 'people'} found
            </Text>
            {users.map(renderUser)}
          </>
        ) : searchQuery.trim().length >= 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🤷</Text>
            <Text style={styles.emptyStateText}>No users found</Text>
            <Text style={styles.emptyStateSubtext}>Try searching with a different name</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>👋</Text>
            <Text style={styles.emptyStateText}>Find Your Climbing Friends</Text>
            <Text style={styles.emptyStateSubtext}>
              Search for other climbers by name or email
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}