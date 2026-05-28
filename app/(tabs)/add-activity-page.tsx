// app/add-activity-page.tsx
import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { shadcn } from '../../constants/components-theme';
import { getActivities, setActivities, Activity, getChecklists, linkActivityToChecklist } from '../activitiesStore';

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
  '#FF6B6B', // Red
  '#fff', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Mint
  '#FFEAA7', // Yellow
  '#DDA0DD', // Purple
  '#98D8C8', // Light Mint
  '#F7B731', // Orange
  '#FF9F4A', // Light Orange
  '#E8635E', // Dark Red
  '#6C5CE7', // Indigo
  '#A8E6CF', // Pale Green
  '#FF8C42', // Dark Orange
  '#4A90E2', // Bright Blue
  '#50E3C2', // Turquoise
  '#F5A623', // Gold
  '#7ED321', // Lime Green
  '#9013FE', // Bright Purple
  '#417505', // Dark Green
  '#BD10E0', // Magenta
  '#8B572A', // Brown
  '#2C3E50', // Navy
  '#E91E63', // Pink
  '#9B59B6', // Deep Purple
  '#1ABC9C', // Dark Teal
  '#3498DB', // Light Blue
  '#E67E22', // Pumpkin
  '#2ECC71', // Emerald
  '#F1C40F', // Sunflower
  '#E74C3C', // Crimson
  '#34495E', // Wet Asphalt
  '#16A085', // Green Sea
  '#27AE60', // Nephritis
  '#2980B9', // Belize Hole
  '#8E44AD', // Wisteria
  '#F39C12', // Orange
  '#D35400', // Pumpkin
  '#C0392B', // Pomegranate
  '#7F8C8D', // Gray
  '#95A5A6', // Concrete
];

export default function AddActivityPage() {
  const router = useRouter();

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChecklistPicker, setShowChecklistPicker] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('folder-outline');
  const [formColor, setFormColor] = useState('#FF6B6B');
  const [formKeepScreenOn, setFormKeepScreenOn] = useState(false);
  const [formPomodoro, setFormPomodoro] = useState('25');
  const [formGoals, setFormGoals] = useState('');
  const [formTimerHints, setFormTimerHints] = useState('');

  // Checklist state
  const [selectedChecklist, setSelectedChecklist] = useState<{ title: string; icon: string; index: number } | null>(null);
  const [availableChecklists, setAvailableChecklists] = useState<{ title: string; icon: string; index: number }[]>([]);

  // Load checklists
  const loadChecklists = () => {
    const lists = getChecklists();
    setAvailableChecklists(lists.map((c, i) => ({
      title: c.title,
      icon: c.icon || 'list-outline',
      index: i
    })));
  };

  // Clear form when screen is focused
  useFocusEffect(
    useCallback(() => {
      setFormName('');
      setFormIcon('folder-outline');
      setFormColor('#FF6B6B');
      setFormKeepScreenOn(false);
      setFormPomodoro('25');
      setFormGoals('');
      setFormTimerHints('');
      setSelectedChecklist(null);
      loadChecklists();
    }, [])
  );

  const getNextId = () => {
    const activities = getActivities();
    const maxId = Math.max(...activities.map(a => parseInt(a.id)), 0);
    return (maxId + 1).toString();
  };

  const handleSelectChecklist = (checklist: { title: string; icon: string; index: number }) => {
    setSelectedChecklist(checklist);
    setShowChecklistPicker(false);
  };

  const handleUnlinkChecklist = () => {
    setSelectedChecklist(null);
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter an activity name.');
      return;
    }

    const currentActivities = getActivities();

    // Check for duplicate activity name
    if (currentActivities.some(a => a.name.toLowerCase() === formName.trim().toLowerCase())) {
      Alert.alert('Duplicate', 'An activity with this name already exists.');
      return;
    }

    const newActivity: Activity = {
      id: getNextId(),
      name: formName.trim(),
      icon: formIcon,
      color: formColor,
      keepScreenOn: formKeepScreenOn,
      pomodoro: parseInt(formPomodoro) || 25,
      goals: formGoals,
      timerHints: formTimerHints,
      checklists: [],
      shortcuts: [],
      linkedChecklistIndex: selectedChecklist?.index ?? null,
    };

    setActivities([...currentActivities, newActivity]);

  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/edit_things')} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={25} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Activity</Text>
        <TouchableOpacity onPress={handleCreate} style={styles.headerRight}>
          <View style={styles.createButtonContainer}>
            <Text style={styles.createButtonText}>Create</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Preview Card - Smaller */}
        <View style={styles.previewCard}>
          <View
            style={[
              styles.previewIconContainer,
              { backgroundColor: formColor + '20' },
            ]}
          >
            <Ionicons name={formIcon} size={32} color={formColor} />
          </View>
          <Text style={styles.previewName}>
            {formName || 'New Activity'}
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
              <Ionicons name="image-outline" size={18} color="#888" />
              <Text style={styles.optionLabel}>Icon</Text>
            </View>
            <View style={styles.optionRight}>
              <Ionicons name={formIcon} size={20} color="#888" />
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowColorPicker(true)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="color-palette-outline" size={18} color="#888" />
              <Text style={styles.optionLabel}>Color</Text>
            </View>
            <View style={styles.optionRight}>
              <View
                style={[styles.colorPreview, { backgroundColor: formColor }]}
              />
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Timer Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timer Settings</Text>

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="timer-outline" size={18} color="#888" />
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

        {/* Goals Section - Placeholder for now */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <TouchableOpacity
            style={styles.newGoalRow}
            onPress={() => {
              Alert.alert('Coming Soon', 'You can add goals after creating the activity.');
            }}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="flag-outline" size={20} color="#888" />
              <Text style={styles.optionLabel}>Add Goal</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Checklist Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist</Text>

          {selectedChecklist ? (
            <View style={styles.linkedChecklistItem}>
              <View style={styles.linkedChecklistLeft}>
                <Ionicons name={selectedChecklist.icon as any || 'list-outline'} size={20} color="#fff" />
                <Text style={styles.linkedChecklistTitle}>{selectedChecklist.title}</Text>
              </View>
              <TouchableOpacity onPress={handleUnlinkChecklist}>
                <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.newChecklistRow}
              onPress={() => {
                loadChecklists(); // Refresh checklists before showing
                setShowChecklistPicker(true);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="list-outline" size={20} color="#888" />
                <Text style={styles.optionLabel}>Link Checklist</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          )}
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
                    size={24}
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

      {/* Checklist Picker Modal */}
      <Modal visible={showChecklistPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Checklist</Text>
              <TouchableOpacity onPress={() => setShowChecklistPicker(false)}>
                <Ionicons name="close" size={24} color="#fff" />
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
                        onPress={() => handleSelectChecklist(item)}
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
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    width: 70,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 70,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: "600",
    textAlign: 'center',
    flex: 1,
  },
  createButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createButtonText: {
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
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
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
    paddingVertical: 10,
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
    fontSize: 14,
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
    fontSize: 14,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 50,
    textAlign: 'center',
  },
  pomodoroUnit: {
    color: '#888',
    fontSize: 12,
  },
  newGoalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  linkedChecklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  linkedChecklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  linkedChecklistTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  newChecklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
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
    margin: 6,
    borderRadius: 8,
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: '#fff',
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
    backgroundColor: 'rgba(78,205,196,0.1)',
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
