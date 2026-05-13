// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getActiveTimer, setActiveTimer, subscribe, getChecklists, getSelectedChecklistIndex, getShowChecklistOnHome, getGoals, setGoals, Goal } from '../activitiesStore';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration,
  Modal, Alert, Dimensions, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const store: Record<string, any> = {};

const GOAL_HEIGHT = 28;
const GAP = 8;
const CONTAINER_WIDTH = screenWidth - 32;

type TimerType = 'normal' | 'goal' | 'break';

export default function IndexScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const previousCountdownRef = useRef(countdownSeconds);
  const hasVibratedRef = useRef(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isInverted, setIsInverted] = useState(false);
  const [targetSeconds, setTargetSeconds] = useState<number | null>(null);
  const [invertedProgress, setInvertedProgress] = useState<number>(0);
  const [invertCompleted, setInvertCompleted] = useState(false);
  const [timerType, setTimerType] = useState<TimerType>('normal');
  const [activeTimerRemainingSec, setActiveTimerRemainingSec] = useState<number | null>(null);
  const [activeTimerColor, setActiveTimerColor] = useState<string | null>(null);
  const [activeTimerTitle, setActiveTimerTitle] = useState<string | null>(null);
  const [goalCompletedNotified, setGoalCompletedNotified] = useState(false);
  const [breakNotified, setBreakNotified] = useState(false);
  const [suspendedGoal, setSuspendedGoal] = useState<{ id: number; remainingSeconds: number; color: string; title: string } | null>(null);

  // Checklist State
  const [selectedChecklistIndex, setSelectedChecklistIndex] = useState(getSelectedChecklistIndex());
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [checklistCompleted, setChecklistCompleted] = useState<boolean[]>([]);
  const [showChecklistOnHome, setShowChecklistOnHome] = useState(getShowChecklistOnHome());

  const [savedMode, setSavedMode] = useState<'countdown' | 'stopwatch'>(mode);
  const [savedModeSeconds, setSavedModeSeconds] = useState<number>(0);
  const [goals, setGoalsState] = useState<Goal[]>(getGoals());

  const activeTimerInterval = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const goalsRef = useRef(goals);
  const modeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeGoalIdRef = useRef<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSavingToStore = useRef(false);

  useEffect(() => { goalsRef.current = goals; }, [goals]);

  // Subscribe to activitiesStore changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      if (isSavingToStore.current) return;

      const idx = getSelectedChecklistIndex();
      setSelectedChecklistIndex(idx);
      const lists = getChecklists();
      if (lists[idx]) {
        setChecklistItems(lists[idx].items.map(i => i.text));
        setChecklistCompleted(new Array(lists[idx].items.length).fill(false));
      } else {
        setChecklistItems([]);
        setChecklistCompleted([]);
      }
      setShowChecklistOnHome(getShowChecklistOnHome());
      setGoalsState(getGoals());

      // Check for new activity timer
      const activeTimer = getActiveTimer();
      if (activeTimer && timerType === 'normal') {
        startActivityTimer(activeTimer);
      }
    });
    return unsubscribe;
  }, [timerType]);

  const saveGoalsWithFlag = (newGoals: Goal[]) => {
    isSavingToStore.current = true;
    setGoalsState(newGoals);
    setGoals(newGoals);
    setTimeout(() => {
      isSavingToStore.current = false;
    }, 50);
  };

  // Start activity timer from store
  const startActivityTimer = (activeTimer: { activityName: string; activityColor: string; durationSeconds: number }) => {
    stopAllIntervals();

    setTimerType('goal');
    setMode('countdown');
    setActiveTimerRemainingSec(activeTimer.durationSeconds);
    setActiveTimerColor(activeTimer.activityColor);
    setActiveTimerTitle(activeTimer.activityName);
    setGoalCompletedNotified(false);
    activeGoalIdRef.current = null; // Not a goal from goals list

    // Clear the stored timer
    setActiveTimer(null);

    // Start the countdown
    let remaining = activeTimer.durationSeconds;
    activeTimerInterval.current = setInterval(() => {
      remaining -= 1;
      setActiveTimerRemainingSec(remaining);

      if (remaining <= 0 && !goalCompletedNotified) {
        setGoalCompletedNotified(true);
        clearInterval(activeTimerInterval.current!);
        activeTimerInterval.current = null;
        Alert.alert(
          "Timer Done",
          `"${activeTimer.activityName}" timer completed!`,
          [{
            text: "OK", onPress: () => {
              // Reset to normal mode
              setTimerType('normal');
              setActiveTimerRemainingSec(null);
              setActiveTimerColor(null);
              setActiveTimerTitle(null);
              setMode('countdown');
              setCountdownSeconds(0);
            }
          }]
        );
        Vibration.vibrate([500, 200, 500]);
      }
    }, 1000);
  };

  // Check for pending timer on mount
  useEffect(() => {
    const activeTimer = getActiveTimer();
    if (activeTimer) {
      const elapsedSeconds = Math.floor((Date.now() - activeTimer.startTime) / 1000);
      const remainingSeconds = Math.max(0, activeTimer.durationSeconds - elapsedSeconds);

      if (remainingSeconds > 0) {
        startActivityTimer({
          ...activeTimer,
          durationSeconds: remainingSeconds
        });
      } else {
        setActiveTimer(null);
      }
    }
  }, []);

  // Load initial checklist on mount
  useEffect(() => {
    const idx = getSelectedChecklistIndex();
    const lists = getChecklists();
    if (lists[idx]) {
      setChecklistItems(lists[idx].items.map(i => i.text));
      const savedKey = `checklist_completed_${idx}`;
      const saved = store[savedKey];
      if (saved) {
        const parsed = JSON.parse(saved);
        setChecklistCompleted(parsed.length === lists[idx].items.length ? parsed : new Array(lists[idx].items.length).fill(false));
      } else {
        setChecklistCompleted(new Array(lists[idx].items.length).fill(false));
      }
    }
  }, []);

  // Save checklist completion
  useEffect(() => {
    if (checklistCompleted.length > 0) {
      store[`checklist_completed_${selectedChecklistIndex}`] = JSON.stringify(checklistCompleted);
    }
  }, [checklistCompleted, selectedChecklistIndex]);

  const toggleChecklistItem = (index: number) => {
    const newCompleted = [...checklistCompleted];
    newCompleted[index] = !newCompleted[index];
    setChecklistCompleted(newCompleted);
    Vibration.vibrate(20);
  };

  // Normal mode timer - only runs when timerType is 'normal'
  useEffect(() => {
    if (timerType !== 'normal' || isInverted) return;
    if (modeIntervalRef.current) clearInterval(modeIntervalRef.current);
    if (mode === 'countdown') {
      modeIntervalRef.current = setInterval(() => setCountdownSeconds(prev => prev - 1), 1000);
    } else {
      modeIntervalRef.current = setInterval(() => setStopwatchSeconds(prev => prev + 1), 1000);
    }
    return () => { if (modeIntervalRef.current) clearInterval(modeIntervalRef.current); };
  }, [timerType, mode, isInverted]);

  const stopAllIntervals = () => {
    if (activeTimerInterval.current) clearInterval(activeTimerInterval.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (modeIntervalRef.current) clearInterval(modeIntervalRef.current);
    activeTimerInterval.current = null; progressIntervalRef.current = null; modeIntervalRef.current = null;
  };

  const stopActiveTimer = (saveRemainingForGoal: boolean = true, keepSuspended: boolean = false) => {
    stopAllIntervals();
    if (timerType === 'goal' && activeGoalIdRef.current !== null && activeTimerRemainingSec !== null && saveRemainingForGoal) {
      const updatedGoals = goals.map(g => g.id === activeGoalIdRef.current ? { ...g, remainingSeconds: activeTimerRemainingSec, isActive: false } : g);
      saveGoalsWithFlag(updatedGoals);
      activeGoalIdRef.current = null;
    }
    if (timerType !== 'normal') {
      setMode(savedMode);
      if (savedMode === 'countdown') setCountdownSeconds(savedModeSeconds);
      else setStopwatchSeconds(savedModeSeconds);
      setTimerType('normal');
      setActiveTimerRemainingSec(null); setActiveTimerColor(null); setActiveTimerTitle(null);
      setGoalCompletedNotified(false); setBreakNotified(false);
    }
    if (isInverted && !keepSuspended) {
      setIsInverted(false); setTargetSeconds(null); setInvertedProgress(0); setInvertCompleted(false);
    }
  };

  const startCountdownTimer = (type: 'goal' | 'break', initialSeconds: number, color: string, title: string, goalId?: number) => {
    stopAllIntervals();
    if (timerType === 'normal') {
      setSavedMode(mode);
      setSavedModeSeconds(mode === 'countdown' ? countdownSeconds : stopwatchSeconds);
    }
    setTimerType(type); setActiveTimerRemainingSec(initialSeconds); setActiveTimerColor(color); setActiveTimerTitle(title);
    if (type === 'goal' && goalId !== undefined) {
      activeGoalIdRef.current = goalId;
      const updatedGoals = goals.map(g => g.id === goalId ? { ...g, isActive: true } : g);
      saveGoalsWithFlag(updatedGoals);
    } else { activeGoalIdRef.current = null; }
    setGoalCompletedNotified(false); setBreakNotified(false);

    if (isInverted) { startInvertedTimer(initialSeconds); return; }

    let remaining = initialSeconds;
    activeTimerInterval.current = setInterval(() => {
      remaining -= 1;
      setActiveTimerRemainingSec(prev => prev !== null ? prev - 1 : null);
      if (type === 'goal' && goalId !== undefined) {
        const progress = Math.max(0, Math.min(100, 100 - Math.max(0, remaining)));
        const updatedGoals = goalsRef.current.map(g => g.id === goalId ? { ...g, progress, isActive: true } : g);
        saveGoalsWithFlag(updatedGoals);
        if (remaining === -1 && !goalCompletedNotified) {
          setGoalCompletedNotified(true);
          const completedGoals = goalsRef.current.map(g => g.id === goalId ? { ...g, progress: 100, isCompleted: true, remainingSeconds: null } : g);
          saveGoalsWithFlag(completedGoals);
          Alert.alert("Timer Done", `"${title}" completed! Continuing into overtime.`, [{ text: "OK" }]);
          Vibration.vibrate([500, 200, 500]);
        }
      } else if (type === 'break') {
        if (remaining === -1 && !breakNotified) {
          setBreakNotified(true);
          Alert.alert("Break Over", "Your break time is up!", [{ text: "OK" }]);
          Vibration.vibrate([500, 200, 500]);
          if (suspendedGoal) {
            const goal = goalsRef.current.find(g => g.id === suspendedGoal.id);
            if (goal && !goal.isCompleted) {
              startCountdownTimer('goal', suspendedGoal.remainingSeconds, suspendedGoal.color, suspendedGoal.title, suspendedGoal.id);
              setSuspendedGoal(null);
            }
          }
        }
      }
    }, 1000);
  };

  const startInvertedTimer = (durationSeconds: number) => {
    stopAllIntervals();
    setTargetSeconds(durationSeconds); setInvertedProgress(0); setInvertCompleted(false);
    activeTimerInterval.current = setInterval(() => {
      setInvertedProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= durationSeconds && !invertCompleted) {
          setInvertCompleted(true);
          if (timerType !== 'normal') {
            const title = activeTimerTitle || (timerType === 'break' ? 'Break' : 'Goal');
            Alert.alert("Timer Done", `"${title}" completed! Continuing into overtime.`, [{ text: "OK" }]);
            Vibration.vibrate([500, 200, 500]);
          }
        }
        return newProgress;
      });
    }, 1000);
  };

  const handleGoalPress = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    if (timerType === 'break') { setSuspendedGoal(null); stopActiveTimer(true); }
    if (timerType === 'goal' && activeGoalIdRef.current === goalId) { Vibration.vibrate(30); stopActiveTimer(true); return; }
    if (timerType !== 'normal') stopActiveTimer(true);
    let startRemaining = goal.remainingSeconds !== null && goal.remainingSeconds >= 0 ? goal.remainingSeconds : 100 - goal.progress;
    if (startRemaining < 0) startRemaining = 0;
    startCountdownTimer('goal', startRemaining, goal.color, goal.title, goalId);
    Vibration.vibrate(20);
  };

  const handleClockPress = () => {
    if (timerType === 'break') {
      Vibration.vibrate(30);
      if (suspendedGoal) {
        const goal = goals.find(g => g.id === suspendedGoal.id);
        if (goal && !goal.isCompleted) { stopActiveTimer(true); startCountdownTimer('goal', suspendedGoal.remainingSeconds, suspendedGoal.color, suspendedGoal.title, suspendedGoal.id); setSuspendedGoal(null); return; }
      }
      stopActiveTimer(false); return;
    }
    if (timerType === 'goal') {
      if (activeGoalIdRef.current !== null && activeTimerRemainingSec !== null) {
        const goal = goals.find(g => g.id === activeGoalIdRef.current);
        if (goal && !goal.isCompleted) setSuspendedGoal({ id: activeGoalIdRef.current, remainingSeconds: activeTimerRemainingSec, color: goal.color, title: goal.title });
      }
      stopActiveTimer(true);
    } else if (timerType !== 'normal') stopActiveTimer(true);
    startCountdownTimer('break', 300, '#4ECDC4', 'Break');
    Vibration.vibrate(20);
  };

  const handleAddFiveMinutes = () => {
    if (isInverted) {
      if (targetSeconds !== null) {
        const newTarget = targetSeconds + 300; setTargetSeconds(newTarget);
        if (timerType === 'goal' && activeGoalIdRef.current !== null) {
          const updatedGoals = goals.map(g => g.id === activeGoalIdRef.current ? { ...g, remainingSeconds: newTarget, progress: Math.max(0, Math.min(100, 100 - Math.max(0, newTarget))) } : g);
          saveGoalsWithFlag(updatedGoals);
        }
        Vibration.vibrate(50);
      }
    } else if (timerType === 'goal' && activeTimerRemainingSec !== null) {
      const newRemaining = activeTimerRemainingSec + 300; setActiveTimerRemainingSec(newRemaining);
      if (activeGoalIdRef.current !== null) {
        const updatedGoals = goals.map(g => g.id === activeGoalIdRef.current ? { ...g, remainingSeconds: newRemaining, progress: Math.max(0, Math.min(100, 100 - Math.max(0, newRemaining))) } : g);
        saveGoalsWithFlag(updatedGoals);
      }
      Vibration.vibrate(50);
    } else if (timerType === 'break' && activeTimerRemainingSec !== null) {
      setActiveTimerRemainingSec(prev => prev !== null ? prev + 300 : null); Vibration.vibrate(50);
    } else if (timerType === 'normal' && mode === 'countdown') {
      setCountdownSeconds(prev => prev + 300); hasVibratedRef.current = false; Vibration.vibrate(50);
    } else { Vibration.vibrate(100); }
  };

  const handleToggleInvert = () => {
    if (timerType === 'normal' && mode === 'stopwatch') { Alert.alert("Not Available", "Invert mode is only for countdown timers."); return; }
    if (!isInverted) {
      let currentDuration = timerType !== 'normal' && activeTimerRemainingSec !== null ? activeTimerRemainingSec : countdownSeconds;
      if (currentDuration < 0) currentDuration = 0;
      stopAllIntervals(); setIsInverted(true); startInvertedTimer(currentDuration);
    } else {
      if (targetSeconds === null) return;
      const remaining = Math.max(0, targetSeconds - invertedProgress);
      stopAllIntervals(); setIsInverted(false); setTargetSeconds(null); setInvertedProgress(0); setInvertCompleted(false);
      if (timerType === 'goal' && activeGoalIdRef.current !== null) {
        const goal = goals.find(g => g.id === activeGoalIdRef.current);
        if (goal) startCountdownTimer('goal', remaining, goal.color, goal.title, activeGoalIdRef.current);
        else { setTimerType('normal'); setMode('countdown'); setCountdownSeconds(remaining); }
      } else if (timerType === 'break') { startCountdownTimer('break', remaining, '#4ECDC4', 'Break'); }
      else { setMode('countdown'); setCountdownSeconds(remaining); setTimerType('normal'); }
    }
    Vibration.vibrate(30);
  };

  const getEndTimeString = (): string => {
    if (!isInverted || targetSeconds === null) return '';
    if (invertCompleted) return 'done!';
    const secondsRemaining = Math.max(0, targetSeconds - invertedProgress);
    const endDate = new Date(Date.now() + secondsRemaining * 1000);
    return `Ends at ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // Format time as MM:SS (for times under 60 minutes)
  const formatTimeMMSS = (totalSeconds: number): string => {
    const absSeconds = Math.abs(totalSeconds);
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format time as HH:MM:SS (for times 60 minutes and over)
  const formatTimeHHMMSS = (totalSeconds: number): string => {
    const absSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    if (isInverted && targetSeconds !== null) {
      const time = Math.min(invertedProgress, targetSeconds);
      return time >= 3600 ? formatTimeHHMMSS(time) : formatTimeMMSS(time);
    }
    if (timerType !== 'normal' && activeTimerRemainingSec !== null) {
      const remaining = activeTimerRemainingSec;
      return Math.abs(remaining) >= 3600 ? formatTimeHHMMSS(remaining) : formatTimeMMSS(remaining);
    }
    const time = mode === 'countdown' ? countdownSeconds : stopwatchSeconds;
    return Math.abs(time) >= 3600 ? formatTimeHHMMSS(time) : formatTimeMMSS(time);
  };

  const displayTime = getDisplayTime();
  const clockFontSize = displayTime.length > 5 ? 60 : 68;

  const isOvertime = !isInverted && timerType !== 'normal' && activeTimerRemainingSec !== null && activeTimerRemainingSec < 0;
  const clockColor = isInverted ? '#9B59B6' : (timerType === 'goal' || timerType === 'break' ? (isOvertime ? '#FF4444' : (timerType === 'goal' ? activeTimerColor : '#4ECDC4')) : '#fff');
  const doingNowText = timerType === 'goal' ? activeTimerTitle : (timerType === 'break' ? 'Break' : 'Hobby');
  const iconColor = isInverted ? '#9B59B6' : (isOvertime ? '#FF4444' : '#666');
  const plusTextColor = isInverted ? '#9B59B6' : (isOvertime ? '#FF4444' : '#666');

  const handleTouchStart = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    pressStartRef.current = { x: pageX, y: pageY };
    longPressTimer.current = setTimeout(() => {
      // Show context menu on long press - works in all timer modes
      if (pressStartRef.current) {
        if (Platform.OS === 'ios') Vibration.vibrate(100);
        setMenuPosition({ x: pressStartRef.current.x, y: pressStartRef.current.y });
        setShowContextMenu(true);
      }
    }, 500);
  };
  const handleTouchMove = (event: any) => {
    if (longPressTimer.current && pressStartRef.current) {
      const { pageX, pageY } = event.nativeEvent;
      const dx = Math.abs(pageX - pressStartRef.current.x);
      const dy = Math.abs(pageY - pressStartRef.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        pressStartRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    pressStartRef.current = null;
  };

  const handleEditHomeScreen = () => { setShowContextMenu(false); router.push('/home-customize' as any); };
  const handleAddNewGoal = () => { setShowContextMenu(false); router.push('/add-new-goal' as any); };

  return (
    <View style={styles.container} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <Text style={[styles.doingNow, isInverted && { color: '#9B59B6' }]}>{doingNowText}</Text>
          <View style={styles.clockRow}>
            <TouchableOpacity style={styles.iconButton} onPress={handleToggleInvert} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
              <Ionicons name="information-circle-outline" size={32} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClockPress} activeOpacity={0.7} style={styles.clockWrapper}>
              <Text style={[styles.clockText, { color: clockColor, fontSize: clockFontSize }]}>{displayTime}</Text>
              {isInverted && targetSeconds !== null && <Text style={styles.endTimeText}>{getEndTimeString()}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleAddFiveMinutes} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
              <Text style={[styles.iconButtonText, { color: plusTextColor }]}>+</Text>
            </TouchableOpacity>
          </View>

          {checklistItems.length > 0 && timerType === 'normal' && !isInverted && showChecklistOnHome && (
            <View style={styles.checklistSection}>
              {checklistItems.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.checklistRow} onPress={() => toggleChecklistItem(idx)}>
                  <Ionicons name={checklistCompleted[idx] ? 'checkbox' : 'square-outline'} size={20} color={checklistCompleted[idx] ? '#4ECDC4' : '#555'} />
                  <Text style={[styles.checklistText, checklistCompleted[idx] && styles.checklistDone]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View>
          <View style={styles.goalsContainer}>
            {goals.map((goal) => {
              const displayWidth = (goal.widthPercent / 100) * CONTAINER_WIDTH;
              return (
                <View key={goal.id} style={[styles.goalWrapper, { width: displayWidth, marginBottom: GAP }]}>
                  <TouchableOpacity style={styles.dragArea} onPress={() => handleGoalPress(goal.id)} activeOpacity={0.8}>
                    <View style={styles.goalBar}>
                      <View style={[styles.goalFill, { width: `${goal.progress}%`, backgroundColor: goal.color, opacity: goal.isCompleted ? 0.7 : 1 }]} />
                      <View style={styles.goalContent}>
                        {timerType === 'goal' && activeGoalIdRef.current === goal.id && !goal.isCompleted && <Text style={styles.activeIndicator}>⏳</Text>}
                        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                        <View style={styles.goalRight}>
                          {goal.isCompleted ? <Text style={styles.goalEmoji}>{goal.emoji}</Text> : goal.progress > 0 ? <Text style={styles.goalPercentRight}>{goal.progress}%</Text> : <Text style={styles.goalHint}>Tap</Text>}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          <View style={{ height: 8 }} />
        </View>
      </ScrollView>
      <Modal visible={showContextMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowContextMenu(false)}
        >
          <View style={[
            styles.contextMenu,
            {
              left: Math.max(20, Math.min(menuPosition.x - 120, screenWidth - 260)),
              top: Math.max(80, Math.min(menuPosition.y - 10, Dimensions.get('window').height - 150))
            }
          ]}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={handleEditHomeScreen}>
              <View style={styles.contextMenuIcon}>
                <Ionicons name="home-outline" size={15} color="#4ECDC4" />
              </View>
              <View style={styles.contextMenuContent}>
                <Text style={styles.contextMenuItemText}>Customize Home</Text>
                <Text style={styles.contextMenuSubtitle}>Edit goals, layout & checklist</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 40, paddingBottom: 10, paddingHorizontal: 16 },
  topSection: { alignItems: 'center' },
  doingNow: { color: '#fff', fontSize: 18, fontWeight: '500', textAlign: 'center' },
  clockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  iconButton: { width: 60, marginLeft: 20, marginRight: 20, height: 60, justifyContent: 'center', alignItems: 'center' },
  iconButtonText: { fontSize: 40, fontWeight: '100' },
  clockWrapper: { flex: 1, alignItems: 'center' },
  clockText: { fontWeight: 'bold', textAlign: 'center' },
  endTimeText: { color: '#9B59B6', fontSize: 14, textAlign: 'center', marginTop: 5 },
  checklistSection: { width: '100%', padding: 16, marginTop: 20, marginBottom: 20 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checklistText: { color: '#fff', fontSize: 14, flex: 1 },
  checklistDone: { color: '#555', textDecorationLine: 'line-through' },
  goalsContainer: { width: '100%', alignItems: 'flex-start', marginBottom: 8 },
  goalWrapper: { height: GOAL_HEIGHT, flexDirection: 'row', marginVertical: 2 },
  dragArea: { flex: 1 },
  goalBar: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, overflow: 'hidden', justifyContent: 'center', position: 'relative', height: '100%' },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 10 },
  goalContent: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 10, height: '100%', gap: 6, zIndex: 1 },
  activeIndicator: { fontSize: 11 },
  goalTitle: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  goalRight: { marginLeft: 4, flexDirection: 'row', alignItems: 'center' },
  goalPercentRight: { color: '#fff', fontSize: 11, fontWeight: '700' },
  goalEmoji: { fontSize: 16 },
  goalHint: { color: '#555', fontSize: 9 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  contextMenu: { position: 'absolute', width: 250, backgroundColor: 'rgba(30,30,30,0.98)', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 100 },
  contextMenuHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' },
  contextMenuTitle: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  contextMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  contextMenuIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  contextMenuContent: { flex: 1 },
  contextMenuItemText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  contextMenuSubtitle: { color: '#888', fontSize: 11, marginTop: 2 },
});
