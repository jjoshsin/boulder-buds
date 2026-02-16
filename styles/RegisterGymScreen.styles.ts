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
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addPhotoButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#F9FAFB',
  borderWidth: 2,
  borderColor: '#E5E7EB',
  borderStyle: 'dashed',
  borderRadius: 12,
  padding: 20,
},
addPhotoIcon: {
  fontSize: 28,
  marginRight: 12,
},
addPhotoText: {
  fontSize: 16,
  color: '#6B7280',
  fontWeight: '600',
},
imagesScroll: {
  marginTop: 12,
},
imagePreview: {
  marginRight: 12,
  position: 'relative',
},
previewImage: {
  width: 100,
  height: 100,
  borderRadius: 12,
},
removeImageButton: {
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: '#EF4444',
  width: 24,
  height: 24,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
},
removeImageText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: 'bold',
},
inputError: {
  borderColor: '#EF4444',
},
chipErrorBorder: {
  borderColor: '#EF4444',
},
errorText: {
  fontSize: 13,
  color: '#EF4444',
  marginTop: 6,
},
stateSelector: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
stateSelectorText: {
  fontSize: 16,
  color: '#1F2937',
},
statePlaceholder: {
  fontSize: 16,
  color: '#9CA3AF',
},
stateChevron: {
  fontSize: 14,
  color: '#6B7280',
},
statePickerContainer: {
  flex: 1,
  backgroundColor: '#FFFFFF',
},
statePickerHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
},
statePickerClose: {
  fontSize: 24,
  color: '#1F2937',
  width: 40,
},
statePickerTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1F2937',
},
stateOption: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
stateOptionSelected: {
  backgroundColor: '#FFF7ED',
},
stateOptionText: {
  fontSize: 16,
  color: '#1F2937',
},
stateOptionTextSelected: {
  color: '#FF8C00',
  fontWeight: '600',
},
stateCheckmark: {
  fontSize: 18,
  color: '#FF8C00',
},
});