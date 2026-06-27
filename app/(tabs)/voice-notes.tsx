// app/voice-notes.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { Audio } from 'expo-av';
import { documentDirectory, makeDirectoryAsync, writeAsStringAsync, readAsStringAsync, copyAsync } from 'expo-file-system/legacy';

interface VoiceNote {
  id: string;
  title: string;
  uri: string;
  duration: number;
  createdAt: string;
}

const VOICE_NOTES_DIR = `${documentDirectory}voice_notes/`;
const VOICE_NOTES_LIST_FILE = `${VOICE_NOTES_DIR}notes.json`;

export default function VoiceNotesScreen() {
  const router = useRouter();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [pendingRecordingUri, setPendingRecordingUri] = useState<string | null>(null);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [generatedName, setGeneratedName] = useState('');

  // Animation values for visualizer
  const barHeights = useRef([
    new Animated.Value(5),
    new Animated.Value(5),
    new Animated.Value(5),
    new Animated.Value(5),
    new Animated.Value(5),
    new Animated.Value(5)
  ]).current;

  const meterInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setupAudioMode();
    loadVoiceNotes();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (meterInterval.current) {
        clearInterval(meterInterval.current);
      }
    };
  }, []);

  const setupAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  };

  const loadVoiceNotes = async () => {
    try {
      await makeDirectoryAsync(VOICE_NOTES_DIR, { intermediates: true });
      const content = await readAsStringAsync(VOICE_NOTES_LIST_FILE);
      const notes = JSON.parse(content);
      setVoiceNotes(notes);
    } catch (error) {
      console.error('Error loading voice notes:', error);
    }
  };

  const saveVoiceNotesList = async (notes: VoiceNote[]) => {
    try {
      await writeAsStringAsync(VOICE_NOTES_LIST_FILE, JSON.stringify(notes, null, 2));
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

  const startVisualizer = () => {
    const animate = () => {
      if (!isRecording) return;

      const animations = barHeights.map(bar =>
        Animated.timing(bar, {
          toValue: Math.random() * 35 + 8,
          duration: 100,
          useNativeDriver: false,
        })
      );

      Animated.parallel(animations).start(() => {
        if (isRecording) {
          const resetAnimations = barHeights.map(bar =>
            Animated.timing(bar, {
              toValue: Math.random() * 35 + 8,
              duration: 100,
              useNativeDriver: false,
            })
          );
          Animated.parallel(resetAnimations).start(() => {
            if (isRecording) animate();
          });
        }
      });
    };

    animate();
  };

  const startRecording = async () => {
    try {
      await setupAudioMode();

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record voice notes.');
        return;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      startVisualizer();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      // Reset visualizer bars
      barHeights.forEach(bar => bar.setValue(5));

      if (uri) {
        const autoName = generateAutoName();
        setGeneratedName(autoName);
        setNewTitle(autoName);
        setPendingRecordingUri(uri);
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
      await makeDirectoryAsync(VOICE_NOTES_DIR, { intermediates: true });

      const fileName = `${Date.now()}.m4a`;
      const newFileUri = `${VOICE_NOTES_DIR}${fileName}`;

      await copyAsync({ from: pendingRecordingUri, to: newFileUri });

      const { sound: audioSound } = await Audio.Sound.createAsync({ uri: pendingRecordingUri });
      const status = await audioSound.getStatusAsync();
      const duration = status.isLoaded ? (status.durationMillis || 0) : 0;
      await audioSound.unloadAsync();

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

      Alert.alert('Success', 'Voice note saved successfully!');
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
      }

      if (playingNoteId === note.id) {
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: note.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingNoteId(note.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingNoteId(null);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing voice note:', error);
      Alert.alert('Error', 'Failed to play voice note.');
    }
  };

  const deleteVoiceNote = async (noteId: string) => {
    Alert.alert(
      'Delete Voice Note',
      'Are you sure you want to delete this voice note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const note = voiceNotes.find(n => n.id === noteId);
            if (note) {
              try {
                const updatedNotes = voiceNotes.filter(n => n.id !== noteId);
                setVoiceNotes(updatedNotes);
                await saveVoiceNotesList(updatedNotes);

                if (playingNoteId === noteId) {
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
          }
        }
      ]
    );
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
            <View key={note.id} style={styles.noteItem}>
              <TouchableOpacity
                style={styles.noteContent}
                onPress={() => playVoiceNote(note)}
                activeOpacity={0.7}
              >
                <View style={styles.noteLeft}>
                  <Ionicons
                    name={playingNoteId === note.id ? "pause-circle" : "play-circle"}
                    size={40}
                    color={playingNoteId === note.id ? "#fff" : "#888"}
                  />
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
                    <View style={styles.noteMeta}>
                      <Text style={styles.noteDuration}>{formatDuration(note.duration)}</Text>
                      <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteVoiceNote(note.id)}
              >
                <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Recording Section - Bottom */}
      <View style={styles.recordingSection}>
        {isRecording && (
          <View style={styles.visualizerContainer}>
            {barHeights.map((height, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.visualizerBar,
                  { height }
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
    </View>
  );
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  noteContent: {
    flex: 1,
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
  deleteButton: {
    padding: 16,
  },
  recordingSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    height: 45,
  },
  visualizerBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
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
