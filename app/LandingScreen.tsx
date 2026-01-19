import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../styles/LandingScreen.styles';

interface LandingScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingScreen({ onGetStarted, onLogin }: LandingScreenProps) {
  return (
    <LinearGradient
      colors={['#FFFFFF', '#F9FAFB', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={['#FF8C00', '#CC6600']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <View style={styles.boulderIcon}>
                <View style={[styles.layer, { width: 40 }]} />
                <View style={[styles.layer, { width: 35 }]} />
                <View style={[styles.layer, { width: 30 }]} />
              </View>
            </LinearGradient>

            <Text style={styles.title}>Boulder Buds</Text>
            <Text style={styles.subtitle}>Find your next send in NYC</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {/* Get Started Button */}
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={onGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            NYC's climbing community starts here 🧗‍♀️
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}