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
import * as SecureStore from 'expo-secure-store';
import climbLogService from '../services/climbLogService';
import gymService, { Gym } from '../services/gymService';

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
  { value: 'flash',  label: 'Flash',   icon: 'flash',            color: '#F59E0B' },
  { value: 'onsight',label: 'Onsight', icon: 'eye',              color: '#6366F1' },
  { value: 'project',label: 'Project', icon: 'time',             color: '#9CA3AF' },
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

  // Reset grade when switching type since grades are incompatible
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36 }}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#1F2937' }}>
          Log a Climb
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || isSaving}
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: canSave ? '#FF8C00' : '#E5E7EB' }}
        >
          {isSaving
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={{ fontSize: 14, fontWeight: '700', color: canSave ? '#FFFFFF' : '#9CA3AF' }}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>

        {/* Gym Picker */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Gym</Text>
        <TouchableOpacity
          onPress={() => setShowGymPicker(true)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: selectedGym ? '#FF8C00' : '#E5E7EB' }}
        >
          <Ionicons name="location-outline" size={20} color={selectedGym ? '#FF8C00' : '#9CA3AF'} />
          <Text style={{ flex: 1, marginLeft: 10, fontSize: 15, color: selectedGym ? '#1F2937' : '#9CA3AF', fontWeight: selectedGym ? '600' : '400' }}>
            {selectedGym ? selectedGym.name : 'Select a gym'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Climb Type */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Type</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {(['boulder', 'rope'] as const).map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setClimbType(type)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                paddingVertical: 12, borderRadius: 12, gap: 8,
                backgroundColor: climbType === type ? '#FF8C00' : '#F9FAFB',
                borderWidth: 1, borderColor: climbType === type ? '#FF8C00' : '#E5E7EB',
              }}
            >
              <MaterialCommunityIcons
                name={type === 'boulder' ? 'hiking' : 'carabiner'}
                size={20}
                color={climbType === type ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={{ fontSize: 15, fontWeight: '600', color: climbType === type ? '#FFFFFF' : '#374151' }}>
                {type === 'boulder' ? 'Bouldering' : 'Rope'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grade Picker */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Grade</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {grades.map(grade => (
              <TouchableOpacity
                key={grade}
                onPress={() => setSelectedGrade(grade)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                  backgroundColor: selectedGrade === grade ? '#FF8C00' : '#F3F4F6',
                  borderWidth: 1, borderColor: selectedGrade === grade ? '#FF8C00' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: selectedGrade === grade ? '#FFFFFF' : '#374151' }}>
                  {grade}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Outcome */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Outcome</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {OUTCOMES.map(o => {
            const active = selectedOutcome === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                onPress={() => setSelectedOutcome(o.value)}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
                  backgroundColor: active ? o.color : '#F9FAFB',
                  borderWidth: 1, borderColor: active ? o.color : '#E5E7EB',
                }}
              >
                <Ionicons name={o.icon as any} size={20} color={active ? '#FFFFFF' : o.color} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#FFFFFF' : '#374151', marginTop: 4 }}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Notes (optional)</Text>
        <TextInput
          style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, fontSize: 15, color: '#1F2937', minHeight: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E5E7EB' }}
          value={notes}
          onChangeText={setNotes}
          placeholder="Beta, feelings, anything..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={300}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Gym Picker Modal */}
      <Modal visible={showGymPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <TouchableOpacity onPress={() => { setShowGymPicker(false); setGymSearch(''); }} style={{ width: 36 }}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#1F2937' }}>Select Gym</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#1F2937' }}
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
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF4E6', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <MaterialCommunityIcons name="office-building-outline" size={20} color="#FF8C00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>{gym.name}</Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{gym.city}{gym.state ? `, ${gym.state}` : ''}</Text>
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
