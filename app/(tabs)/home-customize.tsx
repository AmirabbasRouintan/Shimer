// app/home-customize.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Animated, PanResponder, Alert, Modal, TextInput,
  ScrollView, FlatList, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
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
  const [goals, setGoalsState] = useState<Goal[]>(getGoals());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalColor, setNewGoalColor] = useState(GOAL_COLORS[0]);
  const [availableChecklists, setAvailableChecklists] = useState<{ title: string; icon: string; index: number }[]>([]);
  const [showChecklistOnHome, setShowChecklistOnHomeState] = useState(getShowChecklistOnHome());

  // Drag & Drop state
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragAnim = useRef(new Animated.ValueXY()).current;
  const dragGoalIdRef = useRef<number | null>(null);
  const dragStartYRef = useRef(0);
  const originalOrderRef = useRef<Goal[]>([]);
  const goalsRef = useRef(goals);

  // Resize state
  const [resizingId, setResizingId] = useState<number | null>(null);
  const resizeStartRef = useRef({ pageX: 0, startPercent: 0 });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { goalsRef.current = goals; }, [goals]);

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
    const maxId = goals.reduce((max, g) => Math.max(max, g.id), 0);
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

  const createDragPanResponder = (goalId: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        dragGoalIdRef.current = goalId;
        const currentGoals = goalsRef.current;
        const idx = currentGoals.findIndex(g => g.id === goalId);
        dragStartYRef.current = idx * (GOAL_HEIGHT + GAP);
        originalOrderRef.current = [...currentGoals];
        dragAnim.setValue({ x: 0, y: dragStartYRef.current });
        setDraggingId(goalId);
      },
      onPanResponderMove: (_, gesture) => {
        if (dragGoalIdRef.current !== goalId) return;
        const newY = dragStartYRef.current + gesture.dy;
        const maxY = (originalOrderRef.current.length - 1) * (GOAL_HEIGHT + GAP);
        const clampedY = Math.max(0, Math.min(newY, maxY));
        dragAnim.setValue({ x: 0, y: clampedY });
      },
      onPanResponderRelease: (_, gesture) => {
        if (dragGoalIdRef.current !== goalId) {
          setDraggingId(null); dragGoalIdRef.current = null; return;
        }
        const currentGoals = goalsRef.current;
        const draggingIdx = currentGoals.findIndex(g => g.id === goalId);
        if (draggingIdx === -1) { setDraggingId(null); dragGoalIdRef.current = null; return; }
        const dropY = dragStartYRef.current + gesture.dy;
        const targetIdx = Math.round(dropY / (GOAL_HEIGHT + GAP));
        const insertIdx = Math.max(0, Math.min(targetIdx, currentGoals.length - 1));
        if (insertIdx !== draggingIdx) {
          const newGoals = [...currentGoals];
          const [moved] = newGoals.splice(draggingIdx, 1);
          newGoals.splice(insertIdx, 0, moved);
          saveGoalsToStore(newGoals);
        }
        Animated.spring(dragAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 7 }).start();
        setDraggingId(null); dragGoalIdRef.current = null;
      },
      onPanResponderTerminate: () => {
        setDraggingId(null); dragGoalIdRef.current = null;
        Animated.spring(dragAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 7 }).start();
      },
    });
  };

  const createResizePanResponder = (goalId: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => resizingId === goalId,
      onPanResponderGrant: (evt) => {
        setResizingId(goalId);
        const goal = goalsRef.current.find(g => g.id === goalId);
        if (!goal) return;
        resizeStartRef.current = { pageX: evt.nativeEvent.pageX, startPercent: goal.widthPercent };
      },
      onPanResponderMove: (evt) => {
        if (resizingId !== goalId) return;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          const deltaX = evt.nativeEvent.pageX - resizeStartRef.current.pageX;
          const percentChange = (deltaX / CONTAINER_WIDTH) * 100;
          let newPercent = resizeStartRef.current.startPercent + percentChange;
          newPercent = Math.max(25, Math.min(100, Math.round(newPercent)));
          const updated = goalsRef.current.map(g => g.id === goalId ? { ...g, widthPercent: newPercent } : g);
          saveGoalsToStore(updated);
        }, 16);
      },
      onPanResponderRelease: () => {
        setResizingId(null);
        if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; }
      },
      onPanResponderTerminate: () => {
        setResizingId(null);
        if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; }
      },
    });
  };

  const panRespondersRef = useRef<{ [key: number]: { drag: any; resize: any } }>({});
  const getPanResponders = (goalId: number) => {
    if (!panRespondersRef.current[goalId]) {
      panRespondersRef.current[goalId] = {
        drag: createDragPanResponder(goalId),
        resize: createResizePanResponder(goalId),
      };
    }
    return panRespondersRef.current[goalId];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize Home Screen</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContentContainer}>
        <View>
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

        {/* Goals List */}
        <View style={styles.goalsList}>
          {goals.map((goal) => {
            const isDragging = draggingId === goal.id;
            const displayWidth = (goal.widthPercent / 100) * CONTAINER_WIDTH;
            const { drag, resize } = getPanResponders(goal.id);
            return (
              <Animated.View key={goal.id} style={[styles.goalWrapper, { width: displayWidth, marginBottom: GAP, transform: isDragging ? [{ translateX: dragAnim.x }, { translateY: dragAnim.y }] : [], zIndex: isDragging ? 999 : 1 }]}>
                <TouchableOpacity style={styles.dragArea} onPress={() => { setEditingGoal(goal); setShowEditModal(true); }} activeOpacity={0.7} {...drag.panHandlers}>
                  <View style={[styles.goalBar, styles.goalBarEdit]}>
                    <View style={[styles.goalFill, { width: `${goal.progress}%`, backgroundColor: goal.color }]} />
                    <View style={styles.goalContent}>
                      <View style={styles.dragHandle}><Ionicons name="menu" size={12} color="#aaa" /></View>
                      <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                      <View style={styles.goalRight}>{goal.progress > 0 && <Text style={styles.goalPercent}>{goal.progress}%</Text>}</View>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.resizeHandle} {...resize.panHandlers}>
                  <View style={styles.resizeLines}><View style={styles.resizeLine} /><View style={styles.resizeLine} /></View>
                </View>
              </Animated.View>
            );
          })}
        </View>

      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle-outline" size={22} color="#888" />
          <Text style={styles.addButtonText}>New Goal</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Goal</Text>
            <TextInput style={styles.modalInput} placeholder="Goal title" placeholderTextColor="#555" value={newGoalTitle} onChangeText={setNewGoalTitle} autoFocus />
            <Text style={styles.colorLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
              {GOAL_COLORS.map(color => (
                <TouchableOpacity key={color} style={[styles.colorOption, { backgroundColor: color }, newGoalColor === color && styles.colorOptionSelected]} onPress={() => setNewGoalColor(color)} />
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAddGoal}><Text style={styles.modalCreate}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Goal</Text>
            <TextInput style={styles.modalInput} placeholder="Goal title" placeholderTextColor="#555" value={editingGoal?.title || ''} onChangeText={(text) => setEditingGoal(prev => prev ? { ...prev, title: text } : null)} />
            <Text style={styles.colorLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
              {GOAL_COLORS.map(color => (
                <TouchableOpacity key={color} style={[styles.colorOption, { backgroundColor: color }, editingGoal?.color === color && styles.colorOptionSelected]} onPress={() => setEditingGoal(prev => prev ? { ...prev, color } : null)} />
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleDeleteGoal} style={styles.deleteButton}><Ionicons name="trash-outline" size={18} color="#FF6B6B" /><Text style={styles.deleteButtonText}>Delete</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleEditGoal}><Text style={styles.modalCreate}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showChecklistModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
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
              <FlatList
                data={availableChecklists}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item, index }) => {
                  const isSelected = index === getSelectedChecklistIndex();
                  return (
                    <TouchableOpacity style={[styles.checklistItem, isSelected && styles.checklistItemSelected]} onPress={() => handleSelectChecklist(index)}>
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
            )}
            {availableChecklists.length > 0 && (
              <View style={styles.checklistFooter}>
                <TouchableOpacity style={styles.manageChecklistsButton} onPress={() => { setShowChecklistModal(false); router.push('/new-checklist'); }}>
                  <Text style={styles.manageChecklistsText}>+ Create New Checklist</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomColor: '#1a1a1a' },
  cancelText: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  doneText: { color: '#4ECDC4', fontSize: 16, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  scrollContentContainer: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 45 },
  goalsList: { marginTop: 12 },
  goalWrapper: { height: GOAL_HEIGHT, flexDirection: 'row' },
  dragArea: { flex: 1 },
  goalBar: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, overflow: 'hidden', justifyContent: 'center', position: 'relative', height: '100%' },
  goalBarEdit: { borderWidth: 1.5, borderColor: '#4ECDC460' },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 10 },
  goalContent: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 8, height: '100%', gap: 6, zIndex: 1 },
  dragHandle: { marginRight: 4, padding: 2 },
  goalTitle: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  goalRight: { marginLeft: 4 },
  goalPercent: { color: '#fff', fontSize: 11, fontWeight: '700' },
  resizeHandle: { width: 24, height: '100%', justifyContent: 'center', alignItems: 'center' },
  resizeLines: { alignItems: 'center', gap: 3 },
  resizeLine: { width: 3, height: 10, backgroundColor: '#aaa', borderRadius: 1.5 },
  // checklistToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 12, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  // checklistToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // checklistToggleText: { color: '#fff', fontSize: 16 },
  checklistToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,      // Reduced from 16
    paddingHorizontal: 12,    // Reduced from 16
    borderRadius: 10,          // Reduced from 12
    marginBottom: 8,           // Reduced from 12
    marginTop: 8,             // Reduced from 12
  },
  checklistToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                   // Reduced from 12
  },
  checklistToggleText: {
    color: '#fff',
    fontSize: 14,             // Reduced from 16
  },
  checklistSelectButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(78,205,196,0.2)' },
  checklistSelectText: { color: '#4ECDC4', fontSize: 15, fontWeight: '600', marginLeft: 12, flex: 1 },
  currentSelectionContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  currentSelectionValue: { color: '#4ECDC4', fontSize: 13, fontWeight: '500' },
  emptyChecklist: { alignItems: 'center', padding: 20, marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 12 },
  emptyChecklistText: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  createChecklistLink: { marginTop: 12 },
  createChecklistLinkText: { color: '#4ECDC4', fontSize: 14, fontWeight: '500' },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#000', paddingHorizontal: 16, paddingBottom: 10, paddingTop: 12, borderTopWidth: 1, alignItems: 'flex-start' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8, paddingVertical: 1 },
  addButtonText: { color: '#888', fontSize: 16, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, width: '85%' },
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
