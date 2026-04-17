import React, { useState, useCallback } from 'react';
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
import { styles } from '../styles/LogScreen.styles';

type LogNav = NativeStackNavigationProp<RootStackParamList>;

const OUTCOME_CONFIG = {
  sent:    { label: 'Sent',    color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle' },
  flash:   { label: 'Flash',   color: '#F59E0B', bg: '#FFFBEB', icon: 'flash' },
  onsight: { label: 'Onsight', color: '#6366F1', bg: '#EEF2FF', icon: 'eye' },
  project: { label: 'Project', color: '#9CA3AF', bg: '#F9FAFB', icon: 'time' },
} as const;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LogCard({ log, onDelete }: { log: ClimbLog; onDelete: (id: string) => void }) {
  const outcome = OUTCOME_CONFIG[log.outcome];
  const date = new Date(log.date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.logCard}>
      <View style={styles.logCardRow}>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{log.grade}</Text>
          <Text style={styles.gradeSubtext}>{log.climbType === 'boulder' ? 'V' : 'YDS'}</Text>
        </View>

        <View style={styles.logCardBody}>
          <View style={styles.pillRow}>
            <View style={[styles.outcomePill, { backgroundColor: outcome.bg }]}>
              <Ionicons name={outcome.icon as any} size={12} color={outcome.color} />
              <Text style={[styles.outcomePillText, { color: outcome.color }]}>{outcome.label}</Text>
            </View>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>
                {log.climbType === 'boulder' ? 'Boulder' : 'Rope'}
              </Text>
            </View>
          </View>

          <Text style={styles.gymName} numberOfLines={1}>{log.gym.name}</Text>
          <Text style={styles.gymMeta}>{log.gym.city}{log.gym.state ? `, ${log.gym.state}` : ''} · {dateStr}</Text>

          {log.notes ? (
            <Text style={styles.notes} numberOfLines={2}>{log.notes}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Delete', 'Remove this log?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(log.id) },
          ])}
          style={styles.deleteButton}
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

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleDelete = async (logId: string) => {
    try {
      await climbLogService.deleteLog(logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Climbs</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('LogClimb')}
          style={styles.logButton}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.logButtonText}>Log Climb</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadData(); }} tintColor="#FF8C00" />}
        contentContainerStyle={styles.scrollContent}
      >
        {stats && (
          <View style={styles.statsRow}>
            <StatCard label="Total Sessions" value={stats.totalSessions} />
            <StatCard label="Sends" value={stats.sent} />
            {topBoulderGrade && <StatCard label="Top Boulder" value={topBoulderGrade} />}
            {topRopeGrade && <StatCard label="Top Rope" value={topRopeGrade} />}
          </View>
        )}

        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="hiking" size={60} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No climbs logged yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Log Climb" to start tracking your sessions
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LogClimb')}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Log Your First Climb</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              {logs.length} {logs.length === 1 ? 'climb' : 'climbs'}
            </Text>
            {logs.map(log => (
              <LogCard key={log.id} log={log} onDelete={handleDelete} />
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}
