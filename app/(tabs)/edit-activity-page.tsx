// app/edit-activity-page.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getActivities, setActivities, updateGoal, Activity } from '../activitiesStore';

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
  const activityId = params.id as string;

  // Load activity data from store
  const activity = getActivities().find(a => a.id === activityId);

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Form states - initialize from store
  const [formName, setFormName] = useState(params.name as string || activity?.name || '');
  const [formIcon, setFormIcon] = useState(params.icon as string || activity?.icon || 'folder-outline');
  const [formColor, setFormColor] = useState(params.color as string || activity?.color || '#FF6B6B');
  const [formPomodoro, setFormPomodoro] = useState(params.pomodoro as string || String(activity?.pomodoro || '25'));

  const handleSave = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter an activity name.');
      return;
    }

    const activities = getActivities();
    const updatedActivities = activities.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          name: formName.trim(),
          icon: formIcon,
          color: formColor,
          pomodoro: parseInt(formPomodoro) || 25,
        };
      }
      return a;
    });

    setActivities(updatedActivities);
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
            const activities = getActivities();
            const filtered = activities.filter(a => a.id !== activityId);
            setActivities(filtered);
            router.back();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Activity</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerRight}>
          <View style={styles.doneButtonContainer}>
            <Text style={styles.doneButton}>Save</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Activity Preview Card */}
        <View style={styles.previewCard}>
          <View style={[styles.previewIconContainer, { backgroundColor: formColor + '20' }]}>
            <Ionicons name={formIcon} size={32} color={formColor} />
          </View>
          <Text style={styles.previewName}>{formName || 'Activity Name'}</Text>
        </View>

        {/* Activity Name */}
        <View style={styles.section}>
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

        {/* Checklists */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/goal-checklists')}>
            <View style={styles.optionLeft}>
              <Ionicons name="checkbox-outline" size={20} color="#888" />
              <Text style={styles.optionLabel}>Manage Checklists</Text>
            </View>
            <View style={styles.optionRight}>
              <Text style={styles.optionValue}>None</Text>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/new-shortcut')}>
            <View style={styles.optionLeft}>
              <Ionicons name="link-outline" size={20} color="#888" />
              <Text style={styles.optionLabel}>Manage Shortcuts</Text>
            </View>
            <View style={styles.optionRight}>
              <Text style={styles.optionValue}>None</Text>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    top: 60,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    top: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  doneButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  doneButton: {
    color: '#000',
    fontSize: 13,
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
  deleteButton: {
    position: 'absolute',
    bottom: 10,
    left: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 17,
    fontWeight: '400',
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
  optionValue: {
    color: '#888',
    fontSize: 13,
    marginRight: 8,
  },
});
