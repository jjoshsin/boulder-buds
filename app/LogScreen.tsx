import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import climbLogService, { ClimbLog, ClimbStats } from '../services/climbLogService';

type LogNav = NativeStackNavigationProp<RootStackParamList>;

const OUTCOME_CONFIG = {
  sent:    { label: 'Sent',    color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle' },
  flash:   { label: 'Flash',   color: '#F59E0B', bg: '#FFFBEB', icon: 'flash' },
  onsight: { label: 'Onsight', color: '#6366F1', bg: '#EEF2FF', icon: 'eye' },
  project: { label: 'Project', color: '#9CA3AF', bg: '#F9FAFB', icon: 'time' },
} as const;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#1F2937' }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function LogCard({ log, onDelete }: { log: ClimbLog; onDelete: (id: string) => void }) {
  const outcome = OUTCOME_CONFIG[log.outcome];
  const date = new Date(log.date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Grade badge */}
        <View style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: '#FFF4E6', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#FF8C00' }}>{log.grade}</Text>
          <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{log.climbType === 'boulder' ? 'V' : 'YDS'}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            {/* Outcome pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: outcome.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginRight: 8 }}>
              <Ionicons name={outcome.icon as any} size={12} color={outcome.color} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: outcome.color, marginLeft: 3 }}>{outcome.label}</Text>
            </View>
            {/* Type pill */}
            <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>
                {log.climbType === 'boulder' ? 'Boulder' : 'Rope'}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }} numberOfLines={1}>{log.gym.name}</Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{log.gym.city}{log.gym.state ? `, ${log.gym.state}` : ''} · {dateStr}</Text>

          {log.notes ? (
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 18 }} numberOfLines={2}>{log.notes}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Delete', 'Remove this log?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(log.id) },
          ])}
          style={{ padding: 4 }}
        >
          <Ionicons name="trash-outline" size={16} color="#D1D5DB" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LogScreen() {
  const navigation = useNavigation<LogNav>();
  const [logs, setLogs] = useState<ClimbLog[]>([]);
  const [stats, setStats] = useState<ClimbStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [logsData, statsData] = await Promise.all([
        climbLogService.getMyLogs(),
        climbLogService.getMyStats(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Reload when tab is focused (e.g. after logging a climb)
  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleDelete = async (logId: string) => {
    try {
      await climbLogService.deleteLog(logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
      // Refresh stats
      const statsData = await climbLogService.getMyStats();
      setStats(statsData);
    } catch {
      Alert.alert('Error', 'Failed to delete log');
    }
  };

  const topBoulderGrade = stats
    ? Object.entries(stats.boulderGrades).sort((a, b) => {
        const gradeOrder = ['VB','V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16','V17'];
        return gradeOrder.indexOf(b[0]) - gradeOrder.indexOf(a[0]);
      })[0]?.[0]
    : null;

  const topRopeGrade = stats
    ? Object.entries(stats.ropeGrades).sort((a, b) => {
        const entries = Object.keys(stats.ropeGrades);
        return entries.indexOf(b[0]) - entries.indexOf(a[0]);
      })[0]?.[0]
    : null;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#1F2937' }}>My Climbs</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('LogClimb')}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF8C00', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Log Climb</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadData(); }} tintColor="#FF8C00" />}
        contentContainerStyle={{ padding: 20 }}
      >
        {/* Stats row */}
        {stats && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            <StatCard label="Total Sessions" value={stats.totalSessions} />
            <StatCard label="Sends" value={stats.sent} />
            {topBoulderGrade && <StatCard label="Top Boulder" value={topBoulderGrade} />}
            {topRopeGrade && <StatCard label="Top Rope" value={topRopeGrade} />}
          </View>
        )}

        {/* Logs list */}
        {logs.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <MaterialCommunityIcons name="hiking" size={60} color="#E5E7EB" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 }}>No climbs logged yet</Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              Tap "Log Climb" to start tracking your sessions
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LogClimb')}
              style={{ marginTop: 24, backgroundColor: '#FF8C00', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Log Your First Climb</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>
              {logs.length} {logs.length === 1 ? 'climb' : 'climbs'}
            </Text>
            {logs.map(log => (
              <LogCard key={log.id} log={log} onDelete={handleDelete} />
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
