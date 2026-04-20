import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import climbLogService, { ClimbLog, ClimbStats } from '../services/climbLogService';
import videoService from '../services/videoService';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../styles/LogScreen.styles';

type LogNav = NativeStackNavigationProp<RootStackParamList>;

const OUTCOME_CONFIG = {
  sent:    { label: 'Sent',    color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle' },
  flash:   { label: 'Flash',   color: '#F59E0B', bg: '#FFFBEB', icon: 'flash' },
  onsight: { label: 'Onsight', color: '#6366F1', bg: '#EEF2FF', icon: 'eye' },
  project: { label: 'Project', color: '#9CA3AF', bg: '#F9FAFB', icon: 'time' },
} as const;

const BOULDER_GRADES = ['VB','V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16','V17'];
const ROPE_GRADES = ['5.5','5.6','5.7','5.8','5.9','5.10a','5.10b','5.10c','5.10d','5.11a','5.11b','5.11c','5.11d','5.12a','5.12b','5.12c','5.12d','5.13a','5.13b','5.13c','5.13d','5.14a','5.14b','5.14c','5.14d','5.15a','5.15b','5.15c','5.15d'];
const OUTCOMES = ['sent', 'flash', 'onsight', 'project'] as const;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LogCard({ log, onPress, onDelete }: { log: ClimbLog; onPress: () => void; onDelete: (id: string) => void }) {
  const outcome = OUTCOME_CONFIG[log.outcome];
  const date = new Date(log.date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <TouchableOpacity style={styles.logCard} onPress={onPress} activeOpacity={0.7}>
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
            {log.video && (
              <View style={[styles.typePill, styles.videoIconBadge]}>
                <Ionicons name="videocam" size={11} color="#6B7280" />
              </View>
            )}
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
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color="#D1D5DB" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function LogScreen() {
  const navigation = useNavigation<LogNav>();
  const [logs, setLogs] = useState<ClimbLog[]>([]);
  const [stats, setStats] = useState<ClimbStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedLog, setSelectedLog] = useState<ClimbLog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editGrade, setEditGrade] = useState('');
  const [editOutcome, setEditOutcome] = useState<typeof OUTCOMES[number]>('sent');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editVideo, setEditVideo] = useState<{ uri: string; filename: string } | null>(null);
  const [editUploadState, setEditUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [editUploadResult, setEditUploadResult] = useState<{ videoUrl: string; thumbnailUrl: string } | null>(null);

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

  const openDetail = (log: ClimbLog) => {
    setSelectedLog(log);
    setIsEditing(false);
  };

  const startEdit = () => {
    if (!selectedLog) return;
    setEditGrade(selectedLog.grade);
    setEditOutcome(selectedLog.outcome);
    setEditNotes(selectedLog.notes || '');
    setEditVideo(null);
    setEditUploadState('idle');
    setEditUploadResult(null);
    setIsEditing(true);
  };

  const handlePickEditVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to attach a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 120,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'video.mp4';
      setEditVideo({ uri: asset.uri, filename });
      setEditUploadResult(null);
      setEditUploadState('uploading');
      videoService.uploadVideo(asset.uri)
        .then(res => { setEditUploadResult(res); setEditUploadState('done'); })
        .catch(() => setEditUploadState('error'));
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedLog) return;
    if (editVideo && editUploadState === 'uploading') {
      Alert.alert('Please wait', 'Video is still uploading.');
      return;
    }
    if (editVideo && editUploadState === 'error') {
      Alert.alert('Upload failed', 'Remove the video and try again.');
      return;
    }
    setIsSavingEdit(true);
    try {
      const updated = await climbLogService.updateLog(selectedLog.id, {
        grade: editGrade,
        outcome: editOutcome,
        notes: editNotes.trim() || undefined,
      });
      setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
      setSelectedLog(updated);
      setIsEditing(false);

      if (editVideo && editUploadResult) {
        const gymName = selectedLog.gym.name;
        Alert.alert(
          'Share to gym feed?',
          `Share this clip to ${gymName}'s video feed?`,
          [
            {
              text: 'Share',
              onPress: async () => {
                await videoService.createVideo({
                  gymId: selectedLog.gymId,
                  videoUrl: editUploadResult.videoUrl,
                  thumbnailUrl: editUploadResult.thumbnailUrl,
                  climbLogId: selectedLog.id,
                  isShared: true,
                });
                const refreshed = await climbLogService.getMyLogs();
                setLogs(refreshed);
                setSelectedLog(refreshed.find(l => l.id === updated.id) || updated);
              },
            },
            {
              text: 'Keep Private',
              onPress: async () => {
                await videoService.createVideo({
                  gymId: selectedLog.gymId,
                  videoUrl: editUploadResult.videoUrl,
                  thumbnailUrl: editUploadResult.thumbnailUrl,
                  climbLogId: selectedLog.id,
                  isShared: false,
                });
                const refreshed = await climbLogService.getMyLogs();
                setLogs(refreshed);
                setSelectedLog(refreshed.find(l => l.id === updated.id) || updated);
              },
            },
          ],
          { cancelable: false },
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const topBoulderGrade = stats
    ? Object.entries(stats.boulderGrades).sort((a, b) => {
        return BOULDER_GRADES.indexOf(b[0]) - BOULDER_GRADES.indexOf(a[0]);
      })[0]?.[0]
    : null;

  const topRopeGrade = stats
    ? Object.entries(stats.ropeGrades).sort((a, b) => {
        return ROPE_GRADES.indexOf(b[0]) - ROPE_GRADES.indexOf(a[0]);
      })[0]?.[0]
    : null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  const grades = selectedLog?.climbType === 'boulder' ? BOULDER_GRADES : ROPE_GRADES;

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
              <LogCard key={log.id} log={log} onPress={() => openDetail(log)} onDelete={handleDelete} />
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Log Detail / Edit Modal */}
      <Modal
        visible={!!selectedLog}
        animationType="slide"
        transparent
        onRequestClose={() => { setSelectedLog(null); setIsEditing(false); }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setSelectedLog(null); setIsEditing(false); }} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => { setSelectedLog(null); setIsEditing(false); }}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Log' : 'Climb Details'}</Text>
              {isEditing ? (
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <Text style={[styles.modalEditButton, { color: '#6B7280' }]}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={startEdit}>
                  <Text style={styles.modalEditButton}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {selectedLog && !isEditing && (
                <>
                  <View style={styles.detailGradeBadge}>
                    <Text style={styles.detailGradeText}>{selectedLog.grade}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gym</Text>
                    <Text style={styles.detailValue}>{selectedLog.gym.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{selectedLog.climbType === 'boulder' ? 'Bouldering' : 'Rope'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Outcome</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={OUTCOME_CONFIG[selectedLog.outcome].icon as any} size={14} color={OUTCOME_CONFIG[selectedLog.outcome].color} />
                      <Text style={[styles.detailValue, { color: OUTCOME_CONFIG[selectedLog.outcome].color }]}>
                        {OUTCOME_CONFIG[selectedLog.outcome].label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedLog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  {selectedLog.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={styles.detailValue}>{selectedLog.notes}</Text>
                    </View>
                  )}

                  {selectedLog.video && (
                    <TouchableOpacity
                      style={styles.videoThumb}
                      onPress={() => {
                        setSelectedLog(null);
                        navigation.navigate('VideoPlayer', { videoId: selectedLog.video!.id, videos: [] });
                      }}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: selectedLog.video.thumbnailUrl }} style={styles.videoThumbImage} resizeMode="cover" />
                      <View style={styles.videoPlayOverlay}>
                        <Ionicons name="play-circle" size={56} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {selectedLog && isEditing && (
                <>
                  <Text style={styles.editFieldLabel}>Grade</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.editGradeScroll}>
                    <View style={styles.editGradeList}>
                      {grades.map(g => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setEditGrade(g)}
                          style={[styles.editGradeChip, {
                            backgroundColor: editGrade === g ? '#FF8C00' : '#F3F4F6',
                            borderColor: editGrade === g ? '#FF8C00' : 'transparent',
                          }]}
                        >
                          <Text style={[styles.editGradeChipText, { color: editGrade === g ? '#FFFFFF' : '#374151' }]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={styles.editFieldLabel}>Outcome</Text>
                  <View style={styles.editOutcomeRow}>
                    {OUTCOMES.map(o => {
                      const cfg = OUTCOME_CONFIG[o];
                      const active = editOutcome === o;
                      return (
                        <TouchableOpacity
                          key={o}
                          onPress={() => setEditOutcome(o)}
                          style={[styles.editOutcomeButton, {
                            backgroundColor: active ? cfg.color : '#F9FAFB',
                            borderColor: active ? cfg.color : '#E5E7EB',
                          }]}
                        >
                          <Ionicons name={cfg.icon as any} size={16} color={active ? '#FFFFFF' : cfg.color} />
                          <Text style={[styles.editOutcomeText, { color: active ? '#FFFFFF' : '#374151' }]}>{cfg.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.editFieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.editNotesInput}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="Beta, feelings, anything..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxLength={300}
                  />

                  {/* Video attachment — only show if log has no video yet */}
                  {!selectedLog.video && (
                    <>
                      <Text style={styles.editFieldLabel}>Video</Text>
                      {editVideo ? (
                        <View style={styles.editVideoPreview}>
                          {editUploadState === 'uploading'
                            ? <ActivityIndicator size="small" color="#FF8C00" />
                            : <Ionicons name={editUploadState === 'error' ? 'alert-circle' : 'checkmark-circle'} size={20} color={editUploadState === 'error' ? '#EF4444' : '#10B981'} />
                          }
                          <Text style={styles.editVideoText} numberOfLines={1}>{editVideo.filename}</Text>
                          <TouchableOpacity onPress={() => { setEditVideo(null); setEditUploadState('idle'); setEditUploadResult(null); }}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.editVideoAttach} onPress={handlePickEditVideo}>
                          <Ionicons name="videocam-outline" size={20} color="#9CA3AF" />
                          <Text style={styles.editVideoAttachText}>Attach a clip</Text>
                          <Ionicons name="add-circle-outline" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveEdit} disabled={isSavingEdit}>
                    {isSavingEdit
                      ? <ActivityIndicator color="#FFFFFF" />
                      : <Text style={styles.saveEditButtonText}>Save Changes</Text>
                    }
                  </TouchableOpacity>
                </>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
