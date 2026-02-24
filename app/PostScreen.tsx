import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { styles } from '../styles/PostScreen.styles';

type PostNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PostScreen() {
  const navigation = useNavigation<PostNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Gym</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🏢</Text>
          <Text style={styles.heroTitle}>Can't find your gym?</Text>
          <Text style={styles.heroSubtitle}>
            Help grow our community by adding a climbing gym to Boulder Buds
          </Text>
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('RegisterGym')}
        >
          <Text style={styles.registerButtonText}>Register New Gym</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What you'll need:</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Gym name and address</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>City and state</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Climbing types (bouldering, rope, or both)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}