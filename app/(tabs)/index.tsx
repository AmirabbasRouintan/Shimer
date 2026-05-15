// app/(tabs)/index.tsx - Updated with activity-specific checklist

import React, { useState, useEffect, useRef } from 'react';
import { getActiveTimer, setActiveTimer, subscribe, getChecklists, getSelectedChecklistIndex, getShowChecklistOnHome, getGoals, setGoals, Goal, getChecklistForActivity } from '../activitiesStore';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration,
  Modal, Alert, Dimensions, ScrollView, Platform, AppState,
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
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [goalCompletedNotified, setGoalCompletedNotified] = useState(false);
  const [breakNotified, setBreakNotified] = useState(false);
  const [suspendedGoal, setSuspendedGoal] = useState<{ id: number; remainingSeconds: number; color: string; title: string } | null>(null);

  // PAUSED ACTIVITY: for normal activity timers (not from goals list)
  const [pausedActivity, setPausedActivity] = useState<{ name: string; color: string; remainingSeconds: number } | null>(null);

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
  const [goals, setGoalsState] = useState<Goal[]>(getGoals());

  const activeTimerInterval = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const goalsRef = useRef(goals);
  const modeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeGoalIdRef = useRef<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSavingToStore = useRef(false);
  const appState = useRef(AppState.currentState);

  // Store the last update timestamp for background recovery
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const lastRemainingSecondsRef = useRef<number | null>(null);

  // Refs for mutable timer data
  const goalTotalSecondsRef = useRef<number | null>(null);
  const remainingSecondsRef = useRef<number | null>(null);

  useEffect(() => { goalsRef.current = goals; }, [goals]);

  // Load activity checklist when activity starts
  const loadActivityChecklist = (activityName: string) => {
    // Find the activity by name to get its ID
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

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);

        if (remainingSecondsRef.current !== null && elapsedSeconds > 0 && remainingSecondsRef.current > 0) {
          const newRemaining = Math.max(0, remainingSecondsRef.current - elapsedSeconds);
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

  // Update last update time regularly
  useEffect(() => {
    const interval = setInterval(() => {
      lastUpdateTimeRef.current = Date.now();
      if (remainingSecondsRef.current !== null) {
        lastRemainingSecondsRef.current = remainingSecondsRef.current;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

      const activeTimer = getActiveTimer();
      if (activeTimer) {
        const isNewTimer = activeTimer.activityName !== activeTimerTitle;
        if (isNewTimer) {
          stopAllIntervals();
          startActivityTimer(activeTimer);
        }
      }
    });
    return unsubscribe;
  }, [activeTimerTitle]);

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
    const newRemaining = (goal.remainingSeconds !== null ? goal.remainingSeconds : 0) + additionalSeconds;

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
    const newRemaining = (goal.remainingSeconds !== null ? goal.remainingSeconds : 0) + additionalSeconds;

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

  // Start activity timer from store (normal activity, not a goal)
  const startActivityTimer = (activeTimer: { activityName: string; activityColor: string; durationSeconds: number }) => {
    stopAllIntervals();

    setTimerType('goal');
    setMode('countdown');
    const safeDuration = Math.max(0, activeTimer.durationSeconds);
    remainingSecondsRef.current = safeDuration;
    setActiveTimerRemainingSec(safeDuration);
    setActiveTimerColor(activeTimer.activityColor);
    setActiveTimerTitle(activeTimer.activityName);
    setGoalCompletedNotified(false);
    activeGoalIdRef.current = null;
    goalTotalSecondsRef.current = safeDuration;
    setPausedActivity(null);
    setSuspendedGoal(null);
    lastUpdateTimeRef.current = Date.now();

    // Load checklist for this activity
    loadActivityChecklist(activeTimer.activityName);

    if (activeTimerInterval.current) {
      clearInterval(activeTimerInterval.current);
      activeTimerInterval.current = null;
    }

    activeTimerInterval.current = setInterval(() => {
      if (remainingSecondsRef.current === null) return;

      // Prevent extremely negative values
      if (remainingSecondsRef.current <= -3600) {
        if (activeTimerInterval.current) {
          clearInterval(activeTimerInterval.current);
          activeTimerInterval.current = null;
        }
        return;
      }

      remainingSecondsRef.current -= 1;
      setActiveTimerRemainingSec(remainingSecondsRef.current);

      if (remainingSecondsRef.current <= 0 && !goalCompletedNotified) {
        setGoalCompletedNotified(true);
        if (activeTimerInterval.current) {
          clearInterval(activeTimerInterval.current);
          activeTimerInterval.current = null;
        }
        setTimerType('normal');
        setActiveTimerRemainingSec(null);
        setActiveTimerColor(null);
        setActiveTimerTitle(null);
        setShowActivityChecklist(false); // Hide activity checklist when timer finishes
        setActivityChecklistItems([]);
        setActivityChecklistCompleted([]);
        setMode('countdown');
        setCountdownSeconds(0);
        goalTotalSecondsRef.current = null;
        remainingSecondsRef.current = null;
        setActiveTimer(null);
        Vibration.vibrate([500, 200, 500]);
      }
    }, 1000);

    setActiveTimer(null);
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

  // Save checklist completion for activity checklist
  useEffect(() => {
    if (activityChecklistCompleted.length > 0) {
      // Save activity checklist completion to a separate storage key
      store[`activity_checklist_${activeTimerTitle}`] = JSON.stringify(activityChecklistCompleted);
    }
  }, [activityChecklistCompleted, activeTimerTitle]);

  // Save default checklist completion
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
    stopAllIntervals();
    if (timerType === 'goal' && activeGoalIdRef.current !== null && remainingSecondsRef.current !== null && saveRemainingForGoal) {
      const safeRemaining = Math.max(0, remainingSecondsRef.current);
      const updatedGoals = goals.map(g => g.id === activeGoalIdRef.current ? { ...g, remainingSeconds: safeRemaining, isActive: false } : g);
      saveGoalsWithFlag(updatedGoals);
      activeGoalIdRef.current = null;
    }
    if (timerType !== 'normal') {
      setMode(savedMode);
      if (savedMode === 'countdown') setCountdownSeconds(Math.max(0, savedModeSeconds));
      else setStopwatchSeconds(savedModeSeconds);
      setTimerType('normal');
      setActiveTimerRemainingSec(null); setActiveTimerColor(null); setActiveTimerTitle(null);
      setShowActivityChecklist(false); // Hide activity checklist when stopping timer
      setActivityChecklistItems([]);
      setActivityChecklistCompleted([]);
      setGoalCompletedNotified(false); setBreakNotified(false);
      goalTotalSecondsRef.current = null;
      remainingSecondsRef.current = null;
    }
    if (isInverted && !keepSuspended) {
      setIsInverted(false); setTargetSeconds(null); setInvertedProgress(0); setInvertCompleted(false);
    }
  };

  const startCountdownTimer = (type: 'goal' | 'break', initialSeconds: number, color: string, title: string, goalId?: number) => {
    stopAllIntervals();
    const safeInitialSeconds = Math.max(0, initialSeconds);

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
    setGoalCompletedNotified(false); setBreakNotified(false);
    lastUpdateTimeRef.current = Date.now();

    if (isInverted) { startInvertedTimer(safeInitialSeconds); return; }

    if (activeTimerInterval.current) clearInterval(activeTimerInterval.current);
    activeTimerInterval.current = setInterval(() => {
      if (remainingSecondsRef.current === null) return;

      // Prevent extremely negative values
      if (remainingSecondsRef.current <= -3600) {
        if (activeTimerInterval.current) {
          clearInterval(activeTimerInterval.current);
          activeTimerInterval.current = null;
        }
        return;
      }

      remainingSecondsRef.current -= 1;
      setActiveTimerRemainingSec(remainingSecondsRef.current);

      if (type === 'goal' && goalId !== undefined && goalTotalSecondsRef.current !== null && goalTotalSecondsRef.current > 0) {
        const totalSec = goalTotalSecondsRef.current;
        const elapsed = totalSec - remainingSecondsRef.current;
        const progress = Math.max(0, Math.min(100, (elapsed / totalSec) * 100));
        const updatedGoals = goalsRef.current.map(g => g.id === goalId ? { ...g, progress, isActive: true, remainingSeconds: remainingSecondsRef.current, totalSeconds: totalSec } : g);
        saveGoalsWithFlag(updatedGoals);
        if (remainingSecondsRef.current <= 0 && !goalCompletedNotified) {
          setGoalCompletedNotified(true);
          const completedGoals = goalsRef.current.map(g => g.id === goalId ? { ...g, progress: 100, isCompleted: true, remainingSeconds: null, totalSeconds: null } : g);
          saveGoalsWithFlag(completedGoals);
          Vibration.vibrate([500, 200, 500]);
        }
      } else if (type === 'break') {
        if (remainingSecondsRef.current <= 0 && !breakNotified) {
          setBreakNotified(true);
          Vibration.vibrate([500, 200, 500]);
          if (suspendedGoal) {
            const goal = goalsRef.current.find(g => g.id === suspendedGoal.id);
            if (goal && !goal.isCompleted) {
              startCountdownTimer('goal', suspendedGoal.remainingSeconds, suspendedGoal.color, suspendedGoal.title, suspendedGoal.id);
              setSuspendedGoal(null);
            }
          } else if (pausedActivity) {
            startActivityTimer({
              activityName: pausedActivity.name,
              activityColor: pausedActivity.color,
              durationSeconds: pausedActivity.remainingSeconds
            });
            setPausedActivity(null);
          }
        }
      }
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
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // If goal is completed, reset it with the original duration
    if (goal.isCompleted) {
      Vibration.vibrate(20);
      const originalDuration = goal.totalSeconds && goal.totalSeconds > 0 ? goal.totalSeconds : 3600;
      const updatedGoals = goals.map(g =>
        g.id === goalId ? {
          ...g,
          isCompleted: false,
          isActive: true,
          remainingSeconds: originalDuration,
          totalSeconds: originalDuration,
          progress: 100
        } : g
      );
      saveGoalsWithFlag(updatedGoals);
      startCountdownTimer('goal', originalDuration, goal.color, goal.title, goalId);
      return;
    }

    // If already active goal, just vibrate
    if (timerType === 'goal' && activeGoalIdRef.current === goalId) {
      Vibration.vibrate(20);
      return;
    }

    // Check if we're in the middle of an activity timer
    const isActivityTimerRunning = (timerType === 'goal' && activeGoalIdRef.current === null && remainingSecondsRef.current !== null) ||
      (timerType === 'normal' && !isInverted && (mode === 'countdown' ? countdownSeconds > 0 : stopwatchSeconds > 0));

    if (isActivityTimerRunning && remainingSecondsRef.current !== null) {
      // Pause the current activity timer before starting goal
      const currentRemaining = remainingSecondsRef.current;
      const currentTitle = activeTimerTitle;
      const currentColor = activeTimerColor;

      if (currentTitle && currentColor) {
        setPausedActivity({
          name: currentTitle,
          color: currentColor,
          remainingSeconds: currentRemaining
        });
        setShowActivityChecklist(false); // Hide activity checklist when pausing
        Vibration.vibrate(30);
      }
    }

    // Handle break mode
    if (timerType === 'break') {
      setSuspendedGoal(null);
      stopActiveTimer(true);
    }

    // Stop any running timer
    if (timerType !== 'normal') {
      stopActiveTimer(true);
    }

    // Start the goal timer with its remaining seconds
    let startRemaining = goal.remainingSeconds !== null && goal.remainingSeconds >= 0
      ? goal.remainingSeconds
      : 3600;

    if (startRemaining < 0) startRemaining = 0;

    startCountdownTimer('goal', startRemaining, goal.color, goal.title, goalId);
    Vibration.vibrate(20);
  };

  // Replace the handleClockPress function in index.tsx with this:

  const handleClockPress = () => {
    // If we're already in break mode
    if (timerType === 'break') {
      Vibration.vibrate(30);
      // Resume suspended goal if exists
      if (suspendedGoal) {
        const goal = goals.find(g => g.id === suspendedGoal.id);
        if (goal && !goal.isCompleted) {
          stopActiveTimer(true);
          startCountdownTimer('goal', suspendedGoal.remainingSeconds, suspendedGoal.color, suspendedGoal.title, suspendedGoal.id);
          setSuspendedGoal(null);
          return;
        }
      }
      // Resume paused activity if exists
      else if (pausedActivity) {
        stopActiveTimer(true);
        startActivityTimer({
          activityName: pausedActivity.name,
          activityColor: pausedActivity.color,
          durationSeconds: pausedActivity.remainingSeconds
        });
        setPausedActivity(null);
        return;
      }
      // Just stop the break timer
      stopActiveTimer(false);
      return;
    }

    // If we're in goal mode (either activity timer or regular goal)
    if (timerType === 'goal') {
      // Check if it's a regular goal (has goalId)
      if (activeGoalIdRef.current !== null && remainingSecondsRef.current !== null) {
        const goal = goals.find(g => g.id === activeGoalIdRef.current);
        if (goal && !goal.isCompleted) {
          setSuspendedGoal({
            id: activeGoalIdRef.current,
            remainingSeconds: remainingSecondsRef.current,
            color: goal.color,
            title: goal.title
          });
        }
      }
      // Check if it's an activity timer (no goalId, but has title)
      else if (activeGoalIdRef.current === null && remainingSecondsRef.current !== null && activeTimerTitle) {
        setPausedActivity({
          name: activeTimerTitle,
          color: activeTimerColor || '#4ECDC4',
          remainingSeconds: remainingSecondsRef.current
        });
        // Hide activity checklist when pausing
        setShowActivityChecklist(false);
      }
      stopActiveTimer(true);
    }
    // If we're in normal mode or any other state
    else if (timerType !== 'normal') {
      stopActiveTimer(true);
    }

    // Clear any existing paused activity display for the break
    // Don't show paused activity while in break mode

    // Start break timer
    startCountdownTimer('break', 300, '#4ECDC4', 'Break');
    Vibration.vibrate(20);
  };

  const handleResumePausedActivity = () => {
    if (pausedActivity && (timerType === 'break' || timerType === 'goal')) {
      stopAllIntervals();
      startActivityTimer({
        activityName: pausedActivity.name,
        activityColor: pausedActivity.color,
        durationSeconds: pausedActivity.remainingSeconds
      });
      setPausedActivity(null);
      Vibration.vibrate(30);
    }
  };

  const handleAddFiveMinutes = () => {
    if (isInverted) {
      if (targetSeconds !== null) {
        const newTarget = targetSeconds + 300;
        setTargetSeconds(newTarget);
        if (timerType === 'goal' && activeGoalIdRef.current !== null) {
          if (goalTotalSecondsRef.current !== null) {
            goalTotalSecondsRef.current += 300;
          }
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
        if (goalTotalSecondsRef.current !== null) {
          goalTotalSecondsRef.current += 300;
        }
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

  // SAFE FORMAT FUNCTIONS
  const formatTimeMMSS = (totalSeconds: number): string => {
    const safeSeconds = Math.max(0, Math.abs(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    const cappedMinutes = Math.min(99, minutes);
    return `${cappedMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeHHMMSS = (totalSeconds: number): string => {
    const safeSeconds = Math.max(0, Math.abs(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    const cappedHours = Math.min(99, hours);
    return `${cappedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    try {
      if (isInverted && targetSeconds !== null) {
        const time = Math.min(invertedProgress, targetSeconds);
        const safeTime = Math.max(0, time);
        return safeTime >= 3600 ? formatTimeHHMMSS(safeTime) : formatTimeMMSS(safeTime);
      }
      if (timerType !== 'normal' && remainingSecondsRef.current !== null) {
        const remaining = Math.max(0, remainingSecondsRef.current);
        return remaining >= 3600 ? formatTimeHHMMSS(remaining) : formatTimeMMSS(remaining);
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

  // SAFE FONT SIZE CALCULATION
  const getSafeFontSize = () => {
    let baseSize = displayTime.length > 5 ? 60 : 68;
    // Ensure font size is always positive and within reasonable bounds
    baseSize = Math.max(24, Math.min(120, baseSize));
    return baseSize;
  };
  const clockFontSize = getSafeFontSize();

  const isOvertime = !isInverted && timerType !== 'normal' && remainingSecondsRef.current !== null && remainingSecondsRef.current < 0;
  // Timer color: white for normal activities, colored for goal/break
  const clockColor = isInverted ? '#9B59B6' :
    (timerType === 'goal' || timerType === 'break' ?
      (isOvertime ? '#FF4444' : (timerType === 'goal' ? activeTimerColor : '#4ECDC4')) :
      '#fff');

  const doingNowText = () => {
    // If we're in break mode, show "Break" (not the paused activity name)
    if (timerType === 'break') {
      return 'Break';
    }
    // Goal timer (including activities and regular goals)
    if (timerType === 'goal') {
      return activeTimerTitle || 'Timer';
    }
    // Normal mode
    return 'Hobby';
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
                <Text style={styles.activityChecklistTitle}>
                  Tasks for {activeTimerTitle}
                </Text>
              </View>
              {activityChecklistItems.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.checklistRow} onPress={() => toggleChecklistItem(idx, true)}>
                  <Ionicons
                    name={activityChecklistCompleted[idx] ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={activityChecklistCompleted[idx] ? '#fff' : '#555'}
                  />
                  <Text style={[styles.checklistText, activityChecklistCompleted[idx] && styles.checklistDone]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Show default checklist ONLY when no activity is running */}
          {!showActivityChecklist && checklistItems.length > 0 && showChecklistOnHome && (
            <View style={styles.checklistSection}>
              {checklistItems.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.checklistRow} onPress={() => toggleChecklistItem(idx, false)}>
                  <Ionicons
                    name={checklistCompleted[idx] ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checklistCompleted[idx] ? '#fff' : '#555'}
                  />
                  <Text style={[styles.checklistText, checklistCompleted[idx] && styles.checklistDone]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View>
          {/* Show paused activity button in BOTH break AND goal modes */}
          {pausedActivity && (timerType === 'break' || timerType === 'goal') && (
            <TouchableOpacity style={[styles.pausedActivityButton, { borderLeftColor: pausedActivity.color }]} onPress={handleResumePausedActivity}>
              <Ionicons name="pause-circle" size={20} color="#fff" />
              <Text style={styles.pausedActivityText}>
                {pausedActivity.name}
              </Text>
              <Text style={[styles.pausedActivityResume, { color: pausedActivity.color }]}>
                {formatTimeMMSS(pausedActivity.remainingSeconds)}
              </Text>
            </TouchableOpacity>
          )}

          {pausedActivity && (timerType === 'break' || timerType === 'goal') && (
            <View style={styles.separator} />
          )}

          <View style={styles.goalsContainer}>
            {[...goals].reverse().map((goal) => {
              const displayWidth = (goal.widthPercent / 100) * CONTAINER_WIDTH;
              const isInOvertime = timerType === 'goal' &&
                activeGoalIdRef.current === goal.id &&
                remainingSecondsRef.current !== null &&
                remainingSecondsRef.current < 0;

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

              return (
                <View key={goal.id} style={[styles.goalWrapper, { width: displayWidth, marginBottom: GAP }]}>
                  <TouchableOpacity style={styles.dragArea} onPress={() => handleGoalPress(goal.id)} activeOpacity={0.8}>
                    <View style={styles.goalBar}>
                      <View style={[styles.goalFill, { width: `${goal.progress}%`, backgroundColor: goal.color, opacity: goal.isCompleted ? 0.7 : 1 }]} />
                      <View style={styles.goalContent}>
                        {timerType === 'goal' && activeGoalIdRef.current === goal.id && !goal.isCompleted && <Text style={styles.activeIndicator}>⏳</Text>}
                        {suspendedGoal?.id === goal.id && timerType === 'break' && !goal.isCompleted && <Text style={styles.activeIndicator}>⏸</Text>}
                        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                        <View style={styles.goalRight}>
                          {goal.isCompleted ? (
                            <View style={styles.completedGoalContainer}>
                              <Text style={[styles.completedGoalTimeText, { color: goal.color }]}>
                                {getTimeSpentDisplay()}
                              </Text>
                              <TouchableOpacity
                                onPress={(e) => handleAddTimeToGoal(goal.id, e)}
                                onLongPress={() => handleLongPressAddTime(goal.id)}
                                style={styles.addTimeButton}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Text style={styles.addTimeText}>+1m</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <>
                              {goal.progress > 0 && <Text style={styles.goalPercentRight}>{Math.round(goal.progress)}%</Text>}
                              {isInOvertime && (
                                <TouchableOpacity
                                  onPress={(e) => handleAddTimeToGoal(goal.id, e)}
                                  onLongPress={() => handleLongPressAddTime(goal.id)}
                                  style={styles.addTimeButton}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
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
                <Ionicons name="home-outline" size={15} color="#fff" />
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
  doingNow: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  clockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  iconButton: { width: 60, marginLeft: 20, marginRight: 20, height: 60, justifyContent: 'center', alignItems: 'center' },
  iconButtonText: { fontSize: 40, fontWeight: '300', fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-thin' },
  clockWrapper: { flex: 1, alignItems: 'center' },
  clockText: {
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-black',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  endTimeText: { color: '#9B59B6', fontSize: 14, textAlign: 'center', marginTop: 5 },
  pausedActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414c2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 5,
    gap: 10,
    borderLeftWidth: 3,
    borderColor: '#fff',
    alignSelf: 'flex-start',
  },
  pausedActivityText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  pausedActivityResume: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 12,
  },
  checklistSection: { width: '100%', padding: 16, marginTop: 20, marginBottom: 20 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checklistText: { color: '#fff', fontSize: 14, flex: 1 },
  checklistDone: { color: '#555', textDecorationLine: 'line-through' },
  activityChecklistTitleContainer: {
    backgroundColor: '#fff', // Or any color you want
    borderRadius: 20,
    marginBottom: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'center', // Centers the container
  },
  activityChecklistTitle: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  goalsContainer: { width: '100%', alignItems: 'flex-start' },
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
  addTimeButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  addTimeText: {
    color: '#4ECDC4',
    fontSize: 10,
    fontWeight: '700',
  },
  completedGoalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedGoalTimeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  contextMenu: { position: 'absolute', width: 250, backgroundColor: 'rgba(30,30,30,0.98)', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 100 },
  contextMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  contextMenuIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  contextMenuContent: { flex: 1 },
  contextMenuItemText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  contextMenuSubtitle: { color: '#888', fontSize: 11, marginTop: 2 },
});
