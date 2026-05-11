// app/add-activity-page.tsx
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
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const iconOptions = [
  'folder-outline',
  'school-outline',
  'book-outline',
  'film-outline',
  'leaf-outline',
  'briefcase-outline',
  'heart-outline',
  'fitness-outline',
  'walk-outline',
  'bed-outline',
  'cafe-outline',
  'musical-notes-outline',
  'game-controller-outline',
  'laptop-outline',
  'cart-outline',
  'airplane-outline',
  'home-outline',
  'camera-outline',
  'pencil-outline',
  'calendar-outline',
  'time-outline',
  'star-outline',
  'flame-outline',
];

const colorOptions = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7B731',
  '#FF9F4A',
  '#E8635E',
  '#6C5CE7',
  '#A8E6CF',
];

export default function AddActivityPage() {
  const router = useRouter();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('folder-outline');
  const [formColor, setFormColor] = useState('#FF6B6B');
  const [formKeepScreenOn, setFormKeepScreenOn] = useState(false);
  const [formPomodoro, setFormPomodoro] = useState('25');
  const [formGoals, setFormGoals] = useState('');
  const [formTimerHints, setFormTimerHints] = useState('');

  const handleCreate = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter an activity name.');
      return;
    }

    // Check for duplicate activity name
    // You would typically check against existing activities here
    // For now, we'll just show success

    Alert.alert('Success', 'Activity created successfully!', [
      {
        text: 'OK',
        onPress: () => {
          // Here you would save the new activity to your state management/storage
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Activity</Text>
        <TouchableOpacity onPress={handleCreate}>
          <Text style={styles.createButton}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View
            style={[
              styles.previewIconContainer,
              { backgroundColor: formColor + '20' },
            ]}
          >
            <Ionicons name={formIcon} size={48} color={formColor} />
          </View>
          <Text style={styles.previewName}>
            {formName || 'New Activity'}
          </Text>
          <Text style={styles.previewHint}>
            This is how your activity will appear
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Activity Name"
            placeholderTextColor="#555"
            value={formName}
            onChangeText={setFormName}
            autoFocus
          />
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowIconPicker(true)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="image-outline" size={22} color="#888" />
              <Text style={styles.optionLabel}>Icon</Text>
            </View>
            <View style={styles.optionRight}>
              <Ionicons name={formIcon} size={28} color="#888" />
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowColorPicker(true)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="color-palette-outline" size={22} color="#888" />
              <Text style={styles.optionLabel}>Color</Text>
            </View>
            <View style={styles.optionRight}>
              <View
                style={[styles.colorPreview, { backgroundColor: formColor }]}
              />
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Timer Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timer Settings</Text>

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="desktop-outline" size={22} color="#888" />
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
              <Ionicons name="timer-outline" size={22} color="#888" />
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
              <Text style={styles.pomodoroUnit}>minutes</Text>
            </View>
          </View>
        </View>

        {/* Goals & Hints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals & Hints</Text>

          <View style={styles.textAreaContainer}>
            <Text style={styles.textAreaLabel}>Goals (Optional)</Text>
            <TextInput
              style={styles.textArea}
              value={formGoals}
              onChangeText={setFormGoals}
              placeholder="Set your goals for this activity..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.textAreaContainer}>
            <Text style={styles.textAreaLabel}>Timer Hints (Optional)</Text>
            <TextInput
              style={styles.textArea}
              value={formTimerHints}
              onChangeText={setFormTimerHints}
              placeholder="Add helpful hints for timer sessions..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

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
                    size={32}
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
  createButton: {
    color: '#4ECDC4',
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  previewCard: {
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    margin: 20,
    padding: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  previewIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewHint: {
    color: '#666',
    fontSize: 12,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    color: '#fff',
    fontSize: 18,
    backgroundColor: '#0a0a0a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#333',
  },
  pomodoroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pomodoroInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  pomodoroUnit: {
    color: '#888',
    fontSize: 14,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  textAreaLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: {
    color: '#fff',
    fontSize: 15,
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    textAlignVertical: 'top',
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
    paddingVertical: 16,
    margin: 4,
    borderRadius: 12,
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
