import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import reportingService from '../../services/reportingService';
import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    fontSize: 28,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reasonOptionSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF8C00',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8C00',
  },
  reasonText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charCount: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 40,
  },
});

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: 'review' | 'video' | 'comment' | 'user';
  contentId?: string;
  reportedUserId?: string;
  reportedUserName?: string;
}

export default function ReportModal({
  visible,
  onClose,
  contentType,
  contentId,
  reportedUserId,
  reportedUserName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    { value: 'spam', label: 'Spam or misleading' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'false_info', label: 'False information' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    try {
      setIsSubmitting(true);

      await reportingService.reportContent({
        reportedUserId,
        contentType,
        contentId,
        reason: selectedReason as any,
        description: description.trim() || undefined,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it shortly.',
        [{ text: 'OK', onPress: () => {
          setSelectedReason('');
          setDescription('');
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentDescription = () => {
    switch (contentType) {
      case 'user':
        return `Report ${reportedUserName || 'this user'}`;
      case 'review':
        return 'Report this review';
      case 'video':
        return 'Report this video';
      case 'comment':
        return 'Report this comment';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getContentDescription()}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Why are you reporting this?</Text>

          {reasons.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonOption,
                selectedReason === reason.value && styles.reasonOptionSelected,
              ]}
              onPress={() => setSelectedReason(reason.value)}
            >
              <View style={styles.radioButton}>
                {selectedReason === reason.value && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={styles.reasonText}>{reason.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Additional details (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Please provide any additional context..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Reports are reviewed by our moderation team. False reports may result in action against your account.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}