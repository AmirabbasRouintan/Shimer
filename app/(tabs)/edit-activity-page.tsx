// app/edit-activity-page.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getActivities, setActivities, getGoalsForActivity, linkGoalToActivity, unlinkGoalFromActivity, getChecklists, linkActivityToChecklist, getChecklistForActivity, unlinkActivityFromChecklist } from '../activitiesStore';

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
  const [linkedGoals, setLinkedGoals] = useState<any[]>([]);
  const [linkedChecklist, setLinkedChecklist] = useState<{ title: string; icon: string; index: number } | null>(null);

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChecklistPicker, setShowChecklistPicker] = useState(false);
  const [availableChecklists, setAvailableChecklists] = useState<{ title: string; icon: string; index: number }[]>([]);

  // Form states - initialize from store
  const [formName, setFormName] = useState(params.name as string || activity?.name || '');
  const [formIcon, setFormIcon] = useState(params.icon as string || activity?.icon || 'folder-outline');
  const [formColor, setFormColor] = useState(params.color as string || activity?.color || '#FF6B6B');
  const [formPomodoro, setFormPomodoro] = useState(params.pomodoro as string || String(activity?.pomodoro || '25'));

  useEffect(() => {
    loadLinkedGoals();
    loadLinkedChecklist();
    loadChecklists();
  }, [activityId]);

  const loadLinkedGoals = () => {
    const goals = getGoalsForActivity(activityId);
    setLinkedGoals(goals);
  };

  const loadLinkedChecklist = () => {
    const checklist = getChecklistForActivity(activityId);
    setLinkedChecklist(checklist);
  };

  const loadChecklists = () => {
    const lists = getChecklists();
    setAvailableChecklists(lists.map((c, i) => ({
      title: c.title,
      icon: c.icon || 'list-outline',
      index: i
    })));
  };

  const handleUnlinkGoal = (goalId: number) => {
    Alert.alert(
      'Remove Goal',
      'Remove this goal from the activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            unlinkGoalFromActivity(activityId, goalId);
            loadLinkedGoals();
          }
        }
      ]
    );
  };

  const handleUnlinkChecklist = () => {
    Alert.alert(
      'Remove Checklist',
      'Remove this checklist from the activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            unlinkActivityFromChecklist(activityId);
            setLinkedChecklist(null);
          }
        }
      ]
    );
  };

  const handleSelectChecklist = (checklist: { title: string; icon: string; index: number }) => {
    linkActivityToChecklist(activityId, checklist.index);
    setLinkedChecklist(checklist);
    setShowChecklistPicker(false);
  };

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
      'Delete',
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
            router.replace('/edit_things');
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

        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>

          {linkedGoals.map((goal) => (
            <View key={goal.id} style={styles.linkedGoalItem}>
              <View style={styles.linkedGoalLeft}>
                <View style={[styles.goalColorDot, { backgroundColor: goal.color }]} />
                <Text style={styles.linkedGoalTitle}>{goal.title}</Text>
              </View>
              <TouchableOpacity onPress={() => handleUnlinkGoal(goal.id)}>
                <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Goal Button - Original style */}
          <TouchableOpacity
            style={styles.newGoalRow}
            onPress={() => router.push({
              pathname: '/add-new-goal',
              params: {
                activityId: activityId,
                activityName: formName
              }
            })}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="flag-outline" size={20} color="#888" />
              <Text style={styles.optionLabel}>Add Goal</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Checklist Section - Below Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist</Text>

          {linkedChecklist ? (
            <View style={styles.linkedChecklistItem}>
              <View style={styles.linkedChecklistLeft}>
                <Ionicons name={linkedChecklist.icon as any || 'list-outline'} size={20} color="#fff" />
                <Text style={styles.linkedChecklistTitle}>{linkedChecklist.title}</Text>
              </View>
              <TouchableOpacity onPress={handleUnlinkChecklist}>
                <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.newChecklistRow}
              onPress={() => setShowChecklistPicker(true)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="list-outline" size={20} color="#888" />
                <Text style={styles.optionLabel}>Link Checklist</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          )}
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
                    const isSelected = linkedChecklist?.index === item.index;
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
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  // Goals Styles
  linkedGoalItem: {
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
  linkedGoalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  goalColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  linkedGoalTitle: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
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
  // Checklist Styles
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
  deleteButton: {
    position: 'absolute',
    bottom: 10,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
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
  // Checklist Picker Styles
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
