// ============================================
// FILE: app/WelcomeScreen.tsx
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/WelcomeScreen.styles';
import authService from '../services/authService';

export default function WelcomeScreen() {
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const titlePosition = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Step 1: Fade in title in center
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Step 2: Wait a moment, then slide up
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(titlePosition, {
            toValue: -200, // Move up
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Step 3: Show form after title is at top
          setShowForm(true);
          Animated.parallel([
            Animated.timing(formOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(formTranslateY, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, 800);
    });
  };

  const handleContinue = async () => {
    if (!username.trim() || !birthday.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get stored user data
      const user = await authService.getStoredUser();
      if (!user) {
        Alert.alert('Error', 'User not found. Please sign in again.');
        return;
      }

      // Update user profile
      await authService.updateUserProfile(user.id, username, birthday);
      
      console.log('Profile updated successfully!');
      // TODO: Navigate to main app (Gym List screen)
      
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Animated Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titlePosition }],
              },
            ]}
          >
            <Text style={styles.title}>Let's get Started!</Text>
          </Animated.View>

          {/* Form */}
          {showForm && (
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                },
              ]}
            >
              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enter Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="climber123"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Birthday Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enter Birthday</Text>
                <TextInput
                  style={styles.input}
                  value={birthday}
                  onChangeText={setBirthday}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#6B7280"
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!username || !birthday || isLoading) && styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!username || !birthday || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}