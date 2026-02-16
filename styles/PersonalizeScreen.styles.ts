import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionCardSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF8C00',
  },
  optionEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#FF8C00',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  optionRadioSelected: {
    borderColor: '#FF8C00',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8C00',
  },
  continueButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});