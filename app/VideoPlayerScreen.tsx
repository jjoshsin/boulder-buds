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
  Modal,
  Keyboard,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';
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
  const [showComments, setShowComments] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight] = useState(new Animated.Value(0));


  useEffect(() => {
  const keyboardWillShow = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
    (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? 250 : 200,
        useNativeDriver: false,
      }).start();
    }
  );
  const keyboardWillHide = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
    () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 250 : 200,
        useNativeDriver: false,
      }).start();
    }
  );

  return () => {
    keyboardWillShow.remove();
    keyboardWillHide.remove();
  };
}, []);

  const player = useVideoPlayer(video?.videoUrl || '', (player) => {
    player.loop = true;
    player.play();
  });

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
      loadVideo();
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

  const handleEditCaption = () => {
    setEditedCaption(video?.caption || '');
    setIsEditingCaption(true);
  };

  const handleSaveCaption = async () => {
    try {
      await videoService.updateCaption(videoId, editedCaption.trim());
      setIsEditingCaption(false);
      loadVideo();
      Alert.alert('Success', 'Caption updated!');
    } catch (error) {
      console.error('Update caption error:', error);
      Alert.alert('Error', 'Failed to update caption');
    }
  };

  const handleDeleteVideo = () => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await videoService.deleteVideo(videoId);
              Alert.alert('Deleted', 'Video deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Delete video error:', error);
              Alert.alert('Error', 'Failed to delete video');
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
      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleDoubleTap}
        style={styles.videoContainer}
      >
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls
        />
        
        {/* Top Bar - Close & Options */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          {currentUserId === video.userId && (
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => {
                Alert.alert(
                  'Video Options',
                  'What would you like to do?',
                  [
                    {
                      text: 'Edit Caption',
                      onPress: handleEditCaption,
                    },
                    {
                      text: 'Delete Video',
                      style: 'destructive',
                      onPress: handleDeleteVideo,
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={styles.optionsButtonText}>⋯</Text>
            </TouchableOpacity>
          )}
        </View>

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
          
          {isEditingCaption ? (
            <View style={styles.captionEditContainer}>
              <TextInput
                style={styles.captionInput}
                value={editedCaption}
                onChangeText={setEditedCaption}
                placeholder="Add a caption..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={200}
              />
              <View style={styles.captionEditButtons}>
                <TouchableOpacity
                  style={styles.captionCancelButton}
                  onPress={() => setIsEditingCaption(false)}
                >
                  <Text style={styles.captionCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captionSaveButton}
                  onPress={handleSaveCaption}
                >
                  <Text style={styles.captionSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            video.caption && (
              <Text style={styles.caption}>{video.caption}</Text>
            )
          )}
          
          <Text style={styles.gymName}>📍 {video.gym.name}</Text>
        </View>

        {/* Like/Comment Actions */}
        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
            <Text style={styles.actionCount}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowComments(true)}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{video.commentCount}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

{/* Comments Modal - Bottom Sheet Style */}
<Modal
  visible={showComments}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowComments(false)}
>
  <View style={styles.modalOverlay}>
    <TouchableOpacity 
      style={styles.modalBackdrop}
      activeOpacity={1}
      onPress={() => setShowComments(false)}
    />
    <Animated.View style={[
      styles.modalContainer,
      { marginBottom: keyboardHeight }
    ]}>
      {/* Comments Header */}
      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Comments ({video.commentCount})</Text>
        <TouchableOpacity onPress={() => setShowComments(false)}>
          <Text style={styles.closeCommentsButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.commentsList}
        keyboardShouldPersistTaps="handled"
      >
        {video.comments.map(comment => renderComment(comment))}
        {video.comments.length === 0 && (
          <Text style={styles.noComments}>No comments yet. Be the first!</Text>
        )}
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
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
    </Animated.View>
  </View>
</Modal>
    </SafeAreaView>
  );
}