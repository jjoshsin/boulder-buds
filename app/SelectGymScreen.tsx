import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/SelectGymScreen.styles';
import gymService, { Gym } from '../services/gymService';

interface SelectGymScreenProps {
  onClose: () => void;
  onSelectGym: (gymId: string, gymName: string) => void;
}

export default function SelectGymScreen({ onClose, onSelectGym }: SelectGymScreenProps) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGyms();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = gyms.filter(gym =>
        gym.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGyms(filtered);
    } else {
      setFilteredGyms(gyms);
    }
  }, [searchQuery, gyms]);

  const loadGyms = async () => {
    try {
      setIsLoading(true);
      const allGyms = await gymService.getAllGyms();
      setGyms(allGyms);
      setFilteredGyms(allGyms);
    } catch (error) {
      console.error('Error loading gyms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Gym</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search gyms..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Gym List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredGyms.length > 0 ? (
            filteredGyms.map((gym) => (
              <TouchableOpacity
                key={gym.id}
                style={styles.gymCard}
                onPress={() => onSelectGym(gym.id, gym.name)}
              >
                <View style={styles.gymInfo}>
                  <Text style={styles.gymName}>{gym.name}</Text>
                  <Text style={styles.gymAddress}>{gym.borough}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No gyms found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}