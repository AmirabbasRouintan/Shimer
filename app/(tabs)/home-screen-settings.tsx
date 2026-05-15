// app/home-customize.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Modal, TextInput, ScrollView,
  FlatList, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import DragList from 'react-native-draglist';
import { getChecklists, setSelectedChecklistIndex, getSelectedChecklistIndex, getShowChecklistOnHome, setShowChecklistOnHome, getGoals, setGoals, addGoal, updateGoal, deleteGoal, subscribe, Goal } from '../activitiesStore';

const { width: screenWidth } = Dimensions.get('window');

const GOAL_COLORS = [
  '#4ECDC4', '#FF6B6B', '#FFEAA7', '#DDA0DD', '#45B7D1',
  '#96CEB4', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7',
];
const GOAL_HEIGHT = 28;
const GAP = 8;
const CONTAINER_WIDTH = screenWidth - 32;

export default function HomeCustomizeScreen() {
  const router = useRouter();
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalColor, setNewGoalColor] = useState(GOAL_COLORS[0]);
  const [availableChecklists, setAvailableChecklists] = useState<{ title: string; icon: string; index: number }[]>([]);
  const [showChecklistOnHome, setShowChecklistOnHomeState] = useState(getShowChecklistOnHome());

  useFocusEffect(
    useCallback(() => {
      loadChecklists();
      setShowChecklistOnHomeState(getShowChecklistOnHome());
      setGoalsState(getGoals());
    }, [])
  );

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      loadChecklists();
      setShowChecklistOnHomeState(getShowChecklistOnHome());
      setGoalsState(getGoals());
    });
    return unsubscribe;
  }, []);

  const loadChecklists = () => {
    const lists = getChecklists();
    setAvailableChecklists(lists.map((c, i) => ({
      title: c.title,
      icon: c.icon || 'list-outline',
      index: i
    })));
  };

  const saveGoalsToStore = (newGoals: Goal[]) => {
    setGoalsState(newGoals);
    setGoals(newGoals);
  };

  const toggleChecklistOnHome = (value: boolean) => {
    setShowChecklistOnHomeState(value);
    setShowChecklistOnHome(value);
  };

  const getNextId = () => {
    const currentGoals = getGoals();
    const maxId = currentGoals.reduce((max, g) => Math.max(max, g.id), 0);
    return maxId + 1;
  };

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Required', 'Please enter a goal title');
      return;
    }
    const newGoal: Goal = {
      id: getNextId(),
      title: newGoalTitle.trim(),
      progress: 0,
      color: newGoalColor,
      emoji: '⭐',
      isActive: false,
      isCompleted: false,
      widthPercent: 100,
      remainingSeconds: null,
    };
    addGoal(newGoal);
    setGoalsState(getGoals());
    setNewGoalTitle('');
    setNewGoalColor(GOAL_COLORS[0]);
    setShowAddModal(false);
  };

  const handleEditGoal = () => {
    if (!editingGoal) return;
    if (!editingGoal.title.trim()) {
      Alert.alert('Required', 'Please enter a goal title');
      return;
    }
    updateGoal(editingGoal.id, editingGoal);
    setGoalsState(getGoals());
    setShowEditModal(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = () => {
    if (!editingGoal) return;
    Alert.alert('Delete Goal', `Delete "${editingGoal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          deleteGoal(editingGoal.id);
          setGoalsState(getGoals());
          setShowEditModal(false);
          setEditingGoal(null);
        }
      }
    ]);
  };

  const handleSelectChecklist = (index: number) => {
    setSelectedChecklistIndex(index);
    const selectedTitle = availableChecklists[index]?.title || 'Unknown';
    if (!showChecklistOnHome) {
      toggleChecklistOnHome(true);
    }
    Alert.alert(
      "Checklist Selected",
      `"${selectedTitle}" will appear on your home screen.`,
      [{ text: "OK" }]
    );
    setShowChecklistModal(false);
  };

  const onReordered = (fromIndex: number, toIndex: number) => {
    const newGoals = [...goals];
    const [movedItem] = newGoals.splice(fromIndex, 1);
    newGoals.splice(toIndex, 0, movedItem);
    saveGoalsToStore(newGoals);
  };

  const renderItem = ({ item, index, onDragStart, onDragEnd, isActive }: any) => {
    const displayWidth = (item.widthPercent / 100) * CONTAINER_WIDTH;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.goalWrapper, { width: displayWidth, marginBottom: GAP, opacity: isActive ? 0.8 : 1 }]}
        onPress={() => { setEditingGoal(item); setShowEditModal(true); }}
        onLongPress={onDragStart}
        onPressOut={onDragEnd}
        delayLongPress={150}
        activeOpacity={0.7}
      >
        <View style={[styles.goalBar, styles.goalBarEdit]}>
          <View style={[styles.goalFill, { width: `${item.progress}%`, backgroundColor: item.color }]} />
          <View style={styles.goalContent}>
            <View style={styles.dragHandle}>
              <Ionicons name="menu-outline" size={12} color="#aaa" />
            </View>
            <Text style={styles.goalTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.goalRight}>
              {item.progress > 0 && <Text style={styles.goalPercent}>{Math.round(item.progress)}%</Text>}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize Home</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.doneButtonContainer}>
            <Text style={styles.doneText}>Done</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Checklist Section - Top */}
          <View style={styles.checklistSection}>
            <View style={styles.checklistToggleRow}>
              <View style={styles.checklistToggleLeft}>
                <Ionicons name="checkbox-outline" size={22} color="#4ECDC4" />
                <Text style={styles.checklistToggleText}>Show Checklist on Home</Text>
              </View>
              <Switch
                value={showChecklistOnHome}
                onValueChange={toggleChecklistOnHome}
                trackColor={{ false: '#333', true: '#4ECDC4' }}
                thumbColor={showChecklistOnHome ? '#fff' : '#888'}
              />
            </View>

            {showChecklistOnHome && (
              <TouchableOpacity
                style={styles.checklistSelectButton}
                onPress={() => {
                  loadChecklists();
                  setShowChecklistModal(true);
                }}
              >
                <Ionicons name="list-outline" size={20} color="#4ECDC4" />
                <Text style={styles.checklistSelectText}>Select Checklist</Text>
                <View style={styles.currentSelectionContainer}>
                  <Text style={styles.currentSelectionValue}>
                    {availableChecklists[getSelectedChecklistIndex()]?.title || "None"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#555" />
              </TouchableOpacity>
            )}

            {showChecklistOnHome && availableChecklists.length === 0 && (
              <View style={styles.emptyChecklist}>
                <Ionicons name="checkbox-outline" size={24} color="#555" />
                <Text style={styles.emptyChecklistText}>
                  No checklists available. Create one from Settings → New Checklist.
                </Text>
                <TouchableOpacity
                  style={styles.createChecklistLink}
                  onPress={() => router.push('/new-checklist')}
                >
                  <Text style={styles.createChecklistLinkText}>Create a Checklist →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Goals Section - Bottom (pushed down) */}
        <View style={styles.goalsSection}>
          <DragList
            data={goals}
            keyExtractor={(item: Goal) => item.id.toString()}
            onReordered={onReordered}
            renderItem={renderItem}
            contentContainerStyle={styles.goalsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle-outline" size={22} color="#888" />
          <Text style={styles.addButtonText}>New Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Goal</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Goal title"
              placeholderTextColor="#555"
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              autoFocus
            />
            <Text style={styles.colorLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
              {GOAL_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }, newGoalColor === color && styles.colorOptionSelected]}
                  onPress={() => setNewGoalColor(color)}
                />
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddGoal}>
                <Text style={styles.modalCreate}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Goal</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Goal title"
              placeholderTextColor="#555"
              value={editingGoal?.title || ''}
              onChangeText={(text) => setEditingGoal(prev => prev ? { ...prev, title: text } : null)}
            />
            <Text style={styles.colorLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
              {GOAL_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }, editingGoal?.color === color && styles.colorOptionSelected]}
                  onPress={() => setEditingGoal(prev => prev ? { ...prev, color } : null)}
                />
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleDeleteGoal} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditGoal}>
                <Text style={styles.modalCreate}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Checklist Modal */}
      <Modal visible={showChecklistModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.checklistModalContent]}>
            <View style={styles.checklistModalHeader}>
              <Text style={styles.modalTitle}>Choose Home Checklist</Text>
              <TouchableOpacity onPress={() => setShowChecklistModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <Text style={styles.checklistDescription}>
              Select which checklist to display on your home screen. You can change this anytime.
            </Text>
            {availableChecklists.length === 0 ? (
              <View style={styles.noChecklistsContainer}>
                <Ionicons name="document-text-outline" size={48} color="#333" />
                <Text style={styles.noChecklistsTitle}>No Checklists Yet</Text>
                <Text style={styles.noChecklistsText}>
                  Create checklists from the Settings page first. Tap the button below to go there.
                </Text>
                <TouchableOpacity style={styles.createChecklistButton} onPress={() => { setShowChecklistModal(false); router.push('/new-checklist'); }}>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.createChecklistText}>Create Checklist</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <FlatList
                  data={availableChecklists}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={({ item, index }) => {
                    const isSelected = index === getSelectedChecklistIndex();
                    return (
                      <TouchableOpacity
                        style={[styles.checklistItem, isSelected && styles.checklistItemSelected]}
                        onPress={() => handleSelectChecklist(index)}
                      >
                        <View style={styles.checklistItemLeft}>
                          <Ionicons name={item.icon as any || 'list-outline'} size={24} color={isSelected ? '#4ECDC4' : '#888'} />
                          <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextSelected]}>{item.title}</Text>
                        </View>
                        {isSelected ? (
                          <View style={styles.selectedBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                            <Text style={styles.selectedBadgeText}>Active</Text>
                          </View>
                        ) : (
                          <Ionicons name="checkmark-circle-outline" size={20} color="#555" />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
                <View style={styles.checklistFooter}>
                  <TouchableOpacity style={styles.manageChecklistsButton} onPress={() => { setShowChecklistModal(false); router.push('/new-checklist'); }}>
                    <Text style={styles.manageChecklistsText}>+ Create New Checklist</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  cancelText: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  doneButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  doneText: { color: '#000', fontSize: 13, fontWeight: '600' },
  content: { flex: 1 },
  scrollView: { flex: 1 },
  checklistSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  checklistToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    marginTop: 8,
  },
  checklistToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistToggleText: {
    color: '#fff',
    fontSize: 14,
  },
  checklistSelectButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(78,205,196,0.2)' },
  checklistSelectText: { color: '#4ECDC4', fontSize: 15, fontWeight: '600', marginLeft: 12, flex: 1 },
  currentSelectionContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  currentSelectionValue: { color: '#4ECDC4', fontSize: 13, fontWeight: '500' },
  emptyChecklist: { alignItems: 'center', padding: 20, marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 12 },
  emptyChecklistText: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  createChecklistLink: { marginTop: 12 },
  createChecklistLinkText: { color: '#4ECDC4', fontSize: 14, fontWeight: '500' },
  goalsSection: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    marginTop: 60, // Adjust this value to move it up/down
  },
  goalsList: { paddingBottom: 10 },
  goalWrapper: { height: GOAL_HEIGHT, marginBottom: GAP, flexDirection: 'row' },
  goalBar: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, overflow: 'hidden', justifyContent: 'center', position: 'relative', height: '100%' },
  goalBarEdit: { borderWidth: 0 },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 10 },
  goalContent: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 8, height: '100%', gap: 6, zIndex: 1 },
  dragHandle: { marginRight: 4, padding: 2 },
  goalTitle: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  goalRight: { marginLeft: 4 },
  goalPercent: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#000', paddingHorizontal: 16, paddingBottom: 10, paddingTop: 12, borderTopWidth: 0, alignItems: 'flex-start' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8, paddingVertical: 1 },
  addButtonText: { color: '#888', fontSize: 16, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, width: '85%' },
  checklistModalContent: { maxHeight: '70%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  modalInput: { color: '#fff', fontSize: 16, backgroundColor: '#0a0a0a', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  colorLabel: { color: '#888', fontSize: 13, marginBottom: 8 },
  colorScroll: { flexDirection: 'row', marginBottom: 20 },
  colorOption: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: '#fff', transform: [{ scale: 1.1 }] },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, alignItems: 'center' },
  modalCancel: { color: '#888', fontSize: 16 },
  modalCreate: { color: '#4ECDC4', fontSize: 16, fontWeight: '600' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 'auto' },
  deleteButtonText: { color: '#FF6B6B', fontSize: 16, fontWeight: '600' },
  checklistModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  checklistDescription: { color: '#888', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  checklistItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#2a2a2a' },
  checklistItemSelected: { borderColor: '#4ECDC4', backgroundColor: 'rgba(78,205,196,0.1)' },
  checklistItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checklistItemText: { color: '#fff', fontSize: 16 },
  checklistItemTextSelected: { color: '#4ECDC4', fontWeight: '600' },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectedBadgeText: { color: '#4ECDC4', fontSize: 12, fontWeight: '600' },
  noChecklistsContainer: { alignItems: 'center', padding: 20 },
  noChecklistsTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  noChecklistsText: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  createChecklistButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4ECDC4', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  createChecklistText: { color: '#000', fontSize: 15, fontWeight: '600' },
  checklistFooter: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a', paddingTop: 12 },
  manageChecklistsButton: { paddingVertical: 12, alignItems: 'center' },
  manageChecklistsText: { color: '#4ECDC4', fontSize: 14, fontWeight: '500' },
});

