import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<'email' | 'reset'>('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep('reset');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      Alert.alert(
        'Password Reset',
        'Your password has been updated. Please log in with your new password.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <TouchableOpacity
            onPress={() => step === 'reset' ? setStep('email') : navigation.goBack()}
            style={{ width: 40 }}
          >
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#1F2937' }}>
            Reset Password
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
          {step === 'email' ? (
            <>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 8 }}>
                Forgot your password?
              </Text>
              <Text style={{ fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 22 }}>
                Enter the email address you signed up with and we'll send you a 6-digit reset code.
              </Text>

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Email</Text>
              <TextInput
                style={inputStyle}
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />

              {error ? (
                <Text style={{ fontSize: 13, color: '#EF4444', marginBottom: 16, marginTop: -8 }}>{error}</Text>
              ) : null}

              <TouchableOpacity
                style={{
                  backgroundColor: '#FF8C00',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: !email || isLoading ? 0.5 : 1,
                }}
                onPress={handleSendCode}
                disabled={!email || isLoading}
                activeOpacity={0.8}
              >
                {isLoading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Send Code</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 8 }}>
                Check your email
              </Text>
              <Text style={{ fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 22 }}>
                We sent a code to{' '}
                <Text style={{ color: '#1F2937', fontWeight: '600' }}>{email}</Text>.
                Enter it below along with your new password.
              </Text>

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Reset Code</Text>
              <TextInput
                style={{ ...inputStyle, fontSize: 24, letterSpacing: 10, textAlign: 'center' }}
                value={otp}
                onChangeText={t => { setOtp(t.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
              />

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>New Password</Text>
              <TextInput
                style={inputStyle}
                value={newPassword}
                onChangeText={t => { setNewPassword(t); setError(''); }}
                placeholder="At least 6 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Confirm Password</Text>
              <TextInput
                style={inputStyle}
                value={confirmPassword}
                onChangeText={t => { setConfirmPassword(t); setError(''); }}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />

              {error ? (
                <Text style={{ fontSize: 13, color: '#EF4444', marginBottom: 16, marginTop: -8 }}>{error}</Text>
              ) : null}

              <TouchableOpacity
                style={{
                  backgroundColor: '#FF8C00',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: !otp || !newPassword || !confirmPassword || isLoading ? 0.5 : 1,
                }}
                onPress={handleResetPassword}
                disabled={!otp || !newPassword || !confirmPassword || isLoading}
                activeOpacity={0.8}
              >
                {isLoading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Reset Password</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 20, alignItems: 'center' }}
                onPress={handleSendCode}
                disabled={isLoading}
              >
                <Text style={{ fontSize: 14, color: '#FF8C00', fontWeight: '600' }}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
