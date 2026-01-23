import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PostScreen() {
  return (
    <SafeAreaView style={styles2.container}>
      <View style={styles2.content}>
        <Text style={styles2.emoji}>➕</Text>
        <Text style={styles2.title}>Add Review</Text>
        <Text style={styles2.subtitle}>Share your gym experience</Text>
        <Text style={styles2.comingSoon}>Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  comingSoon: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});