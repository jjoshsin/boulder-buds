import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { styles } from '../styles/VideoPlayerScreen.styles';
import videoService, { VideoDetail, VideoComment } from '../services/videoService';
import * as SecureStore from 'expo-secure-store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type VideoPlayerNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function VideoPlayerScreen() {
  const route = useRoute();
  const navigation = useNavigation<VideoPlayerNavigationProp>();
  const { videoId } = route.params as { videoId: string };

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    loadVideo();
    loadCurrentUser();
  }, [videoId]);

  const loadCurrentUser = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadVideo = async () => {
    try {
      const videoData = await videoService.getVideoById(videoId);
      setVideo(videoData);
      setLikeCount(videoData.likeCount);
      setIsLiked(videoData.likes?.some(l => l.userId === currentUserId) || false);
      
      // Increment views
      await videoService.incrementViews(videoId);
    } catch (error) {
      console.error('Error loading video:', error);
      Alert.alert('Error', 'Failed to load video');
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  const handleLike = async () => {
    try {
      const result = await videoService.toggleLike(videoId);
      setIsLiked(result.liked);
      setLikeCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await videoService.addComment(videoId, commentText.trim(), replyingTo?.id);
      setCommentText('');
      setReplyingTo(null);
      loadVideo(); // Reload to get new comments
    } catch (error) {
      console.error('Comment error:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      await videoService.toggleCommentLike(commentId);
      loadVideo();
    } catch (error) {
      console.error('Comment like error:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await videoService.deleteComment(commentId);
              loadVideo();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const renderComment = (comment: VideoComment, isReply: boolean = false) => {
    const isOwnComment = currentUserId === comment.userId;
    const isCommentLiked = comment.likes.some(l => l.userId === currentUserId);

    return (
      <View key={comment.id} style={[styles.comment, isReply && styles.reply]}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>
            {comment.user.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUserName}>{comment.user.displayName}</Text>
            <Text style={styles.commentDate}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.commentText}>{comment.text}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.commentAction}
              onPress={() => handleCommentLike(comment.id)}
            >
              <Text style={styles.commentActionText}>
                {isCommentLiked ? '❤️' : '🤍'} {comment.likeCount}
              </Text>
            </TouchableOpacity>
            {!isReply && (
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => setReplyingTo({ id: comment.id, name: comment.user.displayName })}
              >
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>
            )}
            {isOwnComment && (
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => handleDeleteComment(comment.id)}
              >
                <Text style={[styles.commentActionText, styles.deleteAction]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.replies}>
              {comment.replies.map(reply => renderComment(reply, true))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!video) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Video Player */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDoubleTap}
          style={styles.videoContainer}
        >
          <Video
            ref={videoRef}
            source={{ uri: video.videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay
          />
          
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Video Info Overlay */}
          <View style={styles.videoInfoOverlay}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {video.user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName}>{video.user.displayName}</Text>
            </View>
            {video.caption && (
              <Text style={styles.caption}>{video.caption}</Text>
            )}
            <Text style={styles.gymName}>📍 {video.gym.name}</Text>
          </View>

          {/* Like/Comment Actions */}
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
              <Text style={styles.actionCount}>{likeCount}</Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionCount}>{video.commentCount}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({video.commentCount})</Text>
          <ScrollView style={styles.commentsList}>
            {video.comments.map(comment => renderComment(comment))}
            {video.comments.length === 0 && (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )}
          </ScrollView>
        </View>

        {/* Comment Input */}
        <View style={styles.commentInput}>
          {replyingTo && (
            <View style={styles.replyingToBar}>
              <Text style={styles.replyingToText}>
                Replying to {replyingTo.name}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.cancelReply}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#9CA3AF"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}