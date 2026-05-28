// app/(tabs)/index.tsx - Fixed version with proper goal resumption from break
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getActiveTimer, setActiveTimer, subscribe, getChecklists, getSelectedChecklistIndex, getShowChecklistOnHome, getGoals, setGoals, Goal, getChecklistForActivity, addHistoryLog, getActivities, getPendingPauseActivity, clearPendingPauseActivity, setPreBreakTimerData, getPreBreakTimerData, clearPreBreakTimerData, getMaxPausedActivities, getSuspendedGoal, setSuspendedGoal, getSuspendedActivities, setSuspendedActivities, removeSuspendedActivity } from '../activitiesStore';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration,
  Modal, Alert, Dimensions, ScrollView, Platform, AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const store: Record<string, any> = {};

const GOAL_HEIGHT = 28;
const GAP = 8;
const CONTAINER_WIDTH = screenWidth - 32;

type TimerType = 'normal' | 'goal' | 'break' | 'idle';

// Track active session for logging
interface ActiveSession {
  type: 'activity' | 'goal' | 'break';
  title: string;
  color: string;
  startTime: number;
}

// Interface for suspended goal
interface SuspendedGoal {
  id: number;
  remainingSeconds: number;
  color: string;
  title: string;
  totalSeconds?: number;
  userDuration?: number;
}

interface SuspendedActivity {
  name: string;
  color: string;
  remainingSeconds: number;
  userDuration?: number;
}

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
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [goalCompletedNotified, setGoalCompletedNotified] = useState(false);
  const [breakNotified, setBreakNotified] = useState(false);
  const [suspendedGoal, setSuspendedGoalState] = useState<SuspendedGoal | null>(getSuspendedGoal());
  const [suspendedActivities, setSuspendedActivitiesState] = useState<SuspendedActivity[]>(getSuspendedActivities());
  const [maxPaused, setMaxPaused] = useState(getMaxPausedActivities());

  // Max suspended alert
  const [showMaxSuspendedAlert, setShowMaxSuspendedAlert] = useState(false);

  // Track current session for logging
  const currentSessionRef = useRef<ActiveSession | null>(null);
  const isRestoringRef = useRef<boolean>(false);

  // Flag to prevent auto-restart during break
  const isManualBreakRef = useRef<boolean>(false);

  // Flag to prevent recursive timer restart
  const isUpdatingTimerRef = useRef<boolean>(false);

  // Store the user-selected duration (the exact duration the user chose when starting the activity)
  const [currentActivityUserDuration, setCurrentActivityUserDuration] = useState<number | null>(null);

  // Checklist State
  const [selectedChecklistIndex, setSelectedChecklistIndex] = useState(getSelectedChecklistIndex());
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [checklistCompleted, setChecklistCompleted] = useState<boolean[]>([]);
  const [showChecklistOnHome, setShowChecklistOnHome] = useState(getShowChecklistOnHome());

  // Activity-specific checklist state
  const [activityChecklistItems, setActivityChecklistItems] = useState<string[]>([]);
  const [activityChecklistCompleted, setActivityChecklistCompleted] = useState<boolean[]>([]);
  const [showActivityChecklist, setShowActivityChecklist] = useState(false);

  const [savedMode, setSavedMode] = useState<'countdown' | 'stopwatch'>(mode);
  const [savedModeSeconds, setSavedModeSeconds] = useState<number>(0);
  const [goals, setGoalsState] = useState<Goal[]>([]);

  // Force update counter to trigger re-renders
  const [forceUpdate, setForceUpdate] = useState(0);

  const activeTimerInterval = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const goalsRef = useRef(goals);
  const modeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeGoalIdRef = useRef<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSavingToStore = useRef(false);
  const appState = useRef(AppState.currentState);

  const lastUpdateTimeRef = useRef<number>(Date.now());
  const lastRemainingSecondsRef = useRef<number | null>(null);
  const goalTotalSecondsRef = useRef<number | null>(null);
  const remainingSecondsRef = useRef<number | null>(null);
  const timerStartTimeRef = useRef<number | null>(null);

  useEffect(() => { goalsRef.current = goals; }, [goals]);

  // Load goals from store on mount
  useEffect(() => {
    const loadGoals = () => {
      const loadedGoals = getGoals();
      console.log("Loaded goals from store:", loadedGoals.map(g => ({ id: g.id, remainingSeconds: g.remainingSeconds, title: g.title, isCompleted: g.isCompleted })));
      setGoalsState(loadedGoals);
    };
    loadGoals();
  }, []);

  // Force update every 100ms to ensure UI refreshes
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const formatDurationForLog = (seconds: number): string => {
    const minutes = Math.floor(Math.abs(seconds) / 60);
    const remainingSeconds = Math.abs(seconds) % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Log the session when it ends
  const logCurrentSession = () => {
    if (currentSessionRef.current && !isRestoringRef.current) {
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - currentSessionRef.current.startTime) / 1000);

      if (durationSeconds > 0) {
        const minutes = Math.floor(durationSeconds / 60);
        addHistoryLog({
          type: currentSessionRef.current.type,
          title: currentSessionRef.current.title,
          color: currentSessionRef.current.color,
          durationSeconds: durationSeconds,
          durationMinutes: minutes,
          durationFormatted: formatDurationForLog(durationSeconds),
          timestamp: currentSessionRef.current.startTime,
          date: new Date(currentSessionRef.current.startTime).toISOString(),
        });
        console.log(`Logged time spent: ${currentSessionRef.current.title} for ${durationSeconds}s`);
      }
      currentSessionRef.current = null;
    }
  };

  // Start a new session - logs previous session automatically
  const startNewSession = (type: 'activity' | 'goal' | 'break', title: string, color: string) => {
    if (isRestoringRef.current) return;
    logCurrentSession(); // Log the previous session
    currentSessionRef.current = {
      type,
      title,
      color,
      startTime: Date.now(),
    };
    console.log(`Started: ${title} (${type})`);
  };

  const loadActivityChecklist = (activityName: string) => {
    const activities = require('../activitiesStore').getActivities();
    const activity = activities.find((a: any) => a.name === activityName);
    if (activity && activity.id) {
      const checklist = getChecklistForActivity(activity.id);
      if (checklist) {
        const lists = getChecklists();
        const checklistData = lists[checklist.index];
        if (checklistData) {
          setActivityChecklistItems(checklistData.items.map(i => i.text));
          setActivityChecklistCompleted(new Array(checklistData.items.length).fill(false));
          setShowActivityChecklist(true);
          return;
        }
      }
    }
    setShowActivityChecklist(false);
    setActivityChecklistItems([]);
    setActivityChecklistCompleted([]);
  };

  // App state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);

        if (remainingSecondsRef.current !== null && elapsedSeconds > 0) {
          const newRemaining = remainingSecondsRef.current - elapsedSeconds;
          remainingSecondsRef.current = newRemaining;
          setActiveTimerRemainingSec(newRemaining);

          if (timerType === 'goal' && activeGoalIdRef.current !== null && goalTotalSecondsRef.current !== null) {
            const totalSec = goalTotalSecondsRef.current;
            const elapsed = totalSec - newRemaining;
            const progress = Math.max(0, Math.min(100, (elapsed / totalSec) * 100));
            const updatedGoals = goals.map(g => g.id === activeGoalIdRef.current ? { ...g, progress, remainingSeconds: newRemaining } : g);
            saveGoalsWithFlag(updatedGoals);
          }
        }

        if (mode === 'countdown' && countdownSeconds > 0 && timerType === 'normal' && !isInverted) {
          const newCountdown = Math.max(0, countdownSeconds - elapsedSeconds);
          setCountdownSeconds(newCountdown);
        }

        if (mode === 'stopwatch' && timerType === 'normal' && !isInverted) {
          setStopwatchSeconds(prev => prev + elapsedSeconds);
        }
      }
      appState.current = nextAppState;
      lastUpdateTimeRef.current = Date.now();
    });
    return () => subscription.remove();
  }, [timerType, mode, isInverted, countdownSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      lastUpdateTimeRef.current = Date.now();
      if (remainingSecondsRef.current !== null) {
        lastRemainingSecondsRef.current = remainingSecondsRef.current;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to store changes
  const prevChecklistIndexRef = useRef(getSelectedChecklistIndex());
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      if (isSavingToStore.current) return;
      if (isUpdatingTimerRef.current) return;

      const idx = getSelectedChecklistIndex();
      setSelectedChecklistIndex(idx);
      const lists = getChecklists();
      if (lists[idx]) {
        setChecklistItems(lists[idx].items.map(i => i.text));
        if (prevChecklistIndexRef.current !== idx) {
          prevChecklistIndexRef.current = idx;
          const savedKey = `checklist_completed_${idx}`;
          const saved = store[savedKey];
          if (saved) {
            const parsed = JSON.parse(saved);
            setChecklistCompleted(parsed.length === lists[idx].items.length ? parsed : new Array(lists[idx].items.length).fill(false));
          } else {
            setChecklistCompleted(new Array(lists[idx].items.length).fill(false));
          }
        }
      } else {
        setChecklistItems([]);
        setChecklistCompleted([]);
      }
      setShowChecklistOnHome(getShowChecklistOnHome());
      setMaxPaused(getMaxPausedActivities());
      setGoalsState(getGoals());
      setSuspendedGoalState(getSuspendedGoal());
      setSuspendedActivitiesState(getSuspendedActivities());

      const activeTimer = getActiveTimer();
      if (activeTimer && activeTimer.activityName !== activeTimerTitle && activeTimer.activityName !== 'Break') {
        console.log("New timer from store:", activeTimer.activityName, "current:", activeTimerTitle);

        if (isManualBreakRef.current && timerType === 'break') {
          console.log("Break mode interrupted by new activity");
          isManualBreakRef.current = false;
        }

        stopAllIntervals();

        // Check if we need to pause the previous activity before starting the new one
        const pendingPause = getPendingPauseActivity();
        if (pendingPause) {
          // Check if the paused item is a goal (by matching title)
          const allGoals = getGoals();
          const matchingGoal = allGoals.find(g => g.title === pendingPause.name);
          if (matchingGoal) {
            setSuspendedGoal({
              id: matchingGoal.id,
              remainingSeconds: pendingPause.remainingSeconds,
              color: pendingPause.color,
              title: pendingPause.name,
              userDuration: pendingPause.userDuration,
            });
          } else {
            const current = getSuspendedActivities();
            if (current.length < maxPaused && !current.some(a => a.name === pendingPause.name)) {
              setSuspendedActivities([...current, pendingPause]);
            }
          }
          clearPendingPauseActivity();
        }

        startActivityTimer(activeTimer, false);
      }
    });
    return unsubscribe;
  }, [activeTimerTitle, timerType]);

  // Check for active timer on focus and force update
  useFocusEffect(
    useCallback(() => {
      if (isManualBreakRef.current && timerType === 'break') {
        return;
      }

      const activeTimer = getActiveTimer();
      if (activeTimer && activeTimer.activityName !== activeTimerTitle && activeTimer.activityName !== 'Break') {
        stopAllIntervals();
        startActivityTimer(activeTimer, false);
      }
      setForceUpdate(prev => prev + 1);
      return () => { };
    }, [activeTimerTitle, timerType])
  );

  // Check for pending timer on mount and when forceUpdate changes
  useEffect(() => {
    const activeTimer = getActiveTimer();
    if (activeTimer && activeTimer.activityName && activeTimer.activityName !== 'Break' && !activeTimerTitle && !isManualBreakRef.current) {
      const elapsedSeconds = Math.floor((Date.now() - activeTimer.startTime) / 1000);
      const remainingSeconds = Math.max(0, activeTimer.durationSeconds - elapsedSeconds);
      startActivityTimer({ ...activeTimer, durationSeconds: remainingSeconds }, false);
    }
  }, [forceUpdate]);

  const saveGoalsWithFlag = (newGoals: Goal[]) => {
    isSavingToStore.current = true;
    setGoalsState(newGoals);
    setGoals(newGoals);
    setTimeout(() => {
      isSavingToStore.current = false;
    }, 50);
  };

  const handleAddTimeToGoal = (goalId: number, event: any) => {
    event.stopPropagation();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const additionalSeconds = 60;
    const currentRemaining = remainingSecondsRef.current !== null ? remainingSecondsRef.current : 0;
    const newRemaining = currentRemaining + additionalSeconds;

    if (activeGoalIdRef.current === goalId && remainingSecondsRef.current !== null) {
      remainingSecondsRef.current += additionalSeconds;
      setActiveTimerRemainingSec(remainingSecondsRef.current);

      if (goalTotalSecondsRef.current !== null) {
        goalTotalSecondsRef.current += additionalSeconds;
        const totalSec = goalTotalSecondsRef.current;
        const elapsed = totalSec - remainingSecondsRef.current;
        const newProgress = Math.max(0, Math.min(100, (elapsed / totalSec) * 100));
        const updatedGoals = goals.map(g => g.id === goalId ? { ...g, remainingSeconds: remainingSecondsRef.current, progress: newProgress, totalSeconds: totalSec } : g);
        saveGoalsWithFlag(updatedGoals);
      }
    } else {
      const updatedGoals = goals.map(g => g.id === goalId ? { ...g, remainingSeconds: newRemaining } : g);
      saveGoalsWithFlag(updatedGoals);
    }
    Vibration.vibrate(30);
  };

  const handleLongPressAddTime = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const additionalSeconds = 3600;
    const currentRemaining = remainingSecondsRef.current !== null ? remainingSecondsRef.current : 0;
    const newRemaining = currentRemaining + additionalSeconds;

    if (activeGoalIdRef.current === goalId && remainingSecondsRef.current !== null) {
      remainingSecondsRef.current += additionalSeconds;
      setActiveTimerRemainingSec(remainingSecondsRef.current);

      if (goalTotalSecondsRef.current !== null) {
        goalTotalSecondsRef.current += additionalSeconds;
        const totalSec = goalTotalSecondsRef.current;
        const elapsed = totalSec - remainingSecondsRef.current;
        const newProgress = Math.max(0, Math.min(100, (elapsed / totalSec) * 100));
        const updatedGoals = goals.map(g => g.id === goalId ? { ...g, remainingSeconds: remainingSecondsRef.current, progress: newProgress, totalSeconds: totalSec } : g);
        saveGoalsWithFlag(updatedGoals);
      }
    } else {
      const updatedGoals = goals.map(g => g.id === goalId ? { ...g, remainingSeconds: newRemaining } : g);
      saveGoalsWithFlag(updatedGoals);
    }
    Vibration.vibrate(50);
  };

  // Start activity timer - CONTINUES BEYOND ZERO
  const startActivityTimer = (activeTimer: { activityName: string; activityColor: string; durationSeconds: number; userSelectedDuration?: number }, isRestoring: boolean = false) => {
    console.log("startActivityTimer called with:", activeTimer.activityName, "duration:", activeTimer.durationSeconds);

    // Clear the manual break flag when starting an activity
    isManualBreakRef.current = false;

    // Stop all existing intervals first
    stopAllIntervals();

    isRestoringRef.current = isRestoring;

    // Store the user-selected duration for this activity
    const userDuration = activeTimer.userSelectedDuration || activeTimer.durationSeconds;
    setCurrentActivityUserDuration(userDuration);

    // Store the start time for this timer session
    const startTime = Date.now();
    timerStartTimeRef.current = startTime;

    // Update the active timer in the store
    isUpdatingTimerRef.current = true;
    setActiveTimer({
      activityName: activeTimer.activityName,
      activityColor: activeTimer.activityColor,
      durationSeconds: activeTimer.durationSeconds,
      startTime: startTime,
      userSelectedDuration: userDuration
    });
    isUpdatingTimerRef.current = false;

    // Always start tracking session for this activity
    startNewSession('activity', activeTimer.activityName, activeTimer.activityColor);

    setTimerType('goal'); // Activities use goal timer type
    setMode('countdown');
    const safeDuration = Math.max(0, activeTimer.durationSeconds);
    remainingSecondsRef.current = safeDuration;
    setActiveTimerRemainingSec(safeDuration);
    setActiveTimerColor(activeTimer.activityColor);
    setActiveTimerTitle(activeTimer.activityName);
    setGoalCompletedNotified(false);
    activeGoalIdRef.current = null;
    goalTotalSecondsRef.current = safeDuration;
    lastUpdateTimeRef.current = startTime;

    loadActivityChecklist(activeTimer.activityName);

    if (activeTimerInterval.current) {
      clearInterval(activeTimerInterval.current);
      activeTimerInterval.current = null;
    }

    // Timer continues counting down and beyond zero (negative)
    activeTimerInterval.current = setInterval(() => {
      if (remainingSecondsRef.current === null) return;

      remainingSecondsRef.current -= 1;
      setActiveTimerRemainingSec(remainingSecondsRef.current);

      isUpdatingTimerRef.current = true;
      setActiveTimer({
        activityName: activeTimer.activityName,
        activityColor: activeTimer.activityColor,
        durationSeconds: remainingSecondsRef.current,
        startTime: timerStartTimeRef.current || startTime,
        userSelectedDuration: userDuration
      });
      isUpdatingTimerRef.current = false;

      if (remainingSecondsRef.current === -1 && !goalCompletedNotified) {
        setGoalCompletedNotified(true);
        Vibration.vibrate([500, 200, 500]);
      }

      setForceUpdate(prev => prev + 1);
    }, 1000);

    setForceUpdate(prev => prev + 1);
    isRestoringRef.current = false;
  };

  // Load initial checklist
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

  useEffect(() => {
    if (activityChecklistCompleted.length > 0) {
      store[`activity_checklist_${activeTimerTitle}`] = JSON.stringify(activityChecklistCompleted);
    }
  }, [activityChecklistCompleted, activeTimerTitle]);

  useEffect(() => {
    if (checklistCompleted.length > 0) {
      store[`checklist_completed_${selectedChecklistIndex}`] = JSON.stringify(checklistCompleted);
    }
  }, [checklistCompleted, selectedChecklistIndex]);

  const toggleChecklistItem = (index: number, isActivityChecklist: boolean = false) => {
    if (isActivityChecklist) {
      const newCompleted = [...activityChecklistCompleted];
      newCompleted[index] = !newCompleted[index];
      setActivityChecklistCompleted(newCompleted);
    } else {
      const newCompleted = [...checklistCompleted];
      newCompleted[index] = !newCompleted[index];
      setChecklistCompleted(newCompleted);
    }
    Vibration.vibrate(20);
  };

  // Normal mode timer
  useEffect(() => {
    if (timerType !== 'normal' || isInverted) return;

    if (modeIntervalRef.current) clearInterval(modeIntervalRef.current);
    if (mode === 'countdown') {
      modeIntervalRef.current = setInterval(() => {
        setCountdownSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    } else {
      modeIntervalRef.current = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (modeIntervalRef.current) {
        clearInterval(modeIntervalRef.current);
        modeIntervalRef.current = null;
      }
    };
  }, [timerType, mode, isInverted]);

  const stopAllIntervals = () => {
    if (activeTimerInterval.current) {
      clearInterval(activeTimerInterval.current);
      activeTimerInterval.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (modeIntervalRef.current) {
      clearInterval(modeIntervalRef.current);
      modeIntervalRef.current = null;
    }
    lastUpdateTimeRef.current = Date.now();
  };

  const stopActiveTimer = (saveRemainingForGoal: boolean = true, keepSuspended: boolean = false) => {
    // Log current session before stopping
    logCurrentSession();

    // Clear active timer from store when stopping
    isUpdatingTimerRef.current = true;
    setActiveTimer(null);
    isUpdatingTimerRef.current = false;

    stopAllIntervals();

    // Save goal progress when stopping
    if (timerType === 'goal' && activeGoalIdRef.current !== null && remainingSecondsRef.current !== null && saveRemainingForGoal) {
      const safeRemaining = remainingSecondsRef.current;
      const currentGoal = goals.find(g => g.id === activeGoalIdRef.current);
      console.log(`Saving goal ${activeGoalIdRef.current} (${currentGoal?.title}) with remaining seconds: ${safeRemaining}`);

      const updatedGoals = goals.map(g => g.id === activeGoalIdRef.current ? {
        ...g,
        remainingSeconds: safeRemaining,
        progress: currentGoal?.totalSeconds && currentGoal.totalSeconds > 0 ? Math.max(0, Math.min(100, ((currentGoal.totalSeconds - safeRemaining) / currentGoal.totalSeconds) * 100)) : g.progress,
        isActive: false
      } : g);
      saveGoalsWithFlag(updatedGoals);
      activeGoalIdRef.current = null;
    }

    if (timerType !== 'normal' && !keepSuspended) {
      setMode(savedMode);
      if (savedMode === 'countdown') setCountdownSeconds(Math.max(0, savedModeSeconds));
      else setStopwatchSeconds(savedModeSeconds);
      setTimerType('normal');
      setActiveTimerRemainingSec(null); setActiveTimerColor(null); setActiveTimerTitle(null);
      setShowActivityChecklist(false);
      setActivityChecklistItems([]);
      setActivityChecklistCompleted([]);
      setGoalCompletedNotified(false); setBreakNotified(false);
      goalTotalSecondsRef.current = null;
      remainingSecondsRef.current = null;
      timerStartTimeRef.current = null;
    }
    if (isInverted && !keepSuspended) {
      setIsInverted(false); setTargetSeconds(null); setInvertedProgress(0); setInvertCompleted(false);
    }
  };

  const startCountdownTimer = (type: 'goal' | 'break', initialSeconds: number, color: string, title: string, goalId?: number) => {
    console.log("startCountdownTimer called with type:", type, "initialSeconds:", initialSeconds, "title:", title);

    stopAllIntervals();
    const safeInitialSeconds = Math.max(0, initialSeconds);
    const startTime = Date.now();

    // Start tracking session for goal or break
    if (type === 'goal') {
      // Clear manual break flag when starting a goal
      isManualBreakRef.current = false;
      startNewSession('goal', title, color);
    } else if (type === 'break') {
      startNewSession('break', 'Break', '#fff');
      isManualBreakRef.current = true;
    }

    // Set the active timer in the store
    if (type === 'break') {
      isUpdatingTimerRef.current = true;
      setActiveTimer({
        activityName: 'Break',
        activityColor: '#fff',
        durationSeconds: safeInitialSeconds,
        startTime: startTime,
        userSelectedDuration: safeInitialSeconds
      });
      isUpdatingTimerRef.current = false;
      timerStartTimeRef.current = startTime;
    } else if (type === 'goal' && goalId) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        isUpdatingTimerRef.current = true;
        setActiveTimer({
          activityName: goal.title,
          activityColor: goal.color,
          durationSeconds: safeInitialSeconds,
          startTime: startTime,
          userSelectedDuration: safeInitialSeconds
        });
        isUpdatingTimerRef.current = false;
        timerStartTimeRef.current = startTime;
      }
    }

    if (timerType === 'normal') {
      setSavedMode(mode);
      setSavedModeSeconds(mode === 'countdown' ? countdownSeconds : stopwatchSeconds);
    }

    setTimerType(type);
    remainingSecondsRef.current = safeInitialSeconds;
    setActiveTimerRemainingSec(safeInitialSeconds);
    setActiveTimerColor(color);
    setActiveTimerTitle(title);

    if (type === 'goal' && goalId !== undefined) {
      activeGoalIdRef.current = goalId;
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        if (goal.totalSeconds && goal.totalSeconds > 0) {
          goalTotalSecondsRef.current = goal.totalSeconds;
        } else if (goal.remainingSeconds !== null && goal.remainingSeconds > 0) {
          const progressDecimal = (goal.progress || 0) / 100;
          if (progressDecimal < 1) {
            goalTotalSecondsRef.current = Math.round(goal.remainingSeconds / (1 - progressDecimal));
          } else {
            goalTotalSecondsRef.current = safeInitialSeconds;
          }
        } else {
          goalTotalSecondsRef.current = safeInitialSeconds;
        }
      } else {
        goalTotalSecondsRef.current = safeInitialSeconds;
      }
      const updatedGoals = goals.map(g => g.id === goalId ? { ...g, isActive: true, totalSeconds: goalTotalSecondsRef.current } : g);
      saveGoalsWithFlag(updatedGoals);
    } else {
      activeGoalIdRef.current = null;
      goalTotalSecondsRef.current = null;
    }

    setGoalCompletedNotified(false);
    setBreakNotified(false);
    lastUpdateTimeRef.current = startTime;

    if (isInverted) {
      startInvertedTimer(safeInitialSeconds);
      return;
    }

    if (activeTimerInterval.current) {
      clearInterval(activeTimerInterval.current);
      activeTimerInterval.current = null;
    }

    // Timer continues beyond zero - allow reverse counting (negative) for break timer too
    activeTimerInterval.current = setInterval(() => {
      if (remainingSecondsRef.current === null) return;

      remainingSecondsRef.current -= 1;
      setActiveTimerRemainingSec(remainingSecondsRef.current);

      // Update the active timer in store for break too
      if (type === 'break') {
        isUpdatingTimerRef.current = true;
        setActiveTimer({
          activityName: 'Break',
          activityColor: '#fff',
          durationSeconds: remainingSecondsRef.current,
          startTime: timerStartTimeRef.current || startTime,
          userSelectedDuration: safeInitialSeconds
        });
        isUpdatingTimerRef.current = false;
      }

      // Vibrate once when crossing zero (for break timer too)
      if (type === 'break' && remainingSecondsRef.current === -1 && !breakNotified) {
        setBreakNotified(true);
        Vibration.vibrate([500, 200, 500]);
      }

      // Force UI update
      setForceUpdate(prev => prev + 1);
    }, 1000);
  };

  const startInvertedTimer = (durationSeconds: number) => {
    stopAllIntervals();
    const safeDuration = Math.max(0, durationSeconds);
    setTargetSeconds(safeDuration);
    setInvertedProgress(0);
    setInvertCompleted(false);
    if (activeTimerInterval.current) clearInterval(activeTimerInterval.current);
    activeTimerInterval.current = setInterval(() => {
      setInvertedProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= safeDuration && !invertCompleted) {
          setInvertCompleted(true);
          if (timerType !== 'normal') {
            Vibration.vibrate([500, 200, 500]);
          }
        }
        return newProgress;
      });
    }, 1000);
  };

  const handleGoalPress = (goalId: number) => {
    console.log("handleGoalPress called for goalId:", goalId);
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    console.log(`Goal data: title=${goal.title}, remainingSeconds=${goal.remainingSeconds}, isCompleted=${goal.isCompleted}`);

    // If goal is completed, restart it
    if (goal.isCompleted) {
      console.log("Goal is completed, restarting with full duration");
      Vibration.vibrate(20);
      const originalDuration = goal.totalSeconds && goal.totalSeconds > 0 ? goal.totalSeconds : 3600;
      const updatedGoals = goals.map(g =>
        g.id === goalId ? {
          ...g,
          isCompleted: false,
          isActive: true,
          remainingSeconds: originalDuration,
          totalSeconds: originalDuration,
          progress: 0
        } : g
      );
      saveGoalsWithFlag(updatedGoals);
      stopActiveTimer(true);
      startCountdownTimer('goal', originalDuration, goal.color, goal.title, goalId);
      return;
    }

    // If this goal is already active, do nothing
    if (timerType === 'goal' && activeGoalIdRef.current === goalId) {
      console.log("Goal already active");
      Vibration.vibrate(20);
      return;
    }

    // If this goal is suspended, resume it
    if (suspendedGoal?.id === goalId && (timerType === 'break' || timerType === 'goal' || timerType === 'idle')) {
      console.log("Goal is suspended, resuming");
      Vibration.vibrate(30);
      handleResumeSuspendedGoal();
      return;
    }

    // ALWAYS stop whatever is currently running (activity, goal, or break)
    // Clear manual break flag if we're starting something new
    isManualBreakRef.current = false;

    // If an activity is running (not a goal, not break), pause it before starting the goal
    if (timerType === 'goal' && activeGoalIdRef.current === null && activeTimerTitle && activeTimerTitle !== 'Break' && remainingSecondsRef.current !== null) {
        // Capture activity's remaining time BEFORE stopActiveTimer overwrites the ref
        const capturedRemaining = remainingSecondsRef.current;
        const capturedColor = activeTimerColor || '#fff';
        const capturedUserDuration = currentActivityUserDuration || undefined;
        const capturedTitle = activeTimerTitle;
        const currentActs = getSuspendedActivities();
        if (currentActs.length < maxPaused && !currentActs.some(a => a.name === capturedTitle)) {
          setSuspendedActivities([...currentActs, {
            name: capturedTitle,
            color: capturedColor,
            remainingSeconds: capturedRemaining,
            userDuration: capturedUserDuration,
          }]);
        }
      setShowActivityChecklist(false);
    }

    // Stop any running timer - this will log the session and save goal progress
    stopActiveTimer(true);

    // Start the selected goal - load saved remaining seconds
    let startRemaining = goal.remainingSeconds !== null && goal.remainingSeconds !== undefined && goal.remainingSeconds > 0
      ? goal.remainingSeconds
      : 3600;

    console.log(`Starting goal ${goal.title} with remaining seconds: ${startRemaining}`);

    startCountdownTimer('goal', startRemaining, goal.color, goal.title, goalId);
    Vibration.vibrate(20);
  };

  const handleClockPress = () => {
    console.log("handleClockPress called, timerType:", timerType, "remainingSeconds:", remainingSecondsRef.current);

    if (timerType === 'break') {
      console.log("In break mode, tap clock resumes most recently paused item");
      Vibration.vibrate(30);
      isManualBreakRef.current = false;

      // Use pre-break timer data to find the most recently paused item
      const lastTimer = getPreBreakTimerData();
      if (lastTimer) {
        // Check if last timer was a goal
        if (suspendedGoal && suspendedGoal.title === lastTimer.name) {
          clearPreBreakTimerData();
          handleResumeSuspendedGoal();
          return;
        }
        // Check if last timer was an activity
        const activityIndex = suspendedActivities.findIndex(a => a.name === lastTimer.name);
        if (activityIndex !== -1) {
          clearPreBreakTimerData();
          handleResumeSuspendedActivity(activityIndex);
          return;
        }
      }

      // Fallback: resume suspendedGoal or the last suspended activity
      if (suspendedGoal) {
        handleResumeSuspendedGoal();
        return;
      }
      if (suspendedActivities.length > 0) {
        handleResumeSuspendedActivity(suspendedActivities.length - 1);
        return;
      }

      // No suspended items — just stop the break
      stopAllIntervals();
      isUpdatingTimerRef.current = true;
      setActiveTimer(null);
      isUpdatingTimerRef.current = false;
      setActiveTimerRemainingSec(null);
      setActiveTimerColor(null);
      setActiveTimerTitle(null);
      remainingSecondsRef.current = null;
      timerStartTimeRef.current = null;
      setBreakNotified(false);
      setTimerType('idle');
      return;
    }

    if (timerType === 'goal' && remainingSecondsRef.current !== null && activeTimerTitle !== 'Break') {
      console.log("Timer is running, pausing and starting break");

      // Capture remaining time BEFORE any state updates or break start
      // If activity was in overtime (negative), use 5:00 as fresh duration
      const capturedRemaining = remainingSecondsRef.current !== null && remainingSecondsRef.current < 0
        ? 300
        : remainingSecondsRef.current!;
      const capturedColor = activeTimerColor || '#fff';
      const capturedUserDuration = currentActivityUserDuration || undefined;
      const capturedTitle = activeTimerTitle!;

      if (activeGoalIdRef.current !== null) {
        const goal = goals.find(g => g.id === activeGoalIdRef.current);
        if (goal && !goal.isCompleted) {
          console.log("Pausing goal:", goal.title, "remaining:", capturedRemaining);
          setSuspendedGoal({
            id: activeGoalIdRef.current,
            remainingSeconds: capturedRemaining,
            color: goal.color,
            title: goal.title,
            totalSeconds: goalTotalSecondsRef.current || undefined,
            userDuration: capturedUserDuration,
          });
          setShowActivityChecklist(false);
        }
      } else if (capturedTitle && capturedTitle !== 'Break') {
        console.log("Pausing activity:", capturedTitle, "remaining:", capturedRemaining);
        const currentActs = getSuspendedActivities();
        if (!currentActs.some(a => a.name === capturedTitle)) {
          if (currentActs.length >= maxPaused) {
            setShowMaxSuspendedAlert(true);
          } else {
            setSuspendedActivities([...currentActs, {
              name: capturedTitle,
              color: capturedColor,
              remainingSeconds: capturedRemaining,
              userDuration: capturedUserDuration,
            }]);
          }
        }
        setShowActivityChecklist(false);
      }

      // Save pre-break timer data to store before break interval overwrites activeTimerData
      if (activeGoalIdRef.current !== null) {
        const goal = goals.find(g => g.id === activeGoalIdRef.current);
        if (goal) {
          setPreBreakTimerData({
            name: goal.title,
            color: goal.color,
            remainingSeconds: capturedRemaining,
            userDuration: capturedUserDuration,
          });
        }
      } else if (capturedTitle && capturedTitle !== 'Break') {
        setPreBreakTimerData({
          name: capturedTitle,
          color: capturedColor,
          remainingSeconds: capturedRemaining,
          userDuration: capturedUserDuration,
        });
      }

      stopActiveTimer(true);
      startCountdownTimer('break', 300, '#fff', 'Break');
      Vibration.vibrate(20);
      return;
    }

    if (timerType === 'normal') {
      console.log("Normal mode, starting break");
      startCountdownTimer('break', 300, '#fff', 'Break');
      Vibration.vibrate(20);
    }
  };

  const handleResumeSuspendedActivity = (index: number) => {
    const item = suspendedActivities[index];
    if (!item || !(timerType === 'break' || timerType === 'goal' || timerType === 'idle')) return;

    console.log("Resuming suspended activity:", item.name);
    stopAllIntervals();
    removeSuspendedActivity(index);
    Vibration.vibrate(30);

    startActivityTimer({
      activityName: item.name,
      activityColor: item.color,
      durationSeconds: item.remainingSeconds,
      userSelectedDuration: item.userDuration
    }, false);
  };

  const handleResumeSuspendedGoal = () => {
    const item = suspendedGoal;
    if (!item || !(timerType === 'break' || timerType === 'goal' || timerType === 'idle')) return;

    console.log("Resuming suspended goal:", item.title);
    stopAllIntervals();
    setSuspendedGoal(null);
    Vibration.vibrate(30);

    startCountdownTimer('goal', item.remainingSeconds, item.color, item.title, item.id);
  };

  const handleAddFiveMinutes = () => {
    if (isInverted) {
      if (targetSeconds !== null) {
        const newTarget = targetSeconds + 300;
        setTargetSeconds(newTarget);
        if (timerType === 'goal' && activeGoalIdRef.current !== null) {
          if (goalTotalSecondsRef.current !== null) goalTotalSecondsRef.current += 300;
          if (remainingSecondsRef.current !== null) {
            remainingSecondsRef.current += 300;
            setActiveTimerRemainingSec(remainingSecondsRef.current);
          }
          if (goalTotalSecondsRef.current !== null && remainingSecondsRef.current !== null) {
            const totalSec = goalTotalSecondsRef.current;
            const elapsed = totalSec - remainingSecondsRef.current;
            const newProgress = Math.max(0, Math.min(100, (elapsed / totalSec) * 100));
            const updatedGoals = goals.map(g => g.id === activeGoalIdRef.current ? { ...g, remainingSeconds: remainingSecondsRef.current, progress: newProgress, totalSeconds: totalSec } : g);
            saveGoalsWithFlag(updatedGoals);
          }
        } else if (timerType === 'goal' && activeGoalIdRef.current === null && remainingSecondsRef.current !== null) {
          remainingSecondsRef.current += 300;
          setActiveTimerRemainingSec(remainingSecondsRef.current);
          if (goalTotalSecondsRef.current !== null) goalTotalSecondsRef.current += 300;
        }
        Vibration.vibrate(50);
      }
    } else if (timerType === 'goal' && remainingSecondsRef.current !== null) {
      remainingSecondsRef.current += 300;
      setActiveTimerRemainingSec(remainingSecondsRef.current);
      if (activeGoalIdRef.current !== null) {
        if (goalTotalSecondsRef.current !== null) goalTotalSecondsRef.current += 300;
        if (goalTotalSecondsRef.current !== null && remainingSecondsRef.current !== null) {
          const totalSec = goalTotalSecondsRef.current;
          const elapsed = totalSec - remainingSecondsRef.current;
          const newProgress = Math.max(0, Math.min(100, (elapsed / totalSec) * 100));
          const updatedGoals = goals.map(g => g.id === activeGoalIdRef.current ? { ...g, remainingSeconds: remainingSecondsRef.current, progress: newProgress, totalSeconds: totalSec } : g);
          saveGoalsWithFlag(updatedGoals);
        }
      }
      Vibration.vibrate(50);
    } else if (timerType === 'break' && remainingSecondsRef.current !== null) {
      remainingSecondsRef.current += 300;
      setActiveTimerRemainingSec(remainingSecondsRef.current);
      Vibration.vibrate(50);
    } else if (timerType === 'normal' && mode === 'countdown') {
      setCountdownSeconds(prev => prev + 300);
      hasVibratedRef.current = false;
      Vibration.vibrate(50);
    } else {
      Vibration.vibrate(100);
    }
  };

  const handleToggleInvert = () => {
    if (timerType === 'normal' && mode === 'stopwatch') { Alert.alert("Not Available", "Invert mode is only for countdown timers."); return; }
    if (!isInverted) {
      let currentDuration = timerType !== 'normal' && remainingSecondsRef.current !== null ? remainingSecondsRef.current : countdownSeconds;
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
      } else if (timerType === 'break') { startCountdownTimer('break', remaining, '#fff', 'Break'); }
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

  const formatTimeMMSS = (totalSeconds: number): string => {
    const absSeconds = Math.abs(totalSeconds);
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    const sign = totalSeconds < 0 ? '-' : '';
    const cappedMinutes = Math.min(99, minutes);
    return `${sign}${cappedMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeHHMMSS = (totalSeconds: number): string => {
    const absSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    const sign = totalSeconds < 0 ? '' : '';
    const cappedHours = Math.min(99, hours);
    return `${sign}${cappedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    try {
      if (isInverted && targetSeconds !== null) {
        const time = Math.min(invertedProgress, targetSeconds);
        const safeTime = Math.max(0, time);
        return safeTime >= 3600 ? formatTimeHHMMSS(safeTime) : formatTimeMMSS(safeTime);
      }
      if (timerType !== 'normal' && remainingSecondsRef.current !== null) {
        const remaining = remainingSecondsRef.current;
        return Math.abs(remaining) >= 3600 ? formatTimeHHMMSS(remaining) : formatTimeMMSS(remaining);
      }
      const time = mode === 'countdown' ? countdownSeconds : stopwatchSeconds;
      const safeTime = Math.max(0, time);
      return safeTime >= 3600 ? formatTimeHHMMSS(safeTime) : formatTimeMMSS(safeTime);
    } catch (error) {
      console.error('Display time error:', error);
      return '00:00';
    }
  };

  const displayTime = getDisplayTime();
  const getSafeFontSize = () => {
    let baseSize = displayTime.length > 5 ? 60 : 68;
    baseSize = Math.max(24, Math.min(120, baseSize));
    return baseSize;
  };
  const clockFontSize = getSafeFontSize();

  const isOvertime = !isInverted && timerType !== 'normal' && remainingSecondsRef.current !== null && remainingSecondsRef.current < 0;
  const clockColor = isInverted ? '#9B59B6' :
    (timerType === 'goal' || timerType === 'break' ?
      (isOvertime ? '#FF4444' : (timerType === 'goal' ? activeTimerColor : '#fff')) :
      '#fff');

  const doingNowText = () => {
    if (timerType === 'break') return 'Break';
    if (timerType === 'goal') return activeTimerTitle || 'Timer';
    return '';
  };

  const iconColor = isInverted ? '#9B59B6' : (isOvertime ? '#FF4444' : '#666');
  const plusTextColor = isInverted ? '#9B59B6' : (isOvertime ? '#FF4444' : '#666');

  const handleTouchStart = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    pressStartRef.current = { x: pageX, y: pageY };
    longPressTimer.current = setTimeout(() => {
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
          <Text style={[styles.doingNow, isInverted && { color: '#9B59B6' }]}>{doingNowText()}</Text>
          <View style={styles.clockRow}>
            <TouchableOpacity style={styles.iconButton} onPress={handleToggleInvert} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
              <Text style={[styles.iconButtonText, { color: plusTextColor }]}>i</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClockPress} activeOpacity={0.7} style={styles.clockWrapper}>
              <Text style={[styles.clockText, { color: clockColor, fontSize: clockFontSize }]}>{displayTime}</Text>
              {isInverted && targetSeconds !== null && <Text style={styles.endTimeText}>{getEndTimeString()}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleAddFiveMinutes} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
              <Text style={[styles.iconButtonText, { color: plusTextColor }]}>+</Text>
            </TouchableOpacity>
          </View>

          {showActivityChecklist && activityChecklistItems.length > 0 && (
            <View style={styles.checklistSection}>
              <View style={styles.activityChecklistTitleContainer}>
                <Text style={styles.activityChecklistTitle}>Tasks for {activeTimerTitle}</Text>
              </View>
              {activityChecklistItems.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.checklistRow} onPress={() => toggleChecklistItem(idx, true)}>
                  <Ionicons name={activityChecklistCompleted[idx] ? 'checkbox' : 'square-outline'} size={20} color={activityChecklistCompleted[idx] ? '#fff' : '#555'} />
                  <Text style={[styles.checklistText, activityChecklistCompleted[idx] && styles.checklistDone]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!showActivityChecklist && checklistItems.length > 0 && showChecklistOnHome && (
            <View style={styles.checklistSection}>
              {checklistItems.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.checklistRow} onPress={() => toggleChecklistItem(idx, false)}>
                  <Ionicons name={checklistCompleted[idx] ? 'checkbox' : 'square-outline'} size={20} color={checklistCompleted[idx] ? '#fff' : '#555'} />
                  <Text style={[styles.checklistText, checklistCompleted[idx] && styles.checklistDone]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View>
          {/* Paused items */}
          {suspendedGoal && (timerType === 'break' || timerType === 'goal' || timerType === 'idle') && (
            <TouchableOpacity style={styles.pausedActivityButton} onPress={handleResumeSuspendedGoal}>
              <Ionicons name="pause-circle" size={20} color={suspendedGoal.color} />
              <Text style={[styles.pausedActivityPill, { color: suspendedGoal.color }]}>Goal</Text>
              <Text style={styles.pausedActivityText}>{suspendedGoal.title}</Text>
              <Text style={[styles.pausedActivityResume, { color: suspendedGoal.color }]}>{formatTimeMMSS(suspendedGoal.remainingSeconds)}</Text>
            </TouchableOpacity>
          )}

          {suspendedActivities.length > 0 && (timerType === 'break' || timerType === 'goal' || timerType === 'idle') && (
            suspendedActivities.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.pausedActivityButton} onPress={() => handleResumeSuspendedActivity(idx)}>
                <Ionicons name="pause-circle" size={20} color={item.color} />
                <Text style={[styles.pausedActivityPill, { color: item.color }]}>Activity</Text>
                <Text style={styles.pausedActivityText}>{item.name}</Text>
                <Text style={[styles.pausedActivityResume, { color: item.color }]}>{formatTimeMMSS(item.remainingSeconds)}</Text>
              </TouchableOpacity>
            ))
          )}

          {(suspendedGoal || suspendedActivities.length > 0) && (timerType === 'break' || timerType === 'goal' || timerType === 'idle') && <View style={styles.separator} />}

          <View style={styles.goalsContainer}>
            {[...goals].reverse().map((goal) => {
              const displayWidth = (goal.widthPercent / 100) * CONTAINER_WIDTH;
              const isInOvertime = timerType === 'goal' && activeGoalIdRef.current === goal.id && remainingSecondsRef.current !== null && remainingSecondsRef.current < 0;
              const getTimeSpentDisplay = () => {
                if (goal.totalSeconds && goal.totalSeconds > 0) {
                  const totalMinutes = Math.floor(goal.totalSeconds / 60);
                  if (totalMinutes < 60) return `${totalMinutes}m`;
                  const hours = Math.floor(totalMinutes / 60);
                  const mins = totalMinutes % 60;
                  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                }
                return '0m';
              };

              const isSuspended = suspendedGoal?.id === goal.id && timerType === 'break';

              return (
                <View key={goal.id} style={[styles.goalWrapper, { width: displayWidth, marginBottom: GAP }]}>
                  <TouchableOpacity style={styles.dragArea} onPress={() => handleGoalPress(goal.id)} activeOpacity={0.8}>
                    <View style={styles.goalBar}>
                      <View style={[styles.goalFill, { width: `${goal.progress}%`, backgroundColor: goal.color, opacity: goal.isCompleted ? 0.7 : 1 }]} />
                      <View style={styles.goalContent}>
                        {timerType === 'goal' && activeGoalIdRef.current === goal.id && !goal.isCompleted && <Text style={styles.activeIndicator}>⏳</Text>}
                        {isSuspended && !goal.isCompleted && <Text style={styles.activeIndicator}>⏸</Text>}
                        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                        <View style={styles.goalRight}>
                          {goal.isCompleted ? (
                            <View style={styles.completedGoalContainer}>
                              <Text style={[styles.completedGoalTimeText, { color: goal.color }]}>{getTimeSpentDisplay()}</Text>
                              <TouchableOpacity onPress={(e) => handleAddTimeToGoal(goal.id, e)} onLongPress={() => handleLongPressAddTime(goal.id)} style={styles.addTimeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Text style={styles.addTimeText}>+1m</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <>
                              {goal.progress > 0 && <Text style={styles.goalPercentRight}>{Math.round(goal.progress)}%</Text>}
                              {isInOvertime && (
                                <TouchableOpacity onPress={(e) => handleAddTimeToGoal(goal.id, e)} onLongPress={() => handleLongPressAddTime(goal.id)} style={styles.addTimeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                  <Text style={styles.addTimeText}>+1m</Text>
                                </TouchableOpacity>
                              )}
                            </>
                          )}
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
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowContextMenu(false)}>
          <View style={[styles.contextMenu, { left: Math.max(20, Math.min(menuPosition.x - 120, screenWidth - 260)), top: Math.max(80, Math.min(menuPosition.y - 10, Dimensions.get('window').height - 150)) }]}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={handleEditHomeScreen}>
              <View style={styles.contextMenuIcon}><Ionicons name="home-outline" size={15} color="#fff" /></View>
              <View style={styles.contextMenuContent}><Text style={styles.contextMenuItemText}>Customize Home</Text><Text style={styles.contextMenuSubtitle}>Edit goals, layout & checklist</Text></View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Max Suspended Activities Alert - Apple Style */}
      <Modal visible={showMaxSuspendedAlert} transparent animationType="fade">
        <View style={styles.appleAlertOverlay}>
          <View style={styles.appleAlertContainer}>
            <Text style={styles.appleAlertTitle}>Maximum Paused</Text>
            <Text style={styles.appleAlertMessage}>
              You can have up to {maxPaused} paused activities at a time. Resume or discard one before pausing another.
            </Text>
            <View style={styles.appleAlertDivider} />
            <TouchableOpacity style={styles.appleAlertSingleButton} onPress={() => setShowMaxSuspendedAlert(false)}>
              <Text style={styles.appleAlertConfirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 40, paddingBottom: 10, paddingHorizontal: 16 },
  topSection: { alignItems: 'center' },
  doingNow: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  clockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  iconButton: { width: 60, marginLeft: 20, marginRight: 20, height: 60, justifyContent: 'center', alignItems: 'center' },
  iconButtonText: { fontSize: 40, fontWeight: '300', fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-thin' },
  clockWrapper: { flex: 1, alignItems: 'center' },
  clockText: { fontWeight: '900', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-black', letterSpacing: 2, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  endTimeText: { color: '#9B59B6', fontSize: 14, textAlign: 'center', marginTop: 5 },
  pausedActivityButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 5, gap: 10, alignSelf: 'flex-start' },
  pausedActivityText: { color: '#fff', fontSize: 13, fontWeight: '500', flex: 1 },
  pausedActivityPill: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  pausedActivityResume: { fontSize: 12, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },
  checklistSection: { width: '100%', padding: 16, marginTop: 20, marginBottom: 20 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checklistText: { color: '#fff', fontSize: 14, flex: 1 },
  checklistDone: { color: '#555', textDecorationLine: 'line-through' },
  activityChecklistTitleContainer: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, paddingVertical: 2, paddingHorizontal: 8, alignSelf: 'center' },
  activityChecklistTitle: { color: '#000', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  goalsContainer: { width: '100%', alignItems: 'flex-start' },
  goalWrapper: { height: GOAL_HEIGHT, flexDirection: 'row', marginVertical: 2 },
  dragArea: { flex: 1 },
  goalBar: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, overflow: 'hidden', justifyContent: 'center', position: 'relative', height: '100%' },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 10 },
  goalContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, height: '100%', zIndex: 1 },
  activeIndicator: { fontSize: 11 },
  goalTitle: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  goalRight: { position: 'absolute', right: 8, flexDirection: 'row', alignItems: 'center' },
  goalPercentRight: { color: '#fff', fontSize: 11, fontWeight: '700' },
  goalEmoji: { fontSize: 16 },
  goalHint: { color: '#555', fontSize: 9 },
  addTimeButton: { backgroundColor: '#2a2a2a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  addTimeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  completedGoalContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  completedGoalTimeText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  contextMenu: { position: 'absolute', width: 250, backgroundColor: 'rgba(30,30,30,0.98)', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 100 },
  contextMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  contextMenuIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  contextMenuContent: { flex: 1 },
  contextMenuItemText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  contextMenuSubtitle: { color: '#888', fontSize: 11, marginTop: 2 },

  // Apple-style Alert
  appleAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleAlertContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    width: '80%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  appleAlertTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  appleAlertMessage: {
    color: '#8e8e93',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 18,
  },
  appleAlertDivider: {
    height: 0.5,
    backgroundColor: '#38383a',
  },
  appleAlertSingleButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleAlertConfirmText: {
    color: '#007aff',
    fontSize: 17,
    fontWeight: '600',
  },
});
