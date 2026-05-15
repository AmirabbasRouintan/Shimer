// app/edit-goal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getGoals, updateGoal, deleteGoal, getChecklists } from '../activitiesStore';

const weekDays = [
  { id: 'mon', label: 'Mon', full: 'Monday' },
  { id: 'tue', label: 'Tue', full: 'Tuesday' },
  { id: 'wed', label: 'Wed', full: 'Wednesday' },
  { id: 'thu', label: 'Thu', full: 'Thursday' },
  { id: 'fri', label: 'Fri', full: 'Friday' },
  { id: 'sat', label: 'Sat', full: 'Saturday' },
  { id: 'sun', label: 'Sun', full: 'Sunday' },
];

const emojiOptions = ['😊', '🎉', '🏆', '⭐', '💪', '🔥', '👏', '✨', '🎯', '💯'];

const GOAL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7', '#A8E6CF',
  '#FF8C42', '#4A90E2', '#50E3C2', '#F5A623', '#7ED321', '#9013FE',
  '#417505', '#BD10E0', '#8B572A', '#2C3E50', '#E91E63', '#9B59B6',
];

export default function EditGoal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const goalId = parseInt(params.id as string);

  const [goalTitle, setGoalTitle] = useState((params.title as string) || '');
  const [selectedColor, setSelectedColor] = useState((params.color as string) || GOAL_COLORS[0]);
  const [finishedEmoji, setFinishedEmoji] = useState((params.emoji as string) || '😊');
  const [trackEntireActivity, setTrackEntireActivity] = useState(params.trackEntireActivity === 'true');
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    try {
      return JSON.parse((params.selectedDays as string) || '[]');
    } catch {
      return [];
    }
  });
  const [duration, setDuration] = useState((params.duration as string) || '2h');
  const [selectedChecklist, setSelectedChecklist] = useState<{ title: string; icon: string; index: number } | null>(null);
  const [shortcuts, setShortcuts] = useState('None');

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showChecklistPicker, setShowChecklistPicker] = useState(false);
  const [availableChecklists, setAvailableChecklists] = useState<{ title: string; icon: string; index: number }[]>([]);

  useEffect(() => {
    loadChecklists();
    loadGoalData();
  }, []);

  const loadChecklists = () => {
    const lists = getChecklists();
    setAvailableChecklists(lists.map((c, i) => ({
      title: c.title,
      icon: c.icon || 'list-outline',
      index: i
    })));
  };

  const loadGoalData = () => {
    const goals = getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setGoalTitle(goal.title);
      setSelectedColor(goal.color);
      setFinishedEmoji(goal.emoji);
      setTrackEntireActivity(goal.trackEntireActivity !== false);
      setSelectedDays(goal.selectedDays || []);
      setDuration(goal.duration || '2h');
      if (goal.checklist) setSelectedChecklist(goal.checklist);
      if (goal.shortcuts) setShortcuts(goal.shortcuts);
    }
  };

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const getSelectedDaysDisplay = () => {
    if (selectedDays.length === 0) return 'Select days';
    if (selectedDays.length === 7) return 'Every Day';
    return selectedDays.map(dayId => weekDays.find(d => d.id === dayId)?.label).join(', ');
  };

  const handleSave = () => {
    if (!goalTitle.trim()) {
      Alert.alert('Required', 'Please enter a goal title.');
      return;
    }

    const goals = getGoals();
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          title: goalTitle.trim(),
          color: selectedColor,
          emoji: finishedEmoji,
          trackEntireActivity: trackEntireActivity,
          selectedDays: selectedDays,
          duration: duration,
          checklist: selectedChecklist,
          shortcuts: shortcuts,
        };
      }
      return g;
    });

    updateGoal(goalId, updatedGoals.find(g => g.id === goalId)!);
    Alert.alert('Saved', 'Goal updated successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGoal(goalId);
            router.back();
          }
        }
      ]
    );
  };

  const SettingRow = ({ label, value, onPress, rightElement }: any) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {rightElement ? rightElement : <Text style={styles.settingValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={16} color="#555" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Goal</Text>
        <TouchableOpacity onPress={handleSave}>
          <View style={styles.saveButtonContainer}>
            <Text style={styles.saveButtonText}>Save</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={[styles.previewIconContainer, { backgroundColor: selectedColor + '20' }]}>
            <Text style={[styles.previewEmoji, { color: selectedColor }]}>{finishedEmoji}</Text>
          </View>
          <Text style={styles.previewName}>{goalTitle || 'Goal Title'}</Text>
        </View>

        {/* Goal Title */}
        <TextInput
          style={styles.titleInput}
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="Goal title"
          placeholderTextColor="#555"
        />

        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>Appearance</Text>

        <SettingRow
          label="Color"
          value=""
          onPress={() => setShowColorPicker(true)}
          rightElement={
            <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
          }
        />

        <SettingRow
          label="Finished Emoji"
          value={finishedEmoji}
          onPress={() => setShowEmojiPicker(true)}
        />

        {/* Goal Settings Section */}
        <Text style={styles.sectionTitle}>Goal Settings</Text>

        <SettingRow
          label="Track Entire Activity"
          rightElement={
            <Switch
              value={trackEntireActivity}
              onValueChange={setTrackEntireActivity}
              trackColor={{ false: '#333', true: '#fff' }}
              thumbColor={trackEntireActivity ? '#fff' : '#888'}
            />
          }
        />

        <SettingRow
          label="Repeat On"
          value={getSelectedDaysDisplay()}
          onPress={() => setShowDayPicker(true)}
        />

        <SettingRow
          label="Duration"
          value={duration}
          onPress={() => {
            Alert.alert('Set Duration', '', [
              { text: '30 min', onPress: () => setDuration('30 min') },
              { text: '1h', onPress: () => setDuration('1h') },
              { text: '2h', onPress: () => setDuration('2h') },
              { text: '3h', onPress: () => setDuration('3h') },
              { text: '4h', onPress: () => setDuration('4h') },
              { text: 'Custom', onPress: () => setDuration('Custom') },
            ]);
          }}
        />

        <SettingRow
          label="Checklist"
          value={selectedChecklist?.title || 'None'}
          onPress={() => setShowChecklistPicker(true)}
        />

        <SettingRow
          label="Shortcuts"
          value={shortcuts}
          onPress={() => router.push('/goal-shortcuts')}
        />

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Delete Button - Bottom Left without background */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
        <Text style={styles.deleteButtonText}>Delete Goal</Text>
      </TouchableOpacity>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Color</Text>
                  <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                    <View style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={GOAL_COLORS}
                  numColumns={4}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.colorItem,
                        { backgroundColor: item },
                        selectedColor === item && styles.colorItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedColor(item);
                        setShowColorPicker(false);
                      }}
                    />
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Emoji Picker Modal */}
      <Modal visible={showEmojiPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowEmojiPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Emoji</Text>
                  <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                    <View style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={emojiOptions}
                  numColumns={4}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.emojiItem,
                        finishedEmoji === item && styles.emojiItemSelected,
                      ]}
                      onPress={() => {
                        setFinishedEmoji(item);
                        setShowEmojiPicker(false);
                      }}
                    >
                      <Text style={styles.emojiText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Day Picker Modal */}
      <Modal visible={showDayPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDayPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Days</Text>
                  <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                    <View style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Choose which days to repeat this goal</Text>
                <View style={styles.daysGrid}>
                  {weekDays.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.dayButton,
                        selectedDays.includes(day.id) && styles.dayButtonSelected,
                      ]}
                      onPress={() => toggleDay(day.id)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        selectedDays.includes(day.id) && styles.dayButtonTextSelected,
                      ]}>{day.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedDays.length === 7 && (
                  <Text style={styles.hintText}>Every day selected</Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Checklist Picker Modal */}
      <Modal visible={showChecklistPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowChecklistPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Checklist</Text>
                  <TouchableOpacity onPress={() => setShowChecklistPicker(false)}>
                    <View style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {availableChecklists.length === 0 ? (
                  <View style={styles.noChecklistsContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#333" />
                    <Text style={styles.noChecklistsTitle}>No Checklists Yet</Text>
                    <Text style={styles.noChecklistsText}>
                      Create checklists from the Settings page first.
                    </Text>
                    <TouchableOpacity
                      style={styles.createChecklistButton}
                      onPress={() => {
                        setShowChecklistPicker(false);
                        router.push('/new-checklist');
                      }}
                    >
                      <Text style={styles.createChecklistButtonText}>Create Checklist</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <FlatList
                      data={availableChecklists}
                      keyExtractor={(_, i) => i.toString()}
                      renderItem={({ item }) => {
                        const isSelected = selectedChecklist?.index === item.index;
                        return (
                          <TouchableOpacity
                            style={[styles.checklistItem, isSelected && styles.checklistItemSelected]}
                            onPress={() => {
                              setSelectedChecklist(item);
                              setShowChecklistPicker(false);
                            }}
                          >
                            <View style={styles.checklistItemLeft}>
                              <Ionicons name={item.icon as any || 'list-outline'} size={24} color={isSelected ? '#fff' : '#888'} />
                              <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextSelected]}>
                                {item.title}
                              </Text>
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            )}
                          </TouchableOpacity>
                        );
                      }}
                    />
                    <TouchableOpacity
                      style={styles.createNewButton}
                      onPress={() => {
                        setShowChecklistPicker(false);
                        router.push('/new-checklist');
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#fff" />
                      <Text style={styles.createNewText}>Create New Checklist</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerCancel: {
    color: '#fff',
    fontSize: 17,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    marginVertical: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    gap: 12,
  },
  previewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  titleInput: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    color: '#888',
    fontSize: 15,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  colorItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 8,
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.05 }],
  },
  emojiItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    margin: 4,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  emojiItemSelected: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
  },
  emojiText: {
    fontSize: 32,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  dayButtonSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  dayButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: '#000',
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  checklistItemSelected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  checklistItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checklistItemText: {
    color: '#fff',
    fontSize: 16,
  },
  checklistItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  noChecklistsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noChecklistsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  noChecklistsText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createChecklistButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  createChecklistButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  createNewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
