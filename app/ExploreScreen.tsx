import React, { useState, useEffect, useRef } from 'react';
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
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

type ExploreNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ExploreScreen() {
  const navigation = useNavigation<ExploreNavigationProp>();
  const mapRef = useRef<MapView>(null);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Filter states
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'nearest' | 'rating' | 'reviews'>('nearest');

  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

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
  }, [searchQuery, selectedState, selectedPriceRange, selectedAmenities, sortBy, gyms]);

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

    if (searchQuery.trim()) {
      results = results.filter(gym =>
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.state?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedState) {
      results = results.filter(gym => gym.state === selectedState);
    }

    if (selectedPriceRange) {
      results = results.filter(gym => gym.priceRange === selectedPriceRange);
    }

    if (selectedAmenities.length > 0) {
      results = results.filter(gym =>
        selectedAmenities.every(amenity => gym.amenities?.includes(amenity))
      );
    }

    results.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviews':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'nearest':
        default:
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
    setSelectedState(null);
    setSelectedPriceRange(null);
    setSelectedAmenities([]);
    setSortBy('nearest');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedState) count++;
    if (selectedPriceRange) count++;
    if (selectedAmenities.length > 0) count++;
    return count;
  };

  const getMapRegion = () => {
    const gymsWithCoords = filteredGyms.filter(g => g.latitude && g.longitude);
    if (gymsWithCoords.length === 0) {
      return {
        latitude: 39.8283,
        longitude: -98.5795,
        latitudeDelta: 30,
        longitudeDelta: 30,
      };
    }

    const lats = gymsWithCoords.map(g => g.latitude!);
    const lngs = gymsWithCoords.map(g => g.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.1),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.1),
    };
  };

  const handleMarkerPress = (gym: Gym) => {
    if (mapRef.current && gym.latitude && gym.longitude) {
      mapRef.current.animateToRegion({
        latitude: gym.latitude,
        longitude: gym.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
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
          <Ionicons name="image-outline" size={32} color="#9CA3AF" />
        </View>
      )}

      <View style={styles.gymInfo}>
        <Text style={styles.gymName} numberOfLines={1}>
          {gym.name}
        </Text>

        <View style={styles.gymMeta}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome name="star" size={12} color="#FF8C00" />
            <Text style={[styles.gymRating, { marginLeft: 3 }]}>
              {gym.rating ? gym.rating.toFixed(1) : 'New'}
            </Text>
          </View>
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

        <Text style={styles.gymBorough}>
          {gym.city}{gym.state ? `, ${gym.state}` : ''}
        </Text>

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

  const renderMapView = () => (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={getMapRegion()}
      showsUserLocation
      showsMyLocationButton
    >
      {filteredGyms
        .filter(gym => gym.latitude && gym.longitude)
        .map(gym => (
          <Marker
            key={gym.id}
            coordinate={{
              latitude: gym.latitude!,
              longitude: gym.longitude!,
            }}
            pinColor="#FF8C00"
            onPress={() => handleMarkerPress(gym)}
          >
            <Callout
              onPress={() => navigation.navigate('GymDetail', { gymId: gym.id })}
            >
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{gym.name}</Text>
                <Text style={styles.calloutLocation}>
                  {gym.city}{gym.state ? `, ${gym.state}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome name="star" size={12} color="#FF8C00" />
                  <Text style={[styles.calloutRating, { marginLeft: 3 }]}>
                    {gym.rating ? gym.rating.toFixed(1) : 'New'} • {gym.reviewCount || 0} reviews
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text style={styles.calloutTap}>Tap to view </Text>
                  <Ionicons name="arrow-forward" size={12} color="#FF8C00" />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
    </MapView>
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
        
        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[
              styles.toggleButtonText,
              viewMode === 'list' && styles.toggleButtonTextActive,
            ]}>
              List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'map' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[
              styles.toggleButtonText,
              viewMode === 'map' && styles.toggleButtonTextActive,
            ]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search gyms, cities, states..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map View */}
      {viewMode === 'map' ? (
        renderMapView()
      ) : (
        <>
          {/* Filter & Sort Bar */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="tune" size={16} color="#374151" />
                <Text style={[styles.filterButtonText, { marginLeft: 4 }]}>
                  Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                </Text>
              </View>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'nearest' && styles.sortButtonActive]}
                onPress={() => setSortBy('nearest')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={14} color={sortBy === 'nearest' ? '#FFFFFF' : '#374151'} />
                  <Text style={[styles.sortButtonText, sortBy === 'nearest' && styles.sortButtonTextActive, { marginLeft: 3 }]}>
                    Nearest
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
                onPress={() => setSortBy('rating')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome name="star" size={12} color={sortBy === 'rating' ? '#FFFFFF' : '#374151'} />
                  <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive, { marginLeft: 3 }]}>
                    Rating
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'reviews' && styles.sortButtonActive]}
                onPress={() => setSortBy('reviews')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="chatbubble-outline" size={13} color={sortBy === 'reviews' ? '#FFFFFF' : '#374151'} />
                  <Text style={[styles.sortButtonText, sortBy === 'reviews' && styles.sortButtonTextActive, { marginLeft: 3 }]}>
                    Reviews
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Filters Panel */}
          {showFilters && (
            <ScrollView style={styles.filtersPanel}>
              {/* State Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>State</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterOptions}>
                    {usStates.map(state => (
                      <TouchableOpacity
                        key={state}
                        style={[
                          styles.filterChip,
                          selectedState === state && styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setSelectedState(selectedState === state ? null : state)
                        }
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedState === state && styles.filterChipTextActive,
                        ]}>
                          {state}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
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
                      <Text style={[
                        styles.filterChipText,
                        selectedPriceRange === price.value && styles.filterChipTextActive,
                      ]}>
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
                      <Text style={[
                        styles.filterChipText,
                        selectedAmenities.includes(amenity) && styles.filterChipTextActive,
                      ]}>
                        {amenity.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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
                <MaterialCommunityIcons name="emoticon-confused-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noResultsText}>No gyms found</Text>
                <Text style={styles.noResultsSubtext}>Try adjusting your filters</Text>
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}