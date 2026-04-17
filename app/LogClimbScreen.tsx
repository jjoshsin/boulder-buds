import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import climbLogService from '../services/climbLogService';
import gymService, { Gym } from '../services/gymService';
import { styles } from '../styles/LogClimbScreen.styles';

const BOULDER_GRADES = [
  'VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8',
  'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17',
];

const ROPE_GRADES = [
  '5.5', '5.6', '5.7', '5.8', '5.9',
  '5.10a', '5.10b', '5.10c', '5.10d',
  '5.11a', '5.11b', '5.11c', '5.11d',
  '5.12a', '5.12b', '5.12c', '5.12d',
  '5.13a', '5.13b', '5.13c', '5.13d',
  '5.14a', '5.14b', '5.14c', '5.14d',
  '5.15a', '5.15b', '5.15c', '5.15d',
];

const OUTCOMES: { value: 'sent' | 'flash' | 'onsight' | 'project'; label: string; icon: string; color: string }[] = [
  { value: 'sent',    label: 'Sent',    icon: 'checkmark-circle', color: '#10B981' },
  { value: 'flash',   label: 'Flash',   icon: 'flash',            color: '#F59E0B' },
  { value: 'onsight', label: 'Onsight', icon: 'eye',              color: '#6366F1' },
  { value: 'project', label: 'Project', icon: 'time',             color: '#9CA3AF' },
];

export default function LogClimbScreen() {
  const navigation = useNavigation();

  const [climbType, setClimbType] = useState<'boulder' | 'rope'>('boulder');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<'sent' | 'flash' | 'onsight' | 'project' | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [showGymPicker, setShowGymPicker] = useState(false);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymSearch, setGymSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const grades = climbType === 'boulder' ? BOULDER_GRADES : ROPE_GRADES;

  useEffect(() => {
    loadGyms();
  }, []);

  useEffect(() => {
    setSelectedGrade(null);
  }, [climbType]);

  const loadGyms = async () => {
    try {
      const all = await gymService.getAllGyms();
      setGyms(all);
    } catch {}
  };

  const filteredGyms = gymSearch.trim()
    ? gyms.filter(g =>
        g.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
        g.city?.toLowerCase().includes(gymSearch.toLowerCase()),
      )
    : gyms;

  const canSave = selectedGym && selectedGrade && selectedOutcome;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await climbLogService.createLog({
        gymId: selectedGym!.id,
        climbType,
        grade: selectedGrade!,
        outcome: selectedOutcome!,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Logged!', `${selectedGrade} ${selectedOutcome} at ${selectedGym!.name}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save log');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log a Climb</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || isSaving}
          style={[styles.saveButton, { backgroundColor: canSave ? '#FF8C00' : '#E5E7EB' }]}
        >
          {isSaving
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={[styles.saveButtonText, { color: canSave ? '#FFFFFF' : '#9CA3AF' }]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Gym Picker */}
        <Text style={styles.sectionLabel}>Gym</Text>
        <TouchableOpacity
          onPress={() => setShowGymPicker(true)}
          style={[styles.gymPicker, { borderColor: selectedGym ? '#FF8C00' : '#E5E7EB' }]}
        >
          <Ionicons name="location-outline" size={20} color={selectedGym ? '#FF8C00' : '#9CA3AF'} />
          <Text style={[styles.gymPickerText, { color: selectedGym ? '#1F2937' : '#9CA3AF', fontWeight: selectedGym ? '600' : '400' }]}>
            {selectedGym ? selectedGym.name : 'Select a gym'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Climb Type */}
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.typeRow}>
          {(['boulder', 'rope'] as const).map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setClimbType(type)}
              style={[
                styles.typeButton,
                {
                  backgroundColor: climbType === type ? '#FF8C00' : '#F9FAFB',
                  borderColor: climbType === type ? '#FF8C00' : '#E5E7EB',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={type === 'boulder' ? 'hiking' : 'carabiner'}
                size={20}
                color={climbType === type ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[styles.typeButtonText, { color: climbType === type ? '#FFFFFF' : '#374151' }]}>
                {type === 'boulder' ? 'Bouldering' : 'Rope'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grade Picker */}
        <Text style={styles.sectionLabel}>Grade</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
          <View style={styles.gradeList}>
            {grades.map(grade => (
              <TouchableOpacity
                key={grade}
                onPress={() => setSelectedGrade(grade)}
                style={[
                  styles.gradeChip,
                  {
                    backgroundColor: selectedGrade === grade ? '#FF8C00' : '#F3F4F6',
                    borderColor: selectedGrade === grade ? '#FF8C00' : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.gradeChipText, { color: selectedGrade === grade ? '#FFFFFF' : '#374151' }]}>
                  {grade}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Outcome */}
        <Text style={styles.sectionLabel}>Outcome</Text>
        <View style={styles.outcomeRow}>
          {OUTCOMES.map(o => {
            const active = selectedOutcome === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                onPress={() => setSelectedOutcome(o.value)}
                style={[
                  styles.outcomeButton,
                  {
                    backgroundColor: active ? o.color : '#F9FAFB',
                    borderColor: active ? o.color : '#E5E7EB',
                  },
                ]}
              >
                <Ionicons name={o.icon as any} size={20} color={active ? '#FFFFFF' : o.color} />
                <Text style={[styles.outcomeLabel, { color: active ? '#FFFFFF' : '#374151' }]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Beta, feelings, anything..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={300}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Gym Picker Modal */}
      <Modal visible={showGymPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowGymPicker(false); setGymSearch(''); }} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Gym</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={gymSearch}
                onChangeText={setGymSearch}
                placeholder="Search gyms..."
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
            </View>
          </View>

          <ScrollView>
            {filteredGyms.map(gym => (
              <TouchableOpacity
                key={gym.id}
                onPress={() => { setSelectedGym(gym); setShowGymPicker(false); setGymSearch(''); }}
                style={styles.gymRow}
              >
                <View style={styles.gymIcon}>
                  <MaterialCommunityIcons name="office-building-outline" size={20} color="#FF8C00" />
                </View>
                <View style={styles.gymRowBody}>
                  <Text style={styles.gymRowName}>{gym.name}</Text>
                  <Text style={styles.gymRowMeta}>{gym.city}{gym.state ? `, ${gym.state}` : ''}</Text>
                </View>
                {selectedGym?.id === gym.id && <Ionicons name="checkmark-circle" size={20} color="#FF8C00" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
