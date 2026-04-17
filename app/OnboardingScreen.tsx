import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/OnboardingScreen.styles';

const SLIDES = [
  {
    icon: 'people' as const,
    iconColor: '#FF8C00',
    bg: '#FFF4E6',
    title: 'Welcome to Boulder Buds',
    subtitle: 'The social app built for climbers. Connect with friends, discover gyms, and track your progress — all in one place.',
  },
  {
    icon: 'location' as const,
    iconColor: '#6366F1',
    bg: '#EEF2FF',
    title: 'Discover Climbing Gyms',
    subtitle: 'Explore gyms near you, read real reviews from climbers, save your favourites, and find your next project.',
  },
  {
    icon: 'journal' as const,
    iconColor: '#10B981',
    bg: '#ECFDF5',
    title: 'Track Every Send',
    subtitle: 'Log your boulder problems and routes, track your top grades, and share your progress with the community.',
  },
];

export default function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goTo(currentIndex + 1);
    } else {
      onFinish();
    }
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      <View style={styles.skipRow}>
        {!isLast ? (
          <TouchableOpacity onPress={onFinish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ height: 22 }} />
        )}
      </View>

      {/* Slide content */}
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
        <View style={[styles.iconCircle, { backgroundColor: slide.bg }]}>
          <Ionicons name={slide.icon} size={64} color={slide.iconColor} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>

      {/* Bottom: dots + button */}
      <View style={styles.bottom}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === currentIndex ? '#FF8C00' : '#E5E7EB',
              }} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>{isLast ? 'Get Started' : 'Next'}</Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
