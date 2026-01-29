import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddGymPhotoScreen from './AddGymPhotoScreen';

export default function PostScreen() {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>➕</Text>
        <Text style={styles.title}>Add Content</Text>
        <Text style={styles.subtitle}>Share your gym experience</Text>

        {/* Add Gym Photos */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowPhotoUpload(true)}
        >
          <Text style={styles.actionIcon}>📸</Text>
          <Text style={styles.actionText}>Add Gym Photos</Text>
        </TouchableOpacity>

        {/* Add Review - Coming Soon */}
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
          <Text style={styles.actionIcon}>⭐</Text>
          <Text style={[styles.actionText, styles.actionTextDisabled]}>Write Review</Text>
          <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Upload Modal */}
      <Modal
        visible={showPhotoUpload}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AddGymPhotoScreen onClose={() => setShowPhotoUpload(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  actionTextDisabled: {
    color: '#9CA3AF',
  },
  comingSoonBadge: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
});