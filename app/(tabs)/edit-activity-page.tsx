// app/edit-activity-page.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const iconOptions = [
  'folder-outline', 'school-outline', 'book-outline', 'film-outline',
  'leaf-outline', 'briefcase-outline', 'heart-outline', 'fitness-outline',
  'walk-outline', 'bed-outline', 'cafe-outline', 'musical-notes-outline',
  'game-controller-outline', 'laptop-outline', 'cart-outline',
  'airplane-outline', 'home-outline', 'camera-outline', 'pencil-outline',
  'calendar-outline', 'time-outline', 'star-outline', 'flame-outline',
];

const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7', '#A8E6CF',
];

export default function EditActivityPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Form states
  const [formName, setFormName] = useState(params.name as string || '');
  const [formIcon, setFormIcon] = useState(params.icon as string || 'folder-outline');
  const [formColor, setFormColor] = useState(params.color as string || '#FF6B6B');
  const [formKeepScreenOn, setFormKeepScreenOn] = useState(params.keepScreenOn === 'true');
  const [formPomodoro, setFormPomodoro] = useState(params.pomodoro as string || '25');
  const [formGoals, setFormGoals] = useState(params.goals as string || '');
  const [formTimerHints, setFormTimerHints] = useState(params.timerHints as string || '');

  const handleSave = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter an activity name.');
      return;
    }

    Alert.alert('Success', 'Activity updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${formName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', 'Activity has been deleted', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Activity</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Activity Preview Card - Smaller */}
        <View style={styles.previewCard}>
          <View style={[styles.previewIconContainer, { backgroundColor: formColor + '20' }]}>
            <Ionicons name={formIcon} size={32} color={formColor} />
          </View>
          <Text style={styles.previewName}>{formName || 'Activity Name'}</Text>
        </View>

        {/* Activity Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Activity Name"
            placeholderTextColor="#555"
            value={formName}
            onChangeText={setFormName}
          />
        </View>

        {/* Icon Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <TouchableOpacity style={styles.optionRow} onPress={() => setShowIconPicker(true)}>
            <View style={styles.optionLeft}>
              <Ionicons name="image-outline" size={20} color="#888" />
              <Text style={styles.optionLabel}>Icon</Text>
            </View>
            <View style={styles.optionRight}>
              <Ionicons name={formIcon} size={22} color="#888" />
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setShowColorPicker(true)}>
            <View style={styles.optionLeft}>
              <Ionicons name="color-palette-outline" size={20} color="#888" />
              <Text style={styles.optionLabel}>Color</Text>
            </View>
            <View style={styles.optionRight}>
              <View style={[styles.colorPreview, { backgroundColor: formColor }]} />
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Timer Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timer Settings</Text>

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="desktop-outline" size={20} color="#888" />
              <Text style={styles.optionLabel}>Keep Screen On</Text>
            </View>
            <Switch
              value={formKeepScreenOn}
              onValueChange={setFormKeepScreenOn}
              trackColor={{ false: '#333', true: '#666' }}
              thumbColor={formKeepScreenOn ? '#fff' : '#888'}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="timer-outline" size={20} color="#888" />
              <Text style={styles.optionLabel}>Pomodoro Duration</Text>
            </View>
            <View style={styles.pomodoroContainer}>
              <TextInput
                style={styles.pomodoroInput}
                value={formPomodoro}
                onChangeText={setFormPomodoro}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor="#555"
              />
              <Text style={styles.pomodoroUnit}>min</Text>
            </View>
          </View>
        </View>

        {/* Goals & Hints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals & Hints</Text>

          <View style={styles.textAreaContainer}>
            <Text style={styles.textAreaLabel}>Goals</Text>
            <TextInput
              style={styles.textArea}
              value={formGoals}
              onChangeText={setFormGoals}
              placeholder="Set your goals for this activity..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.textAreaContainer}>
            <Text style={styles.textAreaLabel}>Timer Hints</Text>
            <TextInput
              style={styles.textArea}
              value={formTimerHints}
              onChangeText={setFormTimerHints}
              placeholder="Add helpful hints for timer sessions..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          <Text style={styles.deleteButtonText}>Delete Activity</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose Icon</Text>
              <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={iconOptions}
              numColumns={4}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconItem,
                    formIcon === item && styles.iconItemSelected,
                  ]}
                  onPress={() => {
                    setFormIcon(item);
                    setShowIconPicker(false);
                  }}
                >
                  <Ionicons
                    name={item}
                    size={28}
                    color={formIcon === item ? '#fff' : '#888'}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose Color</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={colorOptions}
              numColumns={4}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.colorItem,
                    { backgroundColor: item },
                    formColor === item && styles.colorItemSelected,
                  ]}
                  onPress={() => {
                    setFormColor(item);
                    setShowColorPicker(false);
                  }}
                />
              )}
            />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    color: '#4ECDC4',
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    margin: 16,
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
  previewName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 15,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  pomodoroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pomodoroInput: {
    color: '#fff',
    fontSize: 15,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 50,
    textAlign: 'center',
  },
  pomodoroUnit: {
    color: '#888',
    fontSize: 13,
  },
  textAreaContainer: {
    marginBottom: 12,
  },
  textAreaLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
  },
  textArea: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B30',
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  pickerContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  iconItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    margin: 4,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  iconItemSelected: {
    backgroundColor: '#333',
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
  },
});
