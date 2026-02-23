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
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingRight: 20,
  },
  popularCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  popularImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  placeholderText: {
    fontSize: 32,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  popularInfo: {
    padding: 12,
  },
  popularName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  tag: {
    fontSize: 12,
    color: '#FF8C00',
    fontWeight: '500',
  },
  nearbyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nearbyContent: {
    flex: 1,
  },
  nearbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nearbyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  distance: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  nearbyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tags: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  metaSeparator: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  activityCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  activityUser: {
    fontWeight: '600',
    color: '#1F2937',
  },
  activityGym: {
    fontWeight: '600',
    color: '#FF8C00',
  },
  activityRating: {
    fontSize: 14,
    marginBottom: 6,
  },
  activityReview: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityPhoto: {
  width: '100%',
  height: 200,
  borderRadius: 8,
  marginVertical: 8,
  },
  emptyActivityContainer: {
  alignItems: 'center',
  paddingVertical: 40,
  backgroundColor: '#F9FAFB',
  borderRadius: 12,
  marginTop: 8,
  },
  emptyActivityEmoji: {
  fontSize: 48,
  marginBottom: 12,
  },
  emptyActivityText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#374151',
  marginBottom: 4,
  },
  emptyActivitySubtext: {
  fontSize: 14,
  color: '#9CA3AF',
  textAlign: 'center',
  paddingHorizontal: 20,
  },
  activityTags: {
  flexDirection: 'row',
  gap: 6,
  marginTop: 8,
},
activityTag: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  backgroundColor: '#F3F4F6',
  borderRadius: 10,
},
activityTagText: {
  fontSize: 11,
  fontWeight: '500',
  color: '#6B7280',
},
});