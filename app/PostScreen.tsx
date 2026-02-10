import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import SelectGymScreen from './SelectGymScreen';
import RegisterGymScreen from './RegisterGymScreen';
import { styles } from '../styles/PostScreen.styles';

type PostNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PostScreen() {
  const navigation = useNavigation<PostNavigationProp>();
  const [showSelectGym, setShowSelectGym] = useState(false);
  const [showRegisterGym, setShowRegisterGym] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>➕</Text>
        <Text style={styles.title}>Add Content</Text>
        <Text style={styles.subtitle}>Share your gym experience</Text>

        {/* Write Review */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowSelectGym(true)}
        >
          <Text style={styles.actionIcon}>⭐</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionText}>Write Review</Text>
            <Text style={styles.actionSubtext}>Share your experience at a gym</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Register New Gym */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowRegisterGym(true)}
        >
          <Text style={styles.actionIcon}>🏢</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionText}>Register New Gym</Text>
            <Text style={styles.actionSubtext}>Add a gym to our database</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Select Gym for Review Modal */}
      <Modal
        visible={showSelectGym}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SelectGymScreen 
          onClose={() => setShowSelectGym(false)}
          onSelectGym={(gymId, gymName) => {
            setShowSelectGym(false);
            navigation.navigate('WriteReview', { gymId, gymName });
          }}
        />
      </Modal>

      {/* Register Gym Modal */}
      <Modal
        visible={showRegisterGym}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <RegisterGymScreen onClose={() => setShowRegisterGym(false)} />
      </Modal>
    </SafeAreaView>
  );
}