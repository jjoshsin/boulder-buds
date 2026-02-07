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
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  },
  avatarContainer: {
  position: 'relative',
  marginRight: 16,
  },
  avatar: {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: '#FF8C00',
  justifyContent: 'center',
  alignItems: 'center',
  },
  avatarImage: {
  width: 64,
  height: 64,
  borderRadius: 32,
  },
  avatarText: {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#FFFFFF',
  },
  uploadPhotoButton: {
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#FF8C00',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#FFFFFF',
  },
  uploadPhotoIcon: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#FFFFFF',
  marginTop: -2,
    },
  userInfo: {
  flex: 1,
  },
  userName: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  detailsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  detailChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF8C00',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FF8C00',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewGymInfo: {
    flex: 1,
  },
  reviewGymName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  reviewGymBorough: {
    fontSize: 13,
    color: '#6B7280',
  },
  reviewRating: {
    fontSize: 16,
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
    marginBottom: 12,
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
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  reviewActionDelete: {
    color: '#EF4444',
  },
  reviewActionSeparator: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  photoCard: {
    width: '31.33%',
    aspectRatio: 1,
    marginHorizontal: '1%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  photoGymName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});