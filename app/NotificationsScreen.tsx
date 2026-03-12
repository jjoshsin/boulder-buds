import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/NotificationsScreen.styles';
import * as SecureStore from 'expo-secure-store';
import notificationService, { Notification } from '../services/notificationService';

type NotificationsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NotificationsScreen() {
  const navigation = useNavigation<NotificationsNavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
    }

    // Navigate based on notification type
    if (notification.type === 'follow') {
      navigation.navigate('UserProfile', { userId: notification.actorId });
    } else if (notification.type === 'review_like' && notification.entityId) {
      // Navigate to gym detail (review is there)
      const review = await fetchReview(notification.entityId);
      if (review) {
        navigation.navigate('GymDetail', { gymId: review.gymId });
      }
    } else if (notification.type === 'video_like' || notification.type === 'video_comment') {
      if (notification.entityId) {
        navigation.navigate('VideoPlayer', { 
          videoId: notification.entityId,
          videos: [],
        });
      }
    } else if (notification.type === 'comment_reply' && notification.entityId) {
      navigation.navigate('VideoPlayer', { 
        videoId: notification.entityId,
        videos: [],
      });
    } else if (notification.type === 'new_review' && notification.entityId) {
      navigation.navigate('GymDetail', { gymId: notification.entityId });
    }
  };

  const fetchReview = async (reviewId: string) => {
    // Helper function to get review details
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`http://192.168.1.166:3000/reviews/${reviewId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    }
    return null;
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow': return '👤';
      case 'review_like': return '❤️';
      case 'video_like': return '❤️';
      case 'video_comment': return '💬';
      case 'comment_reply': return '↩️';
      case 'new_review': return '⭐';
      default: return '🔔';
    }
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
  <TouchableOpacity 
    style={styles.backButton}
    onPress={() => navigation.goBack()}
  >
    <Text style={styles.backButtonText}>←</Text>
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Notifications</Text>
  <View style={styles.rightAction}>
    {notifications.some(n => !n.read) ? (
      <TouchableOpacity onPress={handleMarkAllRead}>
        <Text style={styles.markAllRead}>Mark all read</Text>
      </TouchableOpacity>
    ) : (
      <View style={{ width: 40 }} />
    )}
  </View>
</View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadNotification,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationIcon}>
                <Text style={styles.iconText}>
                  {getNotificationIcon(notification.type)}
                </Text>
              </View>
              
              <View style={styles.notificationContent}>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {getTimeAgo(notification.createdAt)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteNotification(notification.id);
                }}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🔔</Text>
            <Text style={styles.emptyStateText}>No notifications yet</Text>
            <Text style={styles.emptyStateSubtext}>
              You'll see notifications here when people interact with your content
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}