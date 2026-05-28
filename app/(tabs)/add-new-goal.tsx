import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addGoal } from '../activitiesStore';
import CustomAlert from '../components/CustomAlert';

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
  '#FF6B6B', '#fff', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7', '#A8E6CF',
  '#FF8C42', '#4A90E2', '#50E3C2', '#F5A623', '#7ED321', '#9013FE',
  '#417505', '#BD10E0', '#8B572A', '#2C3E50', '#E91E63', '#9B59B6',
];

export default function AddNewGoal() {
  const router = useRouter();

  const [goalTitle, setGoalTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [finishedEmoji, setFinishedEmoji] = useState('😊');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [duration, setDuration] = useState('2h');

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showRequiredAlert, setShowRequiredAlert] = useState(false);
  const [showSavedAlert, setShowSavedAlert] = useState(false);

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
      setShowRequiredAlert(true);
      return;
    }

    const nextId = Date.now();
    addGoal({
      id: nextId,
      title: goalTitle.trim(),
      color: selectedColor,
      emoji: finishedEmoji,
      progress: 0,
      remainingSeconds: null,
      totalSeconds: null,
      isActive: false,
      isCompleted: false,
      widthPercent: 100,
      selectedDays: selectedDays,
      duration: duration,
      trackEntireActivity: true,
    });
    setShowSavedAlert(true);
  };

  const SettingRow = ({ icon, label, value, onPress, rightElement }: any) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.optionLeft}>
        {icon && <Ionicons name={icon} size={20} color="#888" />}
        <Text style={styles.optionLabel}>{label}</Text>
      </View>
      <View style={styles.optionRight}>
        {rightElement ? rightElement : <Text style={styles.optionValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={16} color="#555" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Goal</Text>
        <TouchableOpacity onPress={handleSave}>
          <View style={styles.saveButtonContainer}>
            <Text style={styles.saveButtonText}>Save</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.previewCard}>
          <View style={[styles.previewIconContainer, { backgroundColor: selectedColor + '20' }]}>
            <Text style={[styles.previewEmoji, { color: selectedColor }]}>{finishedEmoji}</Text>
          </View>
          <Text style={styles.previewName}>{goalTitle || 'Goal Title'}</Text>
        </View>

        <TextInput
          style={styles.titleInput}
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="Goal title"
          placeholderTextColor="#555"
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <SettingRow
            icon="color-palette-outline"
            label="Color"
            value=""
            onPress={() => setShowColorPicker(true)}
            rightElement={
              <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
            }
          />

          <SettingRow
            icon="happy-outline"
            label="Finished Emoji"
            value={finishedEmoji}
            onPress={() => setShowEmojiPicker(true)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal Settings</Text>

          <SettingRow
            icon="calendar-outline"
            label="Repeat On"
            value={getSelectedDaysDisplay()}
            onPress={() => setShowDayPicker(true)}
          />

          <SettingRow
            icon="timer-outline"
            label="Duration"
            value={duration}
            onPress={() => setShowDurationPicker(true)}
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <CustomAlert
        visible={showRequiredAlert}
        title="Required"
        message="Please enter a goal title."
        onConfirm={() => setShowRequiredAlert(false)}
        singleButton
      />

      <CustomAlert
        visible={showSavedAlert}
        title="Saved"
        message="Goal created successfully"
        onConfirm={() => router.back()}
        singleButton
      />

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

      <Modal visible={showDurationPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDurationPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Set Duration</Text>
                  <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                    <View style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {['30 min', '1h', '2h', '3h', '4h', 'Custom'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.durationOption,
                      duration === opt && styles.durationOptionSelected,
                    ]}
                    onPress={() => {
                      setDuration(opt);
                      setShowDurationPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.durationOptionText,
                      duration === opt && styles.durationOptionTextSelected,
                    ]}>{opt}</Text>
                    {duration === opt && <Ionicons name="checkmark" size={20} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  headerCancel: { color: '#fff', fontSize: 17 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  saveButtonContainer: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  saveButtonText: { color: '#000', fontSize: 13, fontWeight: '600' },
  content: { flex: 1 },
  section: { marginHorizontal: 16, marginBottom: 20 },
  previewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', margin: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', gap: 12 },
  previewIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  previewEmoji: { fontSize: 28 },
  previewName: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  titleInput: { color: '#fff', fontSize: 16, backgroundColor: '#0a0a0a', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0a', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#1a1a1a' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionLabel: { color: '#fff', fontSize: 15 },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionValue: { color: '#888', fontSize: 15 },
  colorPreview: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  closeButton: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  closeButtonText: { color: '#000', fontSize: 14, fontWeight: '600' },
  colorItem: { flex: 1, aspectRatio: 1, margin: 8, borderRadius: 8 },
  colorItemSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.05 }] },
  emojiItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, margin: 4, borderRadius: 10, backgroundColor: '#2a2a2a' },
  emojiItemSelected: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#fff' },
  emojiText: { fontSize: 32 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 16 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  dayButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#444' },
  dayButtonSelected: { backgroundColor: '#fff', borderColor: '#fff' },
  dayButtonText: { color: '#888', fontSize: 16, fontWeight: '600' },
  dayButtonTextSelected: { color: '#000' },
  hintText: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 12 },
  durationOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#2a2a2a' },
  durationOptionSelected: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' },
  durationOptionText: { color: '#fff', fontSize: 16 },
  durationOptionTextSelected: { color: '#fff', fontWeight: '600' },
});
