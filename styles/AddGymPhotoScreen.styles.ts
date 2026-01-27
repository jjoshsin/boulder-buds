import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    fontSize: 28,
    color: '#6B7280',
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 20,
  },
  gymScroll: {
    marginBottom: 20,
  },
  gymChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  gymChipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF8C00',
  },
  gymChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  gymChipTextSelected: {
    color: '#FF8C00',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  imagePreview: {
    width: 150,
    height: 150,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  uploadButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});