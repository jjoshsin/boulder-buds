import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/FollowListScreen.styles';
import * as SecureStore from 'expo-secure-store';

type FollowListNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
  id: string;
  displayName: string;
  climbingLevel?: string;
  borough?: string;
}

export default function FollowListScreen() {
  const route = useRoute();
  const navigation = useNavigation<FollowListNavigationProp>();
  const { userId, tab } = route.params as { userId: string; tab: 'followers' | 'following' };

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(tab);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFollowData();
  }, []);

  const loadFollowData = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('authToken');

      const [followersRes, followingRes] = await Promise.all([
        fetch(`http://192.168.1.166:3000/users/${userId}/followers`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://192.168.1.166:3000/users/${userId}/following`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (followersRes.ok) {
        const followersData = await followersRes.json();
        setFollowers(followersData);
      }

      if (followingRes.ok) {
        const followingData = await followingRes.json();
        setFollowing(followingData);
      }
    } catch (error) {
      console.error('Error loading follow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUser = (user: User) => (
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

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Connections</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
            Followers ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Following ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'followers' ? (
          followers.length > 0 ? (
            followers.map(renderUser)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>👥</Text>
              <Text style={styles.emptyStateText}>No followers yet</Text>
            </View>
          )
        ) : (
          following.length > 0 ? (
            following.map(renderUser)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>👥</Text>
              <Text style={styles.emptyStateText}>Not following anyone yet</Text>
            </View>
          )
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}