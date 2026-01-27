import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/PersonalizeScreen.styles';
import authService from '../services/authService';

type ClimbingLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro' | 'prefer_not_to_say';
type ClimbingType = 'bouldering' | 'rope' | 'both';

export default function PersonalizeScreen({ 
  onComplete, 
  onBack 
}: { 
  onComplete: () => void; 
  onBack: () => void; 
}) {
  const [climbingLevel, setClimbingLevel] = useState<ClimbingLevel | null>(null);
  const [climbingType, setClimbingType] = useState<ClimbingType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSkip = () => {
  onComplete();
};

const handleContinue = async () => {  
  if (!climbingLevel || !climbingType) {
    Alert.alert('Missing Information', 'Please answer all questions or skip.');
    return;
  }

  try {
    setIsLoading(true);
    
    const user = await authService.getStoredUser();
    if (!user) {
      Alert.alert('Error', 'User not found. Please sign in again.');
      return;
    }

    // Save preferences to backend
    await authService.updateUserPreferences(user.id, {
      climbingLevel,
      climbingType,
    });

    onComplete();
    
  } catch (error) {
    console.error('Save preferences error:', error);
    Alert.alert('Error', 'Failed to save preferences. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const renderLevelOption = (level: ClimbingLevel, label: string) => (
    <TouchableOpacity
      key={level}
      style={[
        styles.optionButton,
        climbingLevel === level && styles.optionButtonSelected,
      ]}
      onPress={() => setClimbingLevel(level)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionText,
          climbingLevel === level && styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTypeOption = (type: ClimbingType, label: string) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.optionButton,
        climbingType === type && styles.optionButtonSelected,
      ]}
      onPress={() => setClimbingType(type)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionText,
          climbingType === type && styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Help us personalize</Text>

        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButtonContainer}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question 2: Climbing Level */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>What would you say your level in climbing is?</Text>
          <View style={styles.optionsContainer}>
            {renderLevelOption('beginner', 'Beginner')}
            {renderLevelOption('intermediate', 'Intermediate')}
            {renderLevelOption('advanced', 'Advanced')}
            {renderLevelOption('pro', 'Pro')}
            {renderLevelOption('prefer_not_to_say', 'Prefer not to say')}
          </View>
        </View>

        {/* Question 3: Climbing Type */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>What are you looking for?</Text>
          <View style={styles.optionsContainer}>
            {renderTypeOption('bouldering', 'Bouldering')}
            {renderTypeOption('rope', 'Rope Climbing')}
            {renderTypeOption('both', 'Both')}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!climbingLevel || !climbingType || isLoading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!climbingLevel || !climbingType || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};