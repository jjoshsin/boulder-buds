import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/PersonalizeScreen.styles';
import authService from '../services/authService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type ClimbingType = 'bouldering' | 'rope' | 'both';

export default function PersonalizeScreen({ 
  onComplete, 
  onBack 
}: { 
  onComplete: () => void; 
  onBack: () => void; 
}) {
  const [climbingType, setClimbingType] = useState<ClimbingType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {  
    if (!climbingType) return;

    try {
      setIsLoading(true);
      
      const user = await authService.getStoredUser();
      if (!user) return;

      await authService.updateUserPreferences(user.id, {
        climbingType,
      });

      onComplete();
      
    } catch (error) {
      console.error('Save preferences error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const options: { type: ClimbingType; icon: string; label: string; description: string }[] = [
    {
      type: 'bouldering',
      icon: 'hiking',
      label: 'Bouldering',
      description: 'Short, powerful climbs without ropes',
    },
    {
      type: 'rope',
      icon: 'rope',
      label: 'Rope Climbing',
      description: 'Top rope and lead climbing with harnesses',
    },
    {
      type: 'both',
      icon: 'terrain',
      label: 'Both',
      description: 'I enjoy all types of climbing',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleSection}>
          <MaterialCommunityIcons name="terrain" size={48} color="#FF8C00" />
          <Text style={styles.title}>What type of climbing are you into?</Text>
          <Text style={styles.subtitle}>
            We'll recommend gyms based on your preference
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                climbingType === option.type && styles.optionCardSelected,
              ]}
              onPress={() => setClimbingType(option.type)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={option.icon as any}
                size={28}
                color={climbingType === option.type ? '#FF8C00' : '#6B7280'}
              />
              <View style={styles.optionInfo}>
                <Text style={[
                  styles.optionLabel,
                  climbingType === option.type && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={[
                styles.optionRadio,
                climbingType === option.type && styles.optionRadioSelected,
              ]}>
                {climbingType === option.type && (
                  <View style={styles.optionRadioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!climbingType || isLoading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!climbingType || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Get Started</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}