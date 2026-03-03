import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/AllGymsScreen.styles';
import gymService, { Gym } from '../services/gymService';
import * as SecureStore from 'expo-secure-store';

type AllNearbyNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AllNearbyGymsScreen() {
  const navigation = useNavigation<AllNearbyNavigationProp>();
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
      
      const nearbyGyms = await gymService.getNearbyGyms(climbingType);
      setGyms(nearbyGyms);
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
        <Text style={styles.headerTitle}>Near You</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {gyms.map((gym) => (
          <TouchableOpacity
            key={gym.id}
            style={styles.nearbyCard}
            onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
          >
            <View style={styles.nearbyHeader}>
              <Text style={styles.nearbyName}>{gym.name}</Text>
              <Text style={styles.distance}>{gym.distance}</Text>
            </View>
            <View style={styles.nearbyMeta}>
              <Text style={styles.rating}>⭐ {gym.rating}</Text>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.tags}>
                {gym.city}{gym.state ? `, ${gym.state}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}