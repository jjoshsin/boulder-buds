import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/AllGymsScreen.styles';
import gymService, { Gym } from '../services/gymService';
import * as SecureStore from 'expo-secure-store';

type AllPopularNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AllPopularGymsScreen() {
  const navigation = useNavigation<AllPopularNavigationProp>();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    try {
      setIsLoading(true);
      const userStr = await SecureStore.getItemAsync('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const climbingType = user?.climbingType || null;
      
      const popularGyms = await gymService.getPopularGyms(climbingType);
      setGyms(popularGyms);
    } catch (error) {
      console.error('Error loading gyms:', error);
    } finally {
      setIsLoading(false);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Popular This Week</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {gyms.map((gym) => (
          <TouchableOpacity
            key={gym.id}
            style={styles.gymCard}
            onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
          >
            <View style={styles.gymImage}>
              {gym.officialPhotos && gym.officialPhotos.length > 0 ? (
                <Image
                  source={{ uri: gym.officialPhotos[0] }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>🏔️</Text>
                </View>
              )}
            </View>
            <View style={styles.gymInfo}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <Text style={styles.gymLocation}>
                {gym.city}{gym.state ? `, ${gym.state}` : ''}
              </Text>
              <View style={styles.ratingRow}>
                {gym.rating && gym.rating > 0 ? (
                  <>
                    <Text style={styles.rating}>⭐ {gym.rating}</Text>
                    <Text style={styles.reviewCount}>({gym.reviewCount} reviews)</Text>
                  </>
                ) : (
                  <Text style={styles.reviewCount}>No reviews yet</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}