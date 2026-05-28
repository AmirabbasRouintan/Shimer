// app/home-customize.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Modal, TextInput, ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import DragList from 'react-native-draglist';
import { getChecklists, setSelectedChecklistIndex, getSelectedChecklistIndex, getGoals, setGoals, updateGoal, deleteGoal, subscribe, Goal, getMaxPausedActivities, setMaxPausedActivities } from '../activitiesStore';
import CustomAlert from '../components/CustomAlert';

const { width: screenWidth } = Dimensions.get('window');

const GOAL_COLORS = [
  '#fff', '#FF6B6B', '#FFEAA7', '#DDA0DD', '#45B7D1',
  '#96CEB4', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7',
];
const GOAL_HEIGHT = 28;
const GAP = 8;
const CONTAINER_WIDTH = screenWidth - 32;

export default function HomeCustomizeScreen() {
  const router = useRouter();
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [availableChecklists, setAvailableChecklists] = useState<{ title: string; icon: string; index: number }[]>([]);
  const [maxPaused, setMaxPaused] = useState(getMaxPausedActivities());
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertConfirmText, setAlertConfirmText] = useState('OK');
  const [alertOnConfirm, setAlertOnConfirm] = useState<() => void>(() => {});
  const [alertDeleteVisible, setAlertDeleteVisible] = useState(false);
  const [deleteGoalTitle, setDeleteGoalTitle] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadChecklists();
      setMaxPaused(getMaxPausedActivities());
      setGoalsState(getGoals());
    }, [])
  );

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      loadChecklists();
      setMaxPaused(getMaxPausedActivities());
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

  const handleEditGoal = () => {
    if (!editingGoal) return;
    if (!editingGoal.title.trim()) {
      setAlertTitle('Required');
      setAlertMessage('Please enter a goal title');
      setAlertConfirmText('OK');
      setAlertOnConfirm(() => () => setAlertVisible(false));
      setAlertVisible(true);
      return;
    }
    updateGoal(editingGoal.id, editingGoal);
    setGoalsState(getGoals());
    setShowEditModal(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = () => {
    if (!editingGoal) return;
    setDeleteGoalTitle(editingGoal.title);
    setAlertDeleteVisible(true);
  };

  const confirmDeleteGoal = () => {
    if (!editingGoal) return;
    deleteGoal(editingGoal.id);
    setGoalsState(getGoals());
    setShowEditModal(false);
    setEditingGoal(null);
    setAlertDeleteVisible(false);
  };

  const handleSelectChecklist = (index: number) => {
    setSelectedChecklistIndex(index);
    if (index === -1) {
      setAlertTitle('Checklist Hidden');
      setAlertMessage('No checklist will appear on your home screen.');
      setAlertOnConfirm(() => () => setAlertVisible(false));
    } else {
      const selectedTitle = availableChecklists[index]?.title || 'Unknown';
      setAlertTitle('Checklist Selected');
      setAlertMessage(`"${selectedTitle}" will appear on your home screen.`);
      setAlertOnConfirm(() => () => setAlertVisible(false));
    }
    setAlertConfirmText('OK');
    setAlertVisible(true);
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
        onPress={() => {
          router.push({
            pathname: '/edit-goal',
            params: {
              id: item.id,
              title: item.title,
              color: item.color,
              emoji: item.emoji,
              progress: item.progress,
              selectedDays: JSON.stringify(item.selectedDays || []),
              duration: item.duration || '2h',
              trackEntireActivity: String(item.trackEntireActivity !== false),
            }
          });
        }}
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
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
          {/* Checklist Section */}
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="list-outline" size={16} color="#fff" />
            <Text style={styles.sectionHeader}>CHECKLIST</Text>
          </View>
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { loadChecklists(); setShowChecklistModal(true); }}>
            <Ionicons name="checkbox-outline" size={22} color="#a3a3a3" />
            <Text style={styles.rowText}>Checklist</Text>
            <Text style={styles.rowValue}>{getSelectedChecklistIndex() === -1 ? "None" : (availableChecklists[getSelectedChecklistIndex()]?.title || "None")}</Text>
            <Ionicons name="chevron-forward" size={18} color="#a3a3a3" />
          </TouchableOpacity>

          {availableChecklists.length === 0 && (
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

          {/* Paused Activities Section */}
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="pause-circle-outline" size={16} color="#fff" />
            <Text style={styles.sectionHeader}>PAUSED ACTIVITIES</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="pause-circle-outline" size={22} color="#a3a3a3" />
            <Text style={styles.rowText}>Max paused activities</Text>
            <TouchableOpacity
              style={[styles.stepperButton, maxPaused <= 1 && styles.stepperButtonDisabled]}
              onPress={() => {
                const next = Math.max(1, maxPaused - 1);
                setMaxPaused(next);
                setMaxPausedActivities(next);
              }}
            >
              <Ionicons name="remove" size={18} color={maxPaused <= 1 ? '#333' : '#fff'} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{maxPaused}</Text>
            <TouchableOpacity
              style={[styles.stepperButton, maxPaused >= 10 && styles.stepperButtonDisabled]}
              onPress={() => {
                const next = Math.min(10, maxPaused + 1);
                setMaxPaused(next);
                setMaxPausedActivities(next);
              }}
            >
              <Ionicons name="add" size={18} color={maxPaused >= 10 ? '#333' : '#fff'} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Goals Section - Bottom */}
        <View style={styles.goalsSection}>
          <DragList
            data={goals}
            keyExtractor={(item: Goal) => item.id.toString()}
            onReordered={onReordered}
            renderItem={renderItem}
            contentContainerStyle={styles.goalsList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-new-goal')}>
          <Ionicons name="add-circle-outline" size={22} color="#888" />
          <Text style={styles.addButtonText}>New Goal</Text>
        </TouchableOpacity>
      </View>

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
                  data={[{ title: 'None', icon: 'close-circle-outline', index: -1 }, ...availableChecklists]}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={({ item, index }) => {
                    const isSelected = index === 0 && getSelectedChecklistIndex() === -1
                      ? true
                      : item.index !== -1 && item.index === getSelectedChecklistIndex();
                    return (
                      <TouchableOpacity
                        style={[styles.checklistItem, isSelected && styles.checklistItemSelected]}
                        onPress={() => handleSelectChecklist(index === 0 ? -1 : item.index)}
                      >
                        <View style={styles.checklistItemLeft}>
                          <Ionicons name={item.icon as any || 'list-outline'} size={24} color={isSelected ? '#fff' : '#888'} />
                          <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextSelected]}>{item.title}</Text>
                        </View>
                        {isSelected ? (
                          <View style={styles.selectedBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
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

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onConfirm={alertOnConfirm}
        confirmText={alertConfirmText}
        singleButton
      />

      <CustomAlert
        visible={alertDeleteVisible}
        title="Delete Goal"
        message={`Delete "${deleteGoalTitle}"?`}
        onConfirm={confirmDeleteGoal}
        onCancel={() => setAlertDeleteVisible(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />
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
  sectionHeaderContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  sectionHeader: { color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171717', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginHorizontal: 16, marginBottom: 4, gap: 12 },
  rowText: { color: '#fafafa', fontSize: 15, flex: 1 },
  rowValue: { color: '#a3a3a3', fontSize: 14 },
  emptyChecklist: { alignItems: 'center', padding: 20, marginBottom: 16, backgroundColor: '#171717', borderRadius: 12, marginHorizontal: 16 },
  emptyChecklistText: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  createChecklistLink: { marginTop: 12 },
  createChecklistLinkText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  goalsSection: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    marginTop: 20,
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
  modalCreate: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 'auto' },
  deleteButtonText: { color: '#FF6B6B', fontSize: 16, fontWeight: '600' },
  checklistModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  checklistDescription: { color: '#888', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  checklistItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#2a2a2a' },
  checklistItemSelected: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' },
  checklistItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checklistItemText: { color: '#fff', fontSize: 16 },
  checklistItemTextSelected: { color: '#fff', fontWeight: '600' },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectedBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  noChecklistsContainer: { alignItems: 'center', padding: 20 },
  noChecklistsTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  noChecklistsText: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  createChecklistButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  createChecklistText: { color: '#000', fontSize: 15, fontWeight: '600' },
  checklistFooter: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a', paddingTop: 12 },
  manageChecklistsButton: { paddingVertical: 12, alignItems: 'center' },
  manageChecklistsText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  stepperButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  stepperButtonDisabled: { backgroundColor: '#1a1a1a' },
  stepperValue: { color: '#fafafa', fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
});
