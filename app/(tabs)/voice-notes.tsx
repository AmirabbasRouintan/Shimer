// app/voice-notes.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Animated, PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import {
  AudioModule,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import type { RecorderState, RecordingOptions } from 'expo-audio';
import { Audio } from 'expo-av';
import { File, Directory, Paths } from 'expo-file-system';
import CustomAlert from '../components/CustomAlert';

interface VoiceNote {
  id: string;
  title: string;
  uri: string;
  duration: number;
  createdAt: string;
}

const VOICE_NOTES_DIR = new Directory(Paths.document, 'voice_notes');
const VOICE_NOTES_LIST_FILE = new File(VOICE_NOTES_DIR, 'notes.json');

function SwipeableNoteRow({ onEdit, onDelete, children }: any) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.max(-50, Math.min(50, g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -35) {
          Animated.spring(translateX, { toValue: -50, useNativeDriver: true }).start();
          setTimeout(() => {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            onDelete();
          }, 150);
        } else if (g.dx > 35) {
          Animated.spring(translateX, { toValue: 50, useNativeDriver: true }).start();
          setTimeout(() => {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            onEdit();
          }, 150);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      {/* Background revealed behind the row */}
      <View style={styles.swipeDeleteBg}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.swipeBgText}>Delete</Text>
      </View>
      <View style={styles.swipeEditBg}>
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.swipeBgText}>Edit</Text>
      </View>
      <Animated.View
        style={[
          styles.swipeRowContent,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export default function VoiceNotesScreen() {
  const router = useRouter();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<AudioModule.AudioRecorder | null>(null);
  const [recorderState, setRecorderState] = useState<RecorderState | null>(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [pendingRecordingUri, setPendingRecordingUri] = useState<string | null>(null);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [generatedName, setGeneratedName] = useState('');
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>(Array(12).fill(4));
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);

  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setupAudioMode();
    loadVoiceNotes();
    return () => {
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const setupAudioMode = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionModeAndroid: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  };

  const loadVoiceNotes = async () => {
    try {
      if (!VOICE_NOTES_DIR.exists) {
        VOICE_NOTES_DIR.create({ intermediates: true, idempotent: true });
      }
      if (VOICE_NOTES_LIST_FILE.exists) {
        const content = await VOICE_NOTES_LIST_FILE.text();
        const notes = JSON.parse(content);
        setVoiceNotes(notes);
      }
    } catch (error) {
      console.error('Error loading voice notes:', error);
    }
  };

  const saveVoiceNotesList = async (notes: VoiceNote[]) => {
    try {
      VOICE_NOTES_LIST_FILE.create({ intermediates: true, overwrite: true });
      VOICE_NOTES_LIST_FILE.write(JSON.stringify(notes, null, 2));
    } catch (error) {
      console.error('Error saving voice notes list:', error);
    }
  };

  const generateAutoName = () => {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'short' });
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, '0');
    return `Voice ${month} ${day}, ${hour12}:${minuteStr} ${ampm}`;
  };

  const barHeightsRef = useRef<number[]>(Array(12).fill(4));
  const targetHeightsRef = useRef<number[]>(Array(12).fill(4));

  /**
   * Start polling metering values from the recorder.
   * The metering value is in dB (typically -100 to 0), where higher = louder.
   */
  const startMetering = (rec: AudioModule.AudioRecorder) => {
    if (meteringIntervalRef.current) return;

    meteringIntervalRef.current = setInterval(() => {
      const state = rec.getStatus();

      // Smooth interpolation towards target heights
      barHeightsRef.current = barHeightsRef.current.map((current, i) => {
        const target = targetHeightsRef.current[i];
        // Lerp factor 0.15 for smooth transitions
        return current + (target - current) * 0.15;
      });
      setBarHeights([...barHeightsRef.current]);

      if (state.metering != null && state.metering > -100) {
        // Map dB to normalized 0-1, but clamp range for softer response
        // -80 to -10 dB range gives more natural feel
        const clampedDb = Math.max(-80, Math.min(-10, state.metering));
        const normalized = (clampedDb + 80) / 70; // 0 to 1

        // Calculate target heights with lower max (22 instead of 38)
        targetHeightsRef.current = targetHeightsRef.current.map((_, i) => {
          const wave = Math.sin(Date.now() / 300 + i * 0.6) * 1.5 * normalized;
          return Math.max(4, normalized * 22 + wave);
        });
      } else {
        // No metering data yet — use subtle idle animation
        targetHeightsRef.current = targetHeightsRef.current.map((_, i) => {
          const wave = Math.sin(Date.now() / 400 + i * 0.7) * 2;
          return Math.max(4, 8 + wave);
        });
      }
      setRecorderState(state);
    }, 50);
  };

  const stopMetering = () => {
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record voice notes.');
        return;
      }

      await setupAudioMode();

      const options: RecordingOptions = {
        isMeteringEnabled: true,
        extension: '.m4a',
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        ios: {
          audioQuality: 96,
        },
        android: {
          outputFormat: 'mpeg4',
          audioEncoder: 'aac',
        },
      };

      const rec = new AudioModule.AudioRecorder(options);
      setRecorder(rec);

      await rec.prepareToRecordAsync(options);
      rec.record();
      setIsRecording(true);
      startMetering(rec);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recorder) return;

    try {
      await recorder.stop();
      const state = recorder.getStatus();
      setRecorder(null);
      setIsRecording(false);
      stopMetering();

      // Reset visualizer bars
      setBarHeights(Array(12).fill(4));
      setRecorderState(null);

      if (state.url) {
        const autoName = generateAutoName();
        setGeneratedName(autoName);
        setNewTitle(autoName);
        setPendingRecordingUri(state.url);
        setShowTitleModal(true);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording.');
    }
  };

  const saveVoiceNote = async () => {
    if (!pendingRecordingUri || !newTitle.trim()) return;

    try {
      if (!VOICE_NOTES_DIR.exists) {
        VOICE_NOTES_DIR.create({ intermediates: true, idempotent: true });
      }

      const fileName = `${Date.now()}.m4a`;
      const newFile = new File(VOICE_NOTES_DIR, fileName);
      if (newFile.exists) {
        newFile.delete();
      }
      new File(pendingRecordingUri).copy(newFile);
      const newFileUri = newFile.uri;

      const duration = recorderState?.durationMillis || 0;

      const newNote: VoiceNote = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        uri: newFileUri,
        duration: duration,
        createdAt: new Date().toISOString(),
      };

      const updatedNotes = [newNote, ...voiceNotes];
      setVoiceNotes(updatedNotes);
      await saveVoiceNotesList(updatedNotes);

      setShowTitleModal(false);
      setNewTitle('');
      setGeneratedName('');
      setPendingRecordingUri(null);

      setShowSaveSuccessAlert(true);
    } catch (error) {
      console.error('Error saving voice note:', error);
      Alert.alert('Error', 'Failed to save voice note.');
    }
  };

  const playVoiceNote = async (note: VoiceNote) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlayingNoteId(null);
        setPlaybackPosition(0);
        setPlaybackDuration(0);
        setIsPlaying(false);
      }

      if (playingNoteId === note.id) {
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: note.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setPlayingNoteId(note.id);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing voice note:', error);
      Alert.alert('Error', 'Failed to play voice note.');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setPlayingNoteId(null);
        setPlaybackPosition(0);
        setIsPlaying(false);
        sound?.unloadAsync();
        setSound(null);
      }
    }
  };

  const handleSeek = async (position: number) => {
    if (sound) {
      await sound.setPositionAsync(position);
      setPlaybackPosition(position);
      setDragPosition(null);
    }
  };

  const handleSlidingStart = (value: number) => {
    setDragPosition(value);
  };

  const handleValueChange = (value: number) => {
    setDragPosition(value);
  };

  const handleSlidingComplete = async (value: number) => {
    await handleSeek(value);
  };

  const togglePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const seekForward = async () => {
    if (sound && playbackDuration > 0) {
      const newPosition = Math.min(playbackPosition + 10000, playbackDuration);
      await handleSeek(newPosition);
    }
  };

  const seekBackward = async () => {
    if (sound) {
      const newPosition = Math.max(playbackPosition - 10000, 0);
      await handleSeek(newPosition);
    }
  };

  const deleteVoiceNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    const note = voiceNotes.find(n => n.id === noteToDelete);
    if (note) {
      try {
        const updatedNotes = voiceNotes.filter(n => n.id !== noteToDelete);
        setVoiceNotes(updatedNotes);
        await saveVoiceNotesList(updatedNotes);

        if (playingNoteId === noteToDelete) {
          if (sound) {
            await sound.unloadAsync();
            setSound(null);
          }
          setPlayingNoteId(null);
        }
      } catch (error) {
        console.error('Error deleting voice note:', error);
      }
    }
    setShowDeleteAlert(false);
    setNoteToDelete(null);
  };

  const openEditNote = (note: VoiceNote) => {
    setEditNoteId(note.id);
    setEditTitle(note.title);
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!editNoteId || !editTitle.trim()) return;
    const updatedNotes = voiceNotes.map(n =>
      n.id === editNoteId ? { ...n, title: editTitle.trim() } : n
    );
    setVoiceNotes(updatedNotes);
    await saveVoiceNotesList(updatedNotes);
    setShowEditModal(false);
    setEditNoteId(null);
    setEditTitle('');
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <Header title="Voice Notes" onBack={() => router.back()} />

      <ScrollView style={styles.notesList} showsVerticalScrollIndicator={false}>
        {voiceNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mic-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>No Voice Notes</Text>
            <Text style={styles.emptyText}>
              Tap the microphone button below to record your first voice note
            </Text>
          </View>
        ) : (
          voiceNotes.map((note) => (
            <SwipeableNoteRow
              key={note.id}
              onEdit={() => openEditNote(note)}
              onDelete={() => deleteVoiceNote(note.id)}
            >
              <View style={[styles.noteItem, playingNoteId === note.id && styles.noteItemActive]}>
                <TouchableOpacity
                  style={styles.noteContent}
                  onPress={() => playVoiceNote(note)}
                  activeOpacity={0.7}
                >
                  <View style={styles.noteLeft}>
                    <TouchableOpacity onPress={playingNoteId === note.id ? togglePlayPause : () => playVoiceNote(note)}>
                      <Ionicons
                        name={playingNoteId === note.id && isPlaying ? "pause-circle" : "play-circle"}
                        size={40}
                        color={playingNoteId === note.id ? "#fff" : "#888"}
                      />
                    </TouchableOpacity>
                    <View style={styles.noteInfo}>
                      <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
                      <View style={styles.noteMeta}>
                        <Text style={styles.noteDuration}>{formatDuration(note.duration)}</Text>
                        <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Playback Controls - Show when this note is playing */}
                {playingNoteId === note.id && (
                  <View style={styles.playbackControls}>
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <Text style={styles.timeText}>{formatDuration(dragPosition ?? playbackPosition)}</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={playbackDuration > 0 ? playbackDuration : 1}
                        step={1000}
                        value={dragPosition ?? playbackPosition}
                        minimumTrackTintColor="#fff"
                        maximumTrackTintColor="#3a3a3a"
                        thumbTintColor="#fff"
                        tapToSeek
                        disabled={playbackDuration <= 0}
                        onSlidingStart={handleSlidingStart}
                        onValueChange={handleValueChange}
                        onSlidingComplete={handleSlidingComplete}
                      />
                      <Text style={styles.timeText}>{formatDuration(playbackDuration)}</Text>
                    </View>

                    {/* Seek Controls */}
                    <View style={styles.seekControls}>
                      <TouchableOpacity onPress={seekBackward} style={styles.seekButton}>
                        <Ionicons name="play-back" size={20} color="#000" />
                        <Text style={styles.seekText}>10s</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={28}
                          color="#000"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={seekForward} style={styles.seekButton}>
                        <Ionicons name="play-forward" size={20} color="#000" />
                        <Text style={styles.seekText}>10s</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </SwipeableNoteRow>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Recording Section - Bottom */}
      <View style={styles.recordingSection}>
        {isRecording && (
          <View style={styles.visualizerContainer}>
            {barHeights.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.visualizerBar,
                  { height: Math.max(4, h) },
                  getBarGradientColor(h, i)
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingActive]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRecording ? "stop-circle" : "mic-circle"}
            size={72}
            color={isRecording ? "#FF453A" : "#fff"}
          />
          <Text style={[styles.recordText, isRecording && styles.recordingText]}>
            {isRecording ? 'Tap to Stop Recording' : 'Tap to Start Recording'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title Modal with Auto-generated Name */}
      <Modal visible={showTitleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Name Your Voice Note</Text>
              <TouchableOpacity onPress={() => setShowTitleModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Enter a title for your voice note"
              placeholderTextColor="#555"
              value={newTitle}
              onChangeText={setNewTitle}
              onFocus={() => {
                if (newTitle === generatedName && generatedName !== '') {
                  setNewTitle('');
                }
              }}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowTitleModal(false);
                  setNewTitle('');
                  setGeneratedName('');
                  setPendingRecordingUri(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !newTitle.trim() && styles.saveButtonDisabled]}
                onPress={saveVoiceNote}
                disabled={!newTitle.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Success Alert - Apple Style */}
      <CustomAlert
        visible={showSaveSuccessAlert}
        title="Success"
        message="Voice note saved successfully!"
        confirmText="OK"
        cancelText={null}
        singleButton
        onConfirm={() => setShowSaveSuccessAlert(false)}
      />

      {/* Edit Title Modal - Apple Style */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Voice Note</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Enter a new title"
              placeholderTextColor="#555"
              value={editTitle}
              onChangeText={setEditTitle}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditNoteId(null);
                  setEditTitle('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !editTitle.trim() && styles.saveButtonDisabled]}
                onPress={confirmEdit}
                disabled={!editTitle.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Alert - Apple Style */}
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Voice Note"
        message="Are you sure you want to delete this voice note?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteAlert(false);
          setNoteToDelete(null);
        }}
      />
    </View>
  );
}

/** Color helper: quiet bars are blue, medium are teal, louder shift to pink */
function getBarGradientColor(height: number, _index: number) {
  const ratio = Math.min(1, height / 22);
  if (ratio < 0.4) return { backgroundColor: '#5B9BD5' }; // Soft blue
  if (ratio < 0.7) return { backgroundColor: '#6EC4A8' }; // Teal
  return { backgroundColor: '#E8846B' }; // Soft coral/pink
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  notesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  noteItem: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    overflow: 'hidden',
  },
  noteItemActive: {
    borderColor: '#fff',
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  swipeDeleteBg: {
    position: 'absolute',
    right: 0,
    marginRight: 2,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: '#FF453A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  swipeEditBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  swipeRowContent: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
  },
  swipeBgText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  noteContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  noteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteDuration: {
    color: '#888',
    fontSize: 12,
  },
  noteDate: {
    color: '#555',
    fontSize: 11,
  },
  playbackControls: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 11,
    width: 40,
  },
  slider: {
    flex: 1,
    height: 24,
  },
  seekControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  seekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  seekText: {
    color: '#fff',
    fontSize: 12,
  },
  playPauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  visualizerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 16,
    height: 44,
  },
  visualizerBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#4A90D9',
    minHeight: 4,
  },
  recordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  recordingActive: {
    opacity: 1,
  },
  recordText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  recordingText: {
    color: '#FF453A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  titleInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
});
