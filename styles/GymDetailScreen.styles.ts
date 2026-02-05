import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

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
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 24,
    color: '#1F2937',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    fontSize: 24,
    color: '#1F2937',
  },
  photoGallery: {
    height: 300,
    backgroundColor: '#F3F4F6',
  },
  galleryImage: {
    width: width,
    height: 300,
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
infoSection: {
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
},
gymName: {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#1F2937',
  marginBottom: 8,
},
ratingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
},
rating: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1F2937',
  marginRight: 6,
},
reviewCount: {
  fontSize: 15,
  color: '#6B7280',
  marginRight: 8,
},
separator: {
  fontSize: 15,
  color: '#D1D5DB',
  marginHorizontal: 8,
},
priceRange: {
  fontSize: 15,
  color: '#10B981',
  fontWeight: '600',
},
addressRow: {
  marginBottom: 16,
  marginLeft: 20,
},
addressInfo: {
  flex: 1,
},
address: {
  fontSize: 15,
  color: '#374151',
  marginBottom: 2,
},
borough: {
  fontSize: 14,
  color: '#6B7280',
},
climbingTypes: {
  flexDirection: 'row',
  marginBottom: 16,
  marginLeft: 20,
},
typeChip: {
  backgroundColor: '#FEF3C7',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  marginRight: 8,
},
typeChipText: {
  fontSize: 13,
  color: '#92400E',
  fontWeight: '600',
},
actionButtons: {
  flexDirection: 'row',
  gap: 12,
  marginLeft: 20,

},
primaryButton: {
  flex: 1,
  backgroundColor: '#FF8C00',
  paddingVertical: 10,    // Made smaller (was 12)
  paddingHorizontal: 12,  // Add horizontal padding
  borderRadius: 10,       // Smaller border radius
  alignItems: 'center',
},
primaryButtonText: {
  fontSize: 14,           // Smaller font (was 15)
  fontWeight: '600',
  color: '#FFFFFF',
},
secondaryButton: {
  flex: 1,
  backgroundColor: '#F3F4F6',
  paddingVertical: 10,    // Made smaller (was 12)
  paddingHorizontal: 12,  // Add horizontal padding
  borderRadius: 10,       // Smaller border radius
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
secondaryButtonText: {
  fontSize: 14,           // Smaller font (was 15)
  fontWeight: '600',
  color: '#374151',
},
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 15,
    color: '#FF8C00',
    fontWeight: '600',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  amenityItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  amenityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  amenityText: {
    fontSize: 15,
    color: '#374151',
  },
  communityPhotoItem: {
    marginRight: 12,
  },
  communityPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 6,
  },
  communityPhotoUser: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  reviewRating: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reviewTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  reviewTagText: {
    fontSize: 12,
    color: '#3730A3',
    fontWeight: '500',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noReviewsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 40,
  },
  reviewRatingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  },
  reviewOptionsButton: {
  marginLeft: 8,
  padding: 4,
  },
  reviewOptionsText: {
  fontSize: 20,
  color: '#6B7280',
  },
});