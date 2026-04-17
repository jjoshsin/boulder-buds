import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [ageError, setAgeError] = useState('');

  const [touchedFields, setTouchedFields] = useState({
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
    age: false,
  });

  const validateEmail = (text: string) => {
    setEmail(text);
    if (!text) {
      setEmailError('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  };

  const validateUsername = (text: string) => {
    setUsername(text);
    if (!text) {
      setUsernameError('Username is required');
    } else if (text.length < 3) {
      setUsernameError('Username must be at least 3 characters');
    } else {
      setUsernameError('');
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    if (!text) {
      setPasswordError('Password is required');
    } else if (text.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError('');
    }
    if (confirmPassword) {
      setConfirmPasswordError(text !== confirmPassword ? 'Passwords do not match' : '');
    }
  };

  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    if (!text) {
      setConfirmPasswordError('Please confirm your password');
    } else if (text !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateAge = (text: string) => {
    setAge(text);
    if (!text) {
      setAgeError('Age is required');
    } else {
      const ageNum = parseInt(text);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        setAgeError('Please enter a valid age');
      } else {
        setAgeError('');
      }
    }
  };

  const handleContinue = async () => {
    setTouchedFields({ email: true, username: true, password: true, confirmPassword: true, age: true });

    validateEmail(email);
    validateUsername(username);
    validatePassword(password);
    validateConfirmPassword(confirmPassword);
    validateAge(age);

    const hasError =
      !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !username || username.length < 3 ||
      !password || password.length < 8 ||
      !confirmPassword || password !== confirmPassword ||
      !age || isNaN(parseInt(age)) || parseInt(age) < 13 || parseInt(age) > 120;

    if (hasError) return;

    try {
      setIsLoading(true);
      await authService.signUp(email, username, password, age);
      onContinue();
    } catch (error: any) {
      console.error('Sign up error:', error);
      setEmailError(error.message || 'Failed to create account. Please try again.');
      setTouchedFields(prev => ({ ...prev, email: true }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Let's get Started</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, touchedFields.email && emailError ? styles.inputError : null]}
                value={email}
                onChangeText={validateEmail}
                onBlur={() => { setTouchedFields(prev => ({ ...prev, email: true })); validateEmail(email); }}
                placeholder="you@example.com"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
              {touchedFields.email && emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, touchedFields.username && usernameError ? styles.inputError : null]}
                value={username}
                onChangeText={validateUsername}
                onBlur={() => { setTouchedFields(prev => ({ ...prev, username: true })); validateUsername(username); }}
                placeholder="climber123"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {touchedFields.username && usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, touchedFields.password && passwordError ? styles.inputError : null]}
                value={password}
                onChangeText={validatePassword}
                onBlur={() => { setTouchedFields(prev => ({ ...prev, password: true })); validatePassword(password); }}
                placeholder="At least 8 characters"
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
              />
              {touchedFields.password && passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, touchedFields.confirmPassword && confirmPasswordError ? styles.inputError : null]}
                value={confirmPassword}
                onChangeText={validateConfirmPassword}
                onBlur={() => { setTouchedFields(prev => ({ ...prev, confirmPassword: true })); validateConfirmPassword(confirmPassword); }}
                placeholder="Re-enter password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
              />
              {touchedFields.confirmPassword && confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={[styles.input, touchedFields.age && ageError ? styles.inputError : null]}
                value={age}
                onChangeText={validateAge}
                onBlur={() => { setTouchedFields(prev => ({ ...prev, age: true })); validateAge(age); }}
                placeholder="18"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
              />
              {touchedFields.age && ageError ? <Text style={styles.errorText}>{ageError}</Text> : null}
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
              {isLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.continueButtonText}>Continue</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
