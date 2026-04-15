import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/LoginScreen.styles';
import authService from '../services/authService';

type LoginNav = NativeStackNavigationProp<RootStackParamList>;

interface LoginScreenProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onBack, onLoginSuccess }: LoginScreenProps) {
  const navigation = useNavigation<LoginNav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Track touched fields
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
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

  const validatePassword = (text: string) => {
    setPassword(text);
    if (!text) {
      setPasswordError('Password is required');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    // Mark all fields as touched
    setTouchedFields({
      email: true,
      password: true,
    });

    // Validate
    validateEmail(email);
    validatePassword(password);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return;
    }

    try {
      setIsLoading(true);
      
      await authService.login(email, password);
      
      console.log('Login successful!');
      onLoginSuccess();
      
    } catch (error: any) {
      console.error('Login error:', error);
      // Show error under password field
      setPasswordError(error.message || 'Invalid email or password');
      setTouchedFields(prev => ({ ...prev, password: true }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log In</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome back!</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, touchedFields.email && emailError && styles.inputError]}
              value={email}
              onChangeText={validateEmail}
              onBlur={() => {
                setTouchedFields(prev => ({ ...prev, email: true }));
                validateEmail(email);
              }}
              placeholder="you@example.com"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            {touchedFields.email && emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, touchedFields.password && passwordError && styles.inputError]}
              value={password}
              onChangeText={validatePassword}
              onBlur={() => {
                setTouchedFields(prev => ({ ...prev, password: true }));
                validatePassword(password);
              }}
              placeholder="Enter your password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              autoCapitalize="none"
            />
            {touchedFields.password && passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 }}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, color: '#FF8C00', fontWeight: '600' }}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              (!email || !password || isLoading) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!email || !password || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}