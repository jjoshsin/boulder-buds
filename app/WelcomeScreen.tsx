// ============================================
// FILE: app/WelcomeScreen.tsx
// ============================================
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/WelcomeScreen.styles';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome</Text>
      </View>
    </SafeAreaView>
  );
}