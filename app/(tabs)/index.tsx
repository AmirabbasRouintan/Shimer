// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration,
  Modal, Alert, Dimensions, PanResponder,
  Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const store = {};

interface Goal {
  id: number;
  title: string;
  progress: number;
  color: string;
  emoji: string;
  isActive: boolean;
  isCompleted: boolean;
  widthPercent: number;
}

const GOAL_TITLES = [
  "Morning Routine",
  "Work Focus",
  "Study Session",
  "Exercise Time",
  "Reading Goal",
  "Project Work",
  "Meditation",
  "Learning Time",
  "Walk & Stretch",
  "Personal Dev",
];

const GOAL_COLORS = [
  '#4ECDC4', '#FF6B6B', '#FFEAA7', '#DDA0DD', '#45B7D1',
  '#96CEB4', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7',
];

const COMPLETION_EMOJIS = ['🎉', '✅', '🏆', '⭐', '💪', '🔥', '👏', '✨', '🎯', '💯'];

const GOAL_HEIGHT = 40;
const GAP = 10;
const CONTAINER_WIDTH = screenWidth - 32;

export default function IndexScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const previousCountdownRef = useRef(countdownSeconds);
  const hasVibratedRef = useRef(false);
  const [homeTasks, setHomeTasks] = useState<any[]>([]);
  const [showLongPressMenu, setShowLongPressMenu] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showGoalEditModal, setShowGoalEditModal] = useState(false);

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragAnim = useRef(new Animated.ValueXY()).current;
  const dragGoalIdRef = useRef<number | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, goalX: 0, goalY: 0 });
  const goalLayoutsRef = useRef<{ [key: number]: { x: number; y: number; width: number } }>({});

  const [goals, setGoals] = useState<Goal[]>(() =>
    GOAL_TITLES.map((title, index) => ({
      id: index,
      title,
      progress: index === 0 ? 75 : index === 1 ? 45 : index === 2 ? 90 : index === 3 ? 30 : index === 4 ? 60 : 0,
      color: GOAL_COLORS[index % GOAL_COLORS.length],
      emoji: COMPLETION_EMOJIS[index % COMPLETION_EMOJIS.length],
      isActive: false,
      isCompleted: index === 2,
      widthPercent: 100,
    }))
  );

  const activeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeGoalIdRef = useRef<number | null>(null);
  const showEditModeRef = useRef(false);
  const goalsRef = useRef(goals);
  const totalHeightRef = useRef(100);

  useEffect(() => { showEditModeRef.current = showEditMode; }, [showEditMode]);
  useEffect(() => { goalsRef.current = goals; }, [goals]);

  const calculateLayout = useCallback((goalsList: Goal[]) => {
    const layouts: { [key: number]: { x: number; y: number; width: number; row: number } } = {};
    let currentY = 0;

    goalsList.forEach((goal, index) => {
      const goalWidth = CONTAINER_WIDTH - 32;
      layouts[goal.id] = { x: 0, y: currentY, width: goalWidth, row: index };
      currentY += GOAL_HEIGHT + GAP;
    });

    totalHeightRef.current = currentY;
    return layouts;
  }, []);

  const layout = calculateLayout(goals);

  useEffect(() => {
    if (mode !== 'countdown') return;
    const interval = setInterval(() => setCountdownSeconds(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (mode === 'countdown') {
      const prev = previousCountdownRef.current;
      if (prev > 0 && countdownSeconds <= 0 && !hasVibratedRef.current) {
        Vibration.vibrate([500, 200, 500]);
        hasVibratedRef.current = true;
      }
      previousCountdownRef.current = countdownSeconds;
    } else {
      hasVibratedRef.current = false;
    }
  }, [countdownSeconds, mode]);

  useEffect(() => {
    if (mode !== 'stopwatch') return;
    const interval = setInterval(() => setStopwatchSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    const saved = store['home_tasks'];
    if (saved) setHomeTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    return () => {
      if (activeTimerRef.current) clearInterval(activeTimerRef.current);
    };
  }, []);

  const stopActiveGoal = () => {
    if (activeTimerRef.current) {
      clearInterval(activeTimerRef.current);
      activeTimerRef.current = null;
    }
    if (activeGoalIdRef.current !== null) {
      setGoals(prev => prev.map(g => g.id === activeGoalIdRef.current ? { ...g, isActive: false } : g));
      activeGoalIdRef.current = null;
    }
  };

  const handleGoalPress = (goalId: number) => {
    if (showEditModeRef.current) return;

    setGoals(prevGoals => {
      const goal = prevGoals.find(g => g.id === goalId);
      if (!goal || goal.isCompleted) return prevGoals;

      if (goal.isActive) {
        stopActiveGoal();
        return prevGoals.map(g => g.id === goalId ? { ...g, isActive: false } : g);
      }

      stopActiveGoal();
      activeGoalIdRef.current = goalId;

      const interval = setInterval(() => {
        setGoals(prev => {
          const currentGoal = prev.find(g => g.id === goalId);
          if (!currentGoal) {
            clearInterval(interval);
            return prev;
          }

          const newProgress = currentGoal.progress + 1;
          if (newProgress >= 100) {
            clearInterval(interval);
            activeTimerRef.current = null;
            activeGoalIdRef.current = null;
            Vibration.vibrate([200, 100, 200]);
            return prev.map(g =>
              g.id === goalId
                ? { ...g, progress: 100, isActive: false, isCompleted: true }
                : g
            );
          }
          return prev.map(g =>
            g.id === goalId
              ? { ...g, progress: newProgress, isActive: true, isCompleted: false }
              : g
          );
        });
      }, 100);

      activeTimerRef.current = interval;
      return prevGoals.map(g => g.id === goalId ? { ...g, isActive: true } : g);
    });
  };

  const handleGoalLongPress = (goal: Goal) => {
    if (showEditModeRef.current) return;
    stopActiveGoal();
    setSelectedGoal(goal);
    setShowGoalEditModal(true);
  };

  const handleResetGoal = () => {
    if (selectedGoal) {
      setGoals(prev => prev.map(g =>
        g.id === selectedGoal.id
          ? { ...g, progress: 0, isActive: false, isCompleted: false }
          : g
      ));
      setShowGoalEditModal(false);
    }
  };

  const handleChangeGoalColor = () => {
    if (selectedGoal) {
      const idx = GOAL_COLORS.indexOf(selectedGoal.color);
      const next = GOAL_COLORS[(idx + 1) % GOAL_COLORS.length];
      setGoals(prev => prev.map(g =>
        g.id === selectedGoal.id ? { ...g, color: next } : g
      ));
    }
  };

  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => showEditModeRef.current,
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (!showEditModeRef.current) return false;
        return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
      },
      onPanResponderGrant: (evt) => {
        const goalId = dragGoalIdRef.current;
        if (goalId === null) return;
        const pos = goalLayoutsRef.current[goalId];
        if (!pos) return;
        dragStartRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          goalX: pos.x,
          goalY: pos.y,
        };
        dragAnim.setValue({ x: pos.x, y: pos.y });
        setDraggingId(goalId);
      },
      onPanResponderMove: (evt, gesture) => {
        const goalId = dragGoalIdRef.current;
        if (goalId === null) return;
        const baseY = dragStartRef.current.goalY;
        let newX = 0;
        let newY = baseY + gesture.dy;
        const maxY = totalHeightRef.current - GOAL_HEIGHT;
        newY = Math.max(0, Math.min(newY, maxY));
        dragAnim.setValue({ x: newX, y: newY });
        const dropY = newY + GOAL_HEIGHT / 2;
        const targetIndex = Math.floor(dropY / (GOAL_HEIGHT + GAP));
        const currentGoals = goalsRef.current;
        const currentIdx = currentGoals.findIndex(g => g.id === goalId);
        if (currentIdx === -1) return;
        let insertIdx = Math.max(0, Math.min(targetIndex, currentGoals.length - 1));
        if (insertIdx === currentIdx) return;
        const newGoals = [...currentGoals];
        const [moved] = newGoals.splice(currentIdx, 1);
        newGoals.splice(insertIdx, 0, moved);
        setGoals(newGoals);
      },
      onPanResponderRelease: () => {
        const goalId = dragGoalIdRef.current;
        setDraggingId(null);
        dragGoalIdRef.current = null;
        if (goalId === null) return;
        const currentGoals = goalsRef.current;
        const idx = currentGoals.findIndex(g => g.id === goalId);
        if (idx !== -1) {
          Animated.spring(dragAnim, {
            toValue: { x: 0, y: idx * (GOAL_HEIGHT + GAP) },
            useNativeDriver: true,
            friction: 7,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        setDraggingId(null);
        dragGoalIdRef.current = null;
      },
    })
  ).current;

  const startDragging = useCallback((goalId: number) => {
    dragGoalIdRef.current = goalId;
  }, []);

  const formatTime = (totalSeconds: number) => {
    const abs = Math.abs(totalSeconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isNegative = mode === 'countdown' && countdownSeconds < 0;
  const displayTime = mode === 'countdown'
    ? (isNegative ? '-' : '') + formatTime(countdownSeconds)
    : formatTime(stopwatchSeconds);

  const handleAddFiveMinutes = () => {
    if (mode === 'countdown') {
      setCountdownSeconds(prev => prev + 300);
      hasVibratedRef.current = false;
    }
  };

  const handleToggleMode = () => {
    if (mode === 'countdown') {
      setMode('stopwatch');
      setStopwatchSeconds(0);
    } else {
      setMode('countdown');
      setCountdownSeconds(0);
      previousCountdownRef.current = 0;
      hasVibratedRef.current = false;
    }
  };

  const handleLongPress = () => {
    if (showEditMode) return;
    setShowLongPressMenu(true);
  };

  const handleEditHomeScreen = () => {
    setShowLongPressMenu(false);
    stopActiveGoal();
    setShowEditMode(true);
  };

  const handleAddNewGoal = () => {
    setShowLongPressMenu(false);
    router.push('/add-new-goal');
  };

  const handleCancelEdit = () => setShowEditMode(false);

  const handleSaveEdit = () => {
    setShowEditMode(false);
    Alert.alert('Saved', 'Home screen settings saved successfully');
  };

  const goalsAreaHeight = totalHeightRef.current + 20;

  return (
    <View style={styles.container}>
      {showEditMode && (
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={handleCancelEdit}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.editTitle}>Home Settings</Text>
          <TouchableOpacity onPress={handleSaveEdit}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.longPressArea, { paddingTop: showEditMode ? 0 : 45 }]}>
        <TouchableOpacity
          style={styles.mainContent}
          onLongPress={handleLongPress}
          activeOpacity={1}
        >
          {!showEditMode && (
            <>
              <View style={styles.topRow}>
                <TouchableOpacity style={[styles.iconButton, { position: 'absolute', left: 16 }]} onPress={handleToggleMode}>
                  <Ionicons name="information-circle-outline" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.doingNow}>Hobby</Text>
                <TouchableOpacity style={[styles.iconButton, { position: 'absolute', right: 16 }]} onPress={handleAddFiveMinutes}>
                  <Text style={styles.iconButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.clockText, isNegative && styles.negativeClock]}>
                {displayTime}
              </Text>
            </>
          )}

          <View style={[styles.goalsContainer, { bottom: showEditMode ? 30 : 80 }]}>
            <ScrollView
              style={{ maxHeight: goalsAreaHeight }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {goals.map((goal, index) => {
                const isDragging = draggingId === goal.id;
                const targetY = index * (GOAL_HEIGHT + GAP);
                const pos = layout[goal.id] || { x: 0, y: targetY, width: CONTAINER_WIDTH - 32 };

                goalLayoutsRef.current[goal.id] = {
                  x: 0,
                  y: targetY,
                  width: CONTAINER_WIDTH - 32,
                };

                return (
                  <Animated.View
                    key={goal.id}
                    style={[
                      styles.goalWrapper,
                      {
                        position: isDragging ? 'absolute' : 'relative',
                        left: isDragging ? dragAnim.x : 0,
                        top: isDragging ? dragAnim.y : 0,
                        width: '100%',
                        zIndex: isDragging ? 999 : 1,
                        elevation: isDragging ? 20 : 0,
                        shadowColor: isDragging ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        marginBottom: isDragging ? 0 : GAP,
                      },
                    ]}
                    {...(showEditMode ? {
                      onTouchStart: () => startDragging(goal.id),
                      ...panResponderRef.panHandlers,
                    } : {})}
                  >
                    <TouchableOpacity
                      style={[styles.goalBar, showEditMode && styles.goalBarEdit]}
                      onPress={() => handleGoalPress(goal.id)}
                      onLongPress={() => handleGoalLongPress(goal)}
                      activeOpacity={showEditMode ? 1 : 0.8}
                      disabled={showEditMode}
                    >
                      <View style={[
                        styles.goalFill,
                        {
                          width: `${goal.progress}%`,
                          backgroundColor: goal.color,
                          opacity: showEditMode ? 0.9 : (goal.isCompleted ? 0.7 : 1),
                        }
                      ]} />

                      {showEditMode && goal.progress > 0 && (
                        <View style={[
                          styles.goalFillShine,
                          { width: `${goal.progress}%` }
                        ]} />
                      )}

                      <View style={styles.goalContent}>
                        {showEditMode && (
                          <View style={styles.dragHandle}>
                            <Ionicons name="menu" size={16} color="#aaa" />
                          </View>
                        )}

                        {!goal.isCompleted && goal.progress > 0 && (
                          <Text style={[styles.goalPercentLeft, { color: goal.progress > 50 ? '#000' : '#fff' }]}>
                            {goal.progress}%
                          </Text>
                        )}

                        {goal.isActive && !goal.isCompleted && (
                          <Text style={styles.activeIndicator}>⏳</Text>
                        )}

                        <Text style={[
                          styles.goalTitle,
                          goal.progress > 50 && !goal.isCompleted && { color: '#000' },
                          goal.isCompleted && { color: '#aaa' },
                        ]} numberOfLines={1}>
                          {goal.title}
                        </Text>

                        <View style={styles.goalRight}>
                          {goal.isCompleted && (
                            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                          )}
                          {!goal.isCompleted && goal.progress === 0 && (
                            <Text style={styles.goalHint}>Tap to start</Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>

          {homeTasks.length > 0 && !showEditMode && (
            <View style={styles.homeTaskContainer}>
              <Text style={styles.sectionHeader}>Today's Tasks</Text>
              {homeTasks.map((task, i) => (
                <View key={i} style={styles.taskRow}>
                  <Ionicons name={task.done ? 'checkbox' : 'square-outline'} size={18} color={task.done ? '#4CAF50' : '#555'} />
                  <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.text}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showLongPressMenu} transparent animationType="fade" onRequestClose={() => setShowLongPressMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLongPressMenu(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Options</Text>
              <TouchableOpacity onPress={() => setShowLongPressMenu(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditHomeScreen}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="home-outline" size={24} color="#fff" />
                <Text style={styles.menuItemText}>Edit Home Screen</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleAddNewGoal}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="flag-outline" size={24} color="#fff" />
                <Text style={styles.menuItemText}>Add New Goal</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showGoalEditModal} transparent animationType="fade" onRequestClose={() => setShowGoalEditModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGoalEditModal(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>{selectedGoal?.title}</Text>
              <TouchableOpacity onPress={() => setShowGoalEditModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={handleResetGoal}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="refresh-outline" size={24} color="#fff" />
                <Text style={styles.menuItemText}>Reset Progress</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleChangeGoalColor}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.colorPreview, { backgroundColor: selectedGoal?.color }]} />
                <Text style={styles.menuItemText}>Change Color</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 15,
    backgroundColor: '#0a0a0a', borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  cancelText: { color: '#FF4444', fontSize: 16, fontWeight: '500' },
  editTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  saveText: { color: '#4ECDC4', fontSize: 16, fontWeight: '600' },
  longPressArea: { flex: 1, alignItems: 'stretch' },
  mainContent: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 16, height: 44 },
  iconButton: { marginTop: 90, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  iconButtonText: { color: '#666', fontSize: 35, fontWeight: '100' },
  doingNow: { color: '#fff', fontSize: 18, fontWeight: '500' },
  clockText: { marginTop: -20, color: '#fff', fontSize: 80, fontWeight: 'bold' },
  negativeClock: { color: '#FF4444' },
  goalsContainer: { position: 'absolute', left: 16, right: 16 },
  goalWrapper: { height: GOAL_HEIGHT },
  goalBar: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12,
    overflow: 'hidden', justifyContent: 'center', position: 'relative',
  },
  goalBarEdit: { borderWidth: 1.5, borderColor: '#4ECDC460', backgroundColor: '#1a1a1a' },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 12 },
  goalFillShine: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
  },
  goalContent: {
    flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 12,
    height: '100%', gap: 8, zIndex: 1,
  },
  dragHandle: { marginRight: 4, padding: 2 },
  goalPercentLeft: { fontSize: 11, fontWeight: '700', minWidth: 30 },
  activeIndicator: { fontSize: 13 },
  goalTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  goalRight: { marginLeft: 4 },
  goalEmoji: { fontSize: 18 },
  goalHint: { color: '#555', fontSize: 10 },
  homeTaskContainer: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: 'rgba(26,26,26,0.95)', borderRadius: 16,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  sectionHeader: { color: '#888', fontSize: 10, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  taskText: { color: '#fff', fontSize: 13 },
  taskDone: { color: '#555', textDecorationLine: 'line-through' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { backgroundColor: '#1a1a1a', borderRadius: 16, width: '85%', maxWidth: 320, padding: 20 },
  menuHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
  },
  menuTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemText: { color: '#fff', fontSize: 16 },
  colorPreview: { width: 20, height: 20, borderRadius: 10 },
});
