import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../styles/LoginScreen.styles';
import authService from '../services/authService';

type AuthProvider = 'apple' | 'google';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoadingProvider('apple');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send to backend
      if (credential.identityToken) {
        const response = await authService.signInWithApple(
          credential.identityToken,
          credential.user
        );
        
        console.log('Login successful:', response.user);
        onLoginSuccess();
      }
      
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled
      } else {
        console.error('Apple Sign In Error:', e);
        Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoadingProvider('google');

      // TODO: Integrate @react-native-google-signin/google-signin
      // For now, simulate with a mock token
      // In production, you'd get the real idToken from Google SDK
      
      Alert.alert(
        'Google Sign In',
        'Google Sign In coming soon! Use Apple Sign In for now.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Google Sign In Error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

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

          {/* Auth Buttons */}
          <View style={styles.authSection}>
            {/* Sign in with Apple */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={16}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign in with Google */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {loadingProvider === 'google' ? (
                <ActivityIndicator color="#1F2937" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>✉️</Text>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to Boulder Buds'{'\n'}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Footer */}
          <Text style={styles.footer}>
            NYC's climbing community starts here 🧗‍♀️
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}