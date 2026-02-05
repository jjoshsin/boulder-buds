import React, { useState, useEffect } from 'react';
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
import { styles } from '../styles/ExploreScreen.styles';
import gymService, { Gym } from '../services/gymService';

type ExploreNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ExploreScreen() {
  const navigation = useNavigation<ExploreNavigationProp>();

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedBorough, setSelectedBorough] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'nearest' | 'rating' | 'reviews'>('nearest');

  const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
  const priceRanges = [
    { value: 1, label: '$' },
    { value: 2, label: '$$' },
    { value: 3, label: '$$$' },
  ];
  const amenities = [
    'kilter_board',
    'moon_board',
    'spray_wall',
    'training_area',
    'cafe',
    'showers',
    'parking',
    'yoga',
  ];

  useEffect(() => {
    fetchGyms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedBorough, selectedPriceRange, selectedAmenities, sortBy, gyms]);

  const fetchGyms = async () => {
    try {
      setIsLoading(true);
      const allGyms = await gymService.getAllGyms();
      setGyms(allGyms);
    } catch (error) {
      console.error('Error fetching gyms:', error);
      Alert.alert('Error', 'Failed to load gyms');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let results = [...gyms];

    // Search filter
    if (searchQuery.trim()) {
      results = results.filter(gym =>
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Borough filter
    if (selectedBorough) {
      results = results.filter(gym => gym.borough === selectedBorough);
    }

    // Price range filter
    if (selectedPriceRange) {
      results = results.filter(gym => gym.priceRange === selectedPriceRange);
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      results = results.filter(gym =>
        selectedAmenities.every(amenity =>
          gym.amenities?.includes(amenity)
        )
      );
    }

    // Sorting
    results.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviews':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'nearest':
        default:
          // Parse distance strings like "2.3 mi"
          const distA = parseFloat(a.distance?.replace(' mi', '') || '999');
          const distB = parseFloat(b.distance?.replace(' mi', '') || '999');
          return distA - distB;
      }
    });

    setFilteredGyms(results);
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const clearFilters = () => {
    setSelectedBorough(null);
    setSelectedPriceRange(null);
    setSelectedAmenities([]);
    setSortBy('nearest');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedBorough) count++;
    if (selectedPriceRange) count++;
    if (selectedAmenities.length > 0) count++;
    return count;
  };

  const renderGymCard = (gym: Gym) => (
    <TouchableOpacity
      key={gym.id}
      style={styles.gymCard}
      onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
    >
      {gym.officialPhotos && gym.officialPhotos.length > 0 ? (
        <Image
          source={{ uri: gym.officialPhotos[0] }}
          style={styles.gymImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>🏔️</Text>
        </View>
      )}

      <View style={styles.gymInfo}>
        <Text style={styles.gymName} numberOfLines={1}>
          {gym.name}
        </Text>

        <View style={styles.gymMeta}>
          <Text style={styles.gymRating}>
            ⭐ {gym.rating ? gym.rating.toFixed(1) : 'New'}
          </Text>
          <Text style={styles.gymSeparator}>•</Text>
          <Text style={styles.gymReviews}>
            {gym.reviewCount || 0} {gym.reviewCount === 1 ? 'review' : 'reviews'}
          </Text>
          {gym.distance && (
            <>
              <Text style={styles.gymSeparator}>•</Text>
              <Text style={styles.gymDistance}>{gym.distance}</Text>
            </>
          )}
        </View>

        <Text style={styles.gymBorough}>{gym.borough}</Text>

        {gym.amenities && gym.amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {gym.amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityBadge}>
                <Text style={styles.amenityBadgeText}>
                  {amenity.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
            {gym.amenities.length > 3 && (
              <Text style={styles.moreAmenities}>+{gym.amenities.length - 3}</Text>
            )}
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>Explore Gyms</Text>
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

      {/* Filter & Sort Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>
            🎛️ Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'nearest' && styles.sortButtonActive]}
            onPress={() => setSortBy('nearest')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'nearest' && styles.sortButtonTextActive]}>
              📍 Nearest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
            onPress={() => setSortBy('rating')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
              ⭐ Rating
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'reviews' && styles.sortButtonActive]}
            onPress={() => setSortBy('reviews')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'reviews' && styles.sortButtonTextActive]}>
              💬 Reviews
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <ScrollView style={styles.filtersPanel}>
          {/* Borough Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Borough</Text>
            <View style={styles.filterOptions}>
              {boroughs.map(borough => (
                <TouchableOpacity
                  key={borough}
                  style={[
                    styles.filterChip,
                    selectedBorough === borough && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSelectedBorough(selectedBorough === borough ? null : borough)
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedBorough === borough && styles.filterChipTextActive,
                    ]}
                  >
                    {borough}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Price Range</Text>
            <View style={styles.filterOptions}>
              {priceRanges.map(price => (
                <TouchableOpacity
                  key={price.value}
                  style={[
                    styles.filterChip,
                    selectedPriceRange === price.value && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSelectedPriceRange(
                      selectedPriceRange === price.value ? null : price.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedPriceRange === price.value && styles.filterChipTextActive,
                    ]}
                  >
                    {price.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amenities Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Amenities</Text>
            <View style={styles.filterOptions}>
              {amenities.map(amenity => (
                <TouchableOpacity
                  key={amenity}
                  style={[
                    styles.filterChip,
                    selectedAmenities.includes(amenity) && styles.filterChipActive,
                  ]}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedAmenities.includes(amenity) && styles.filterChipTextActive,
                    ]}
                  >
                    {amenity.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Clear Filters */}
          {getActiveFilterCount() > 0 && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsCount}>
          {filteredGyms.length} {filteredGyms.length === 1 ? 'gym' : 'gyms'} found
        </Text>

        {filteredGyms.length > 0 ? (
          filteredGyms.map(renderGymCard)
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsEmoji}>🤷</Text>
            <Text style={styles.noResultsText}>No gyms found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your filters</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}