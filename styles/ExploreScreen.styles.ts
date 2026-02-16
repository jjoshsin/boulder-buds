import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearIcon: {
    fontSize: 20,
    color: '#6B7280',
    paddingLeft: 8,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#FF8C00',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  filtersPanel: {
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  gymCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  gymImage: {
    width: 100,
    height: 120,
  },
  placeholderImage: {
    width: 100,
    height: 120,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  gymInfo: {
    flex: 1,
    padding: 12,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  gymMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gymRating: {
    fontSize: 14,
    color: '#374151',
  },
  gymSeparator: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  gymReviews: {
    fontSize: 14,
    color: '#6B7280',
  },
  gymDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  gymBorough: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  amenityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityBadgeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  moreAmenities: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 40,
  },
mapToggleButton: {
  backgroundColor: '#FF8C00',
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
},
mapToggleText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#FFFFFF',
},
map: {
  flex: 1,
},
callout: {
  width: 200,
  padding: 12,
},
calloutName: {
  fontSize: 15,
  fontWeight: '700',
  color: '#1F2937',
  marginBottom: 4,
},
calloutLocation: {
  fontSize: 13,
  color: '#6B7280',
  marginBottom: 4,
},
calloutRating: {
  fontSize: 13,
  color: '#374151',
  marginBottom: 6,
},
calloutTap: {
  fontSize: 13,
  color: '#FF8C00',
  fontWeight: '600',
},
});