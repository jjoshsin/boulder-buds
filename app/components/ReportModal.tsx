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
} from 'react-native';
import { styles } from '../../styles/ReportModal.styles';
import reportingService from '../../services/reportingService';

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
            <Text style={styles.closeButton}>✕</Text>
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