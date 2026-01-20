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
import { styles } from '../styles/SignUpScreen.styles';
import authService from '../services/authService';

interface WelcomeScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export default function WelcomeScreen({ onBack, onContinue }: WelcomeScreenProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [ageError, setAgeError] = useState('');

  // Animation values
  const titlePosition = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Step 1: Fade in title at top (aligned with button)
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Step 2: Wait a moment, then show form
      setTimeout(() => {
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
      }, 800);
    });
  };

  // Validation functions
  const validateEmail = (text: string) => {
    setEmail(text);
    if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  };

  const validateUsername = (text: string) => {
    setUsername(text);
    if (text && text.length < 3) {
      setUsernameError('Username must be at least 3 characters');
    } else {
      setUsernameError('');
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    if (text && text.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError('');
    }
    // Also revalidate confirm password if it's already filled
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    if (text && text !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateAge = (text: string) => {
    setAge(text);
    const ageNum = parseInt(text);
    if (text && (isNaN(ageNum) || ageNum < 13 || ageNum > 120)) {
      setAgeError('Please enter a valid age (13-120)');
    } else {
      setAgeError('');
    }
  };

  const handleContinue = async () => {
    // Clear previous errors
    setEmailError('');
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setAgeError('');

    // Validate all fields
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      hasError = true;
    }

    if (!username.trim()) {
      setUsernameError('Username is required');
      hasError = true;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (!age.trim()) {
      setAgeError('Age is required');
      hasError = true;
    } else {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        setAgeError('Please enter a valid age (13-120)');
        hasError = true;
      }
    }

    if (hasError) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Create account with email/password
      await authService.signUp(email, username, password, age);
      
      console.log('Account created successfully!');
      onContinue();
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Display server error as email error (likely duplicate email)
      setEmailError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* Header Row with Back Button and Title */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
            <Text style={styles.title}>Let's get Started</Text>
          </Animated.View>
        </View>

        <View style={styles.content}>

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
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, emailError && styles.inputError]}
                  value={email}
                  onChangeText={validateEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[styles.input, usernameError && styles.inputError]}
                  value={username}
                  onChangeText={validateUsername}
                  placeholder="climber123"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, passwordError && styles.inputError]}
                  value={password}
                  onChangeText={validatePassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#6B7280"
                  secureTextEntry
                  autoCapitalize="none"
                />
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, confirmPasswordError && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={validateConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor="#6B7280"
                  secureTextEntry
                  autoCapitalize="none"
                />
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
              </View>

              {/* Age Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={[styles.input, ageError && styles.inputError]}
                  value={age}
                  onChangeText={validateAge}
                  placeholder="18"
                  placeholderTextColor="#6B7280"
                  keyboardType="number-pad"
                />
                {ageError ? <Text style={styles.errorText}>{ageError}</Text> : null}
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!email || !username || !password || !confirmPassword || !age || isLoading) && styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!email || !username || !password || !confirmPassword || !age || isLoading}
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