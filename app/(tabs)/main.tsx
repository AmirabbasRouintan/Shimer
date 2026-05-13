// app/main.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Switch, Platform, Keyboard, Alert, Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

const store = {};

interface ScheduleItem {
  time: string;
  emoji: string;
  activity: string;
  details: string;
  category: string;
  options?: string[];
  completed?: boolean;
}

interface DailyPlan {
  date: string;
  name: string;
  motto: string;
  wake_up: string;
  sleep_target: string;
  checklist: string[];
  schedule: ScheduleItem[];
  categories: Record<string, string>;
  notes: Record<string, string>;
}

// Helper function to parse time string to minutes since midnight
const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return -1;

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return -1;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

// Check if current time is within a schedule block
const isCurrentTimeBlock = (itemTime: string, nextItemTime: string | null, currentMinutes: number): boolean => {
  const startMinutes = parseTimeToMinutes(itemTime);
  if (startMinutes === -1) return false;

  let endMinutes: number;
  if (nextItemTime) {
    endMinutes = parseTimeToMinutes(nextItemTime);
    if (endMinutes === -1) endMinutes = startMinutes + 60;
  } else {
    endMinutes = startMinutes + 60;
  }

  const preparationStart = startMinutes - 15;
  return currentMinutes >= preparationStart && currentMinutes < endMinutes;
};

const exampleJSON = `{
  "date": "Monday, May 11, 2026",
  "name": "Your Name Here",
  "motto": "Your daily motivation quote here",
  "wake_up": "8:00 AM",
  "sleep_target": "11:00 PM",
  "checklist": [
    "Complete important work task",
    "Exercise for 30 minutes",
    "Read a book chapter",
    "Plan for tomorrow"
  ],
  "schedule": [
    {
      "time": "8:00 AM",
      "emoji": "🌅",
      "activity": "Morning Routine",
      "details": "Wake up, drink water, stretch, prepare for the day",
      "category": "morning"
    },
    {
      "time": "9:00 AM",
      "emoji": "💻",
      "activity": "Deep Work Session",
      "details": "Focus on most important task without distractions",
      "category": "work"
    },
    {
      "time": "12:00 PM",
      "emoji": "🍽️",
      "activity": "Lunch Break",
      "details": "Eat healthy, step away from screens",
      "category": "rest"
    },
    {
      "time": "1:00 PM",
      "emoji": "📚",
      "activity": "Learning Time",
      "details": "Study new skills or read educational content",
      "category": "learning"
    },
    {
      "time": "3:00 PM",
      "emoji": "🏋️",
      "activity": "Exercise",
      "details": "Physical activity to stay healthy and energized",
      "category": "fitness"
    },
    {
      "time": "6:00 PM",
      "emoji": "👨‍👩‍👧",
      "activity": "Family Time",
      "details": "Connect with family, no phones allowed",
      "category": "family"
    },
    {
      "time": "9:00 PM",
      "emoji": "🎮",
      "activity": "Free Time",
      "details": "Relax, watch shows, play games",
      "category": "leisure",
      "options": ["Watch a movie", "Play video games", "Read a book", "Listen to music"]
    },
    {
      "time": "10:30 PM",
      "emoji": "📖",
      "activity": "Evening Reflection",
      "details": "Journal, plan tomorrow, gratitude practice",
      "category": "reflection"
    },
    {
      "time": "11:00 PM",
      "emoji": "😴",
      "activity": "Sleep",
      "details": "Lights out, prepare for restful sleep",
      "category": "sleep"
    }
  ],
  "categories": {
    "morning": "Start of day rituals and preparation",
    "work": "Professional tasks and deep focus",
    "rest": "Breaks, meals, and recovery time",
    "learning": "Education and skill development",
    "fitness": "Physical exercise and health activities",
    "family": "Time spent with loved ones",
    "leisure": "Entertainment and relaxation",
    "reflection": "Journaling, planning, self-improvement",
    "sleep": "Rest and recovery"
  },
  "notes": {
    "productivity_tip": "Use Pomodoro technique: 25 min focus, 5 min break",
    "health_reminder": "Drink water every hour and stretch regularly",
    "evening_check": "Review what went well and what can improve tomorrow"
  }
}`;

export default function MainScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [showOnHome, setShowOnHome] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef(null);
  const itemRefs = useRef<(View | null)[]>([]);

  // JSON Planner states
  const [showPlanner, setShowPlanner] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [plannerError, setPlannerError] = useState('');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [checklistItems, setChecklistItems] = useState<{ text: string, completed: boolean }[]>([]);

  // Live time tracking
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animated progress bar width
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animate pulsing dot
  useEffect(() => {
    const pulseSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseSequence.start();
    return () => pulseSequence.stop();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate current block index
  useEffect(() => {
    if (!dailyPlan || !dailyPlan.schedule) {
      setCurrentBlockIndex(null);
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let activeIndex: number | null = null;

    for (let i = 0; i < dailyPlan.schedule.length; i++) {
      const item = dailyPlan.schedule[i];
      const nextItem = i + 1 < dailyPlan.schedule.length ? dailyPlan.schedule[i + 1] : null;

      if (isCurrentTimeBlock(item.time, nextItem?.time || null, currentMinutes)) {
        activeIndex = i;
        break;
      }
    }

    setCurrentBlockIndex(activeIndex);
  }, [currentTime, dailyPlan]);

  // Load saved plan from storage
  useEffect(() => {
    const savedPlan = store['daily_plan'];
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        setDailyPlan(plan);
        // Initialize completed status for schedule items
        const initializedSchedule = (plan.schedule || []).map((item: ScheduleItem, idx: number) => ({
          ...item,
          completed: store[`plan_completed_${idx}`] || false,
        }));
        setScheduleItems(initializedSchedule);

        // Initialize checklist items
        const initializedChecklist = (plan.checklist || []).map((text: string, idx: number) => ({
          text,
          completed: store[`checklist_completed_${idx}`] || false,
        }));
        setChecklistItems(initializedChecklist);
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    const saved = store[`tasks_${activeTab}`];
    if (saved) setTasks(JSON.parse(saved));
    else setTasks([]);
  }, [activeTab]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height * 0.85);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const addTask = () => {
    if (taskInput.trim()) {
      const newTask = { text: taskInput.trim(), done: false };
      const newTasks = [...tasks, newTask];
      setTasks(newTasks);
      store[`tasks_${activeTab}`] = JSON.stringify(newTasks);

      if (activeTab === 'today' && showOnHome) {
        const homeTasks = store['home_tasks'] ? JSON.parse(store['home_tasks']) : [];
        homeTasks.push(newTask);
        store['home_tasks'] = JSON.stringify(homeTasks);
      }

      setTaskInput('');
      Keyboard.dismiss();
    }
  };

  const toggleTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].done = !newTasks[index].done;
    setTasks(newTasks);
    store[`tasks_${activeTab}`] = JSON.stringify(newTasks);
  };

  const removeTask = (index) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    store[`tasks_${activeTab}`] = JSON.stringify(newTasks);
  };

  const handleConvertJSON = () => {
    if (!jsonInput.trim()) {
      setPlannerError('Please paste JSON data');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);

      if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
        setPlannerError('Invalid JSON: missing "schedule" array');
        return;
      }

      setDailyPlan(parsed);
      // Initialize completed status
      const initializedSchedule = (parsed.schedule || []).map((item: ScheduleItem, idx: number) => ({
        ...item,
        completed: false,
      }));
      setScheduleItems(initializedSchedule);

      const initializedChecklist = (parsed.checklist || []).map((text: string, idx: number) => ({
        text,
        completed: false,
      }));
      setChecklistItems(initializedChecklist);

      store['daily_plan'] = JSON.stringify(parsed);
      setPlannerError('');
      setJsonInput('');
      Alert.alert('Success', 'Your daily plan has been loaded!');
    } catch (error) {
      setPlannerError('Invalid JSON format: ' + error.message);
    }
  };

  const clearPlan = () => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete your daily plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDailyPlan(null);
            setScheduleItems([]);
            setChecklistItems([]);
            store['daily_plan'] = null;
            setCurrentBlockIndex(null);
          }
        }
      ]
    );
  };

  const copyExampleJSON = () => {
    setJsonInput(exampleJSON);
    Alert.alert('Copied!', 'Example JSON has been pasted into the editor. You can modify it now.');
  };

  // Toggle schedule item completion
  const toggleScheduleComplete = (index: number) => {
    const updated = [...scheduleItems];
    updated[index].completed = !updated[index].completed;
    setScheduleItems(updated);
    store[`plan_completed_${index}`] = updated[index].completed;
  };

  // Toggle checklist item completion
  const toggleChecklistComplete = (index: number) => {
    const updated = [...checklistItems];
    updated[index].completed = !updated[index].completed;
    setChecklistItems(updated);
    store[`checklist_completed_${index}`] = updated[index].completed;
  };

  // Scroll to current block
  const scrollToCurrentBlock = () => {
    if (currentBlockIndex !== null && itemRefs.current[currentBlockIndex]) {
      itemRefs.current[currentBlockIndex]?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        },
        () => { }
      );
    } else {
      Alert.alert('Not Available', 'No active schedule block at this time.');
    }
  };

  // Calculate completion statistics for donut chart
  const getCompletionStats = () => {
    const totalSchedule = scheduleItems.length;
    const completedSchedule = scheduleItems.filter(item => item.completed).length;
    const totalChecklist = checklistItems.length;
    const completedChecklist = checklistItems.filter(item => item.completed).length;
    const totalItems = totalSchedule + totalChecklist;
    const completedItems = completedSchedule + completedChecklist;

    return {
      total: totalItems,
      completed: completedItems,
      percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
      scheduleTotal: totalSchedule,
      scheduleCompleted: completedSchedule,
      checklistTotal: totalChecklist,
      checklistCompleted: completedChecklist,
    };
  };

  // Animate progress bar when percentage changes
  const stats = getCompletionStats();
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: stats.percentage,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [stats.percentage]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Render Donut Chart Summary Modal
  const renderSummaryModal = () => {
    const statsLocal = getCompletionStats();
    const size = 200;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (statsLocal.percentage / 100) * circumference;

    return (
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModalContent}>
            <View style={styles.summaryModalHeader}>
              <Text style={styles.summaryModalTitle}>📊 Day Progress</Text>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.summaryScroll}>
              {/* Donut Chart */}
              <View style={styles.donutContainer}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  {/* Background Circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1a1a1a"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Progress Circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#4ECDC4"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                  />
                  {/* Center Text */}
                  <G>
                    <SvgText
                      x={size / 2}
                      y={size / 2 - 10}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={32}
                      fontWeight="bold"
                    >
                      {Math.round(statsLocal.percentage)}%
                    </SvgText>
                    <SvgText
                      x={size / 2}
                      y={size / 2 + 15}
                      textAnchor="middle"
                      fill="#888"
                      fontSize={12}
                    >
                      Complete
                    </SvgText>
                  </G>
                </Svg>
              </View>

              {/* Stats Cards */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="checkbox-outline" size={24} color="#4ECDC4" />
                  <Text style={styles.statNumber}>{statsLocal.completed}/{statsLocal.total}</Text>
                  <Text style={styles.statLabel}>Total Tasks</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time-outline" size={24} color="#FF9F4A" />
                  <Text style={styles.statNumber}>{statsLocal.scheduleCompleted}/{statsLocal.scheduleTotal}</Text>
                  <Text style={styles.statLabel}>Schedule Done</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="list-outline" size={24} color="#DDA0DD" />
                  <Text style={styles.statNumber}>{statsLocal.checklistCompleted}/{statsLocal.checklistTotal}</Text>
                  <Text style={styles.statLabel}>Checklist Done</Text>
                </View>
              </View>

              {/* Achievement Message */}
              {statsLocal.percentage === 100 && (
                <View style={styles.achievementBox}>
                  <Ionicons name="trophy" size={32} color="#FFD700" />
                  <Text style={styles.achievementText}>Perfect Day! 🎉</Text>
                  <Text style={styles.achievementSubtext}>You completed everything!</Text>
                </View>
              )}

              {statsLocal.percentage >= 70 && statsLocal.percentage < 100 && (
                <View style={styles.greatBox}>
                  <Ionicons name="star" size={28} color="#FFEAA7" />
                  <Text style={styles.greatText}>Great Progress! 🌟</Text>
                  <Text style={styles.greatSubtext}>You're doing awesome today!</Text>
                </View>
              )}

              {statsLocal.percentage < 30 && statsLocal.total > 0 && (
                <View style={styles.encourageBox}>
                  <Ionicons name="rocket" size={28} color="#4ECDC4" />
                  <Text style={styles.encourageText}>You've got this! 💪</Text>
                  <Text style={styles.encourageSubtext}>Start checking off your tasks</Text>
                </View>
              )}

              <TouchableOpacity style={styles.closeSummaryButton} onPress={() => setShowSummaryModal(false)}>
                <Text style={styles.closeSummaryText}>Continue Your Day</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'morning': '#FF9F4A',
      'fitness': '#FF6B6B',
      'self-care': '#DDA0DD',
      'nutrition': '#98D8C8',
      'personal-project': '#4ECDC4',
      'preparation': '#F7B731',
      'university': '#45B7D1',
      'rest': '#96CEB4',
      'hacker-training': '#E8635E',
      'ecode-work': '#6C5CE7',
      'leisure': '#FFEAA7',
      'reflection': '#A8E6CF',
      'sleep': '#1a1a1a',
      'work': '#45B7D1',
      'learning': '#DDA0DD',
      'family': '#FF9F4A',
    };
    return colors[category] || '#666';
  };

  const getTimeRemaining = (item: ScheduleItem, nextItem: ScheduleItem | null): string => {
    const startMinutes = parseTimeToMinutes(item.time);
    if (startMinutes === -1) return '';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let endMinutes: number;
    if (nextItem) {
      endMinutes = parseTimeToMinutes(nextItem.time);
      if (endMinutes === -1) endMinutes = startMinutes + 60;
    } else {
      endMinutes = startMinutes + 60;
    }

    const remaining = endMinutes - currentMinutes;
    if (remaining <= 0) return 'Ending now';
    if (remaining < 60) return `${remaining} min left`;
    const hours = Math.floor(remaining / 60);
    const mins = remaining % 60;
    return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
  };

  const getStartingSoon = (item: ScheduleItem): boolean => {
    const startMinutes = parseTimeToMinutes(item.time);
    if (startMinutes === -1) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = startMinutes - currentMinutes;

    return diff > 0 && diff <= 15;
  };

  // Render Help Modal
  const renderHelpModal = () => (
    <Modal
      visible={showHelpModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowHelpModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.helpModalContent}>
          <View style={styles.helpModalHeader}>
            <Text style={styles.helpModalTitle}>📋 How to Use</Text>
            <TouchableOpacity onPress={() => setShowHelpModal(false)}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.helpScroll}>
            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>✅ Interactive Checklist</Text>
              <Text style={styles.helpText}>
                Tap on any checkbox next to schedule items or checklist tasks to mark them complete. Your progress is saved automatically!
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>📍 Jump to Current Time</Text>
              <Text style={styles.helpText}>
                Tap the location button in the header to instantly scroll to your current schedule block.
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>📊 View Progress</Text>
              <Text style={styles.helpText}>
                Tap the chart button to see your daily progress in a beautiful donut chart with detailed statistics.
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>⏰ Live Time Features</Text>
              <View style={styles.tipItem}>
                <Ionicons name="time-outline" size={18} color="#4ECDC4" />
                <Text style={styles.tipText}>🌟 Current block - Glowing border</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="alert-circle-outline" size={18} color="#FFEAA7" />
                <Text style={styles.tipText}>⏰ Starting soon (15 min before) - Yellow highlight</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="timer-outline" size={18} color="#FF6B6B" />
                <Text style={styles.tipText}>⌛ Time remaining display on active block</Text>
              </View>
            </View>

            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>🤖 AI Prompt</Text>
              <View style={styles.promptBox}>
                <Text style={styles.promptText}>
                  "Create a daily schedule JSON for me. Include wake_up time, sleep_target time, a motivational motto, checklist, and schedule array. Each schedule item must have: time, emoji, activity, details, and category."
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeHelpButton} onPress={() => setShowHelpModal(false)}>
            <Text style={styles.closeHelpText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render Daily Plan View with checkboxes
  const renderDailyPlan = () => {
    if (!dailyPlan) return null;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentStats = getCompletionStats();

    return (
      <View style={styles.planContainer}>
        {/* Live Time Header with Actions */}
        <View style={styles.liveTimeHeader}>
          <View style={styles.liveTimeIndicator}>
            <Animated.View style={[styles.pulsingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveTimeLabel}>LIVE</Text>
          </View>
          <Text style={styles.currentTimeText}>{timeString}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={scrollToCurrentBlock} style={styles.headerActionButton}>
              <Ionicons name="locate" size={20} color="#4ECDC4" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSummaryModal(true)} style={styles.headerActionButton}>
              <Ionicons name="stats-chart" size={20} color="#4ECDC4" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Animated Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(currentStats.percentage)}% Complete</Text>
        </View>

        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planDate}>{dailyPlan.date || 'Today'}</Text>
            <Text style={styles.planName}>{dailyPlan.name || 'Your Day'}</Text>
          </View>
          {/* Delete button removed from here */}
        </View>

        {dailyPlan.motto && (
          <View style={styles.mottoBox}>
            <Ionicons name="quote" size={16} color="#888" />
            <Text style={styles.mottoText}>{dailyPlan.motto}</Text>
          </View>
        )}

        <View style={styles.sleepRow}>
          <View style={styles.sleepItem}>
            <Ionicons name="sunny-outline" size={16} color="#FF9F4A" />
            <Text style={styles.sleepLabel}>Wake</Text>
            <Text style={styles.sleepValue}>{dailyPlan.wake_up || '—'}</Text>
          </View>
          <View style={styles.sleepItem}>
            <Ionicons name="moon-outline" size={16} color="#4ECDC4" />
            <Text style={styles.sleepLabel}>Sleep</Text>
            <Text style={styles.sleepValue}>{dailyPlan.sleep_target || '—'}</Text>
          </View>
        </View>

        {/* Schedule Timeline with Checkboxes */}
        <Text style={styles.scheduleTitle}>📋 Schedule</Text>
        {scheduleItems.map((item, idx) => {
          const isCurrent = currentBlockIndex === idx;
          const isStartingSoon = !isCurrent && getStartingSoon(item);
          const nextItem = idx + 1 < scheduleItems.length ? scheduleItems[idx + 1] : null;
          const timeRemaining = isCurrent ? getTimeRemaining(item, nextItem) : '';

          return (
            <View
              key={idx}
              style={styles.timelineItem}
              ref={(ref) => itemRefs.current[idx] = ref}
              onLayout={() => { }}
            >
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: getCategoryColor(item.category) },
                  isCurrent && styles.currentDot,
                  isStartingSoon && styles.startingSoonDot,
                  item.completed && styles.completedDot,
                ]} />
                {idx < scheduleItems.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    isCurrent && styles.currentLine,
                  ]} />
                )}
              </View>
              <View style={[
                styles.timelineContent,
                isCurrent && styles.currentTimelineContent,
                isStartingSoon && styles.startingSoonTimelineContent,
                item.completed && styles.completedTimelineContent,
              ]}>
                <View style={styles.timelineHeader}>
                  <View style={styles.timeContainer}>
                    <Text style={[
                      styles.timelineTime,
                      isCurrent && styles.currentText,
                      isStartingSoon && styles.startingSoonText,
                      item.completed && styles.completedText,
                    ]}>{item.time}</Text>
                    {isCurrent && timeRemaining && (
                      <View style={styles.timeRemainingBadge}>
                        <Ionicons name="timer-outline" size={10} color="#000" />
                        <Text style={styles.timeRemainingText}>{timeRemaining}</Text>
                      </View>
                    )}
                    {isStartingSoon && (
                      <View style={styles.startingSoonBadge}>
                        <Ionicons name="alert-circle" size={10} color="#FFEAA7" />
                        <Text style={styles.startingSoonBadgeText}>Starting soon</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.headerRight}>
                    <Text style={styles.timelineEmoji}>{item.emoji}</Text>
                    <TouchableOpacity onPress={() => toggleScheduleComplete(idx)} style={styles.checkboxButton}>
                      <Ionicons
                        name={item.completed ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={item.completed ? '#4ECDC4' : '#555'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[
                  styles.timelineActivity,
                  isCurrent && styles.currentText,
                  item.completed && styles.completedText,
                ]}>{item.activity}</Text>
                <Text style={[
                  styles.timelineDetails,
                  isCurrent && styles.currentDetailsText,
                  item.completed && styles.completedDetailsText,
                ]}>{item.details}</Text>
                {item.options && item.options.length > 0 && (
                  <View style={styles.optionsContainer}>
                    {item.options.map((opt, optIdx) => (
                      <View key={optIdx} style={styles.optionChip}>
                        <Text style={styles.optionText}>{opt}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{dailyPlan.categories?.[item.category] || item.category}</Text>
                </View>
                {isCurrent && (
                  <View style={styles.currentIndicator}>
                    <Ionicons name="play-circle" size={14} color="#4ECDC4" />
                    <Text style={styles.currentIndicatorText}>You should be doing this now</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Checklist with Checkboxes */}
        {checklistItems.length > 0 && (
          <>
            <Text style={styles.scheduleTitle}>✅ Checklist</Text>
            {checklistItems.map((item, idx) => (
              <View key={idx} style={styles.checklistItem}>
                <TouchableOpacity onPress={() => toggleChecklistComplete(idx)}>
                  <Ionicons
                    name={item.completed ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={item.completed ? '#4ECDC4' : '#555'}
                  />
                </TouchableOpacity>
                <Text style={[styles.checklistText, item.completed && styles.completedChecklistText]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Notes */}
        {dailyPlan.notes && Object.keys(dailyPlan.notes).length > 0 && (
          <>
            <Text style={styles.scheduleTitle}>📝 Notes</Text>
            {Object.entries(dailyPlan.notes).map(([key, value], idx) => (
              <View key={idx} style={styles.noteItem}>
                <Text style={styles.noteKey}>{key.replace(/_/g, ' ')}:</Text>
                <Text style={styles.noteValue}>{String(value)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Delete Plan Button at the bottom */}
        <TouchableOpacity style={styles.deletePlanButton} onPress={clearPlan}>
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          <Text style={styles.deletePlanText}>Delete Plan</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    );
  };

  // Render JSON Input View
  const renderJSONInput = () => (
    <View style={styles.jsonContainer}>
      <View style={styles.jsonHeader}>
        <View style={styles.jsonHeaderLeft}>
          <Ionicons name="code-slash" size={24} color="#4ECDC4" />
          <Text style={styles.jsonTitle}>JSON Planner</Text>
        </View>
        <View style={styles.jsonHeaderButtons}>
          <TouchableOpacity onPress={() => setShowHelpModal(true)} style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={22} color="#4ECDC4" />
          </TouchableOpacity>
          {dailyPlan && (
            <TouchableOpacity onPress={() => setShowPlanner(false)} style={styles.viewPlanButton}>
              <Text style={styles.viewPlanText}>View Plan</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.helpBanner} onPress={() => setShowHelpModal(true)}>
        <Ionicons name="bulb-outline" size={20} color="#FFEAA7" />
        <Text style={styles.helpBannerText}>
          Tap for help, AI prompts, and feature guide!
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#FFEAA7" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.exampleButton} onPress={copyExampleJSON}>
        <Ionicons name="copy-outline" size={18} color="#4ECDC4" />
        <Text style={styles.exampleButtonText}>Load Example JSON</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.jsonInput}
        multiline
        placeholder='Paste your JSON plan here... Tap "Load Example" to see a template!'
        placeholderTextColor="#555"
        value={jsonInput}
        onChangeText={(text) => {
          setJsonInput(text);
          setPlannerError('');
        }}
        textAlignVertical="top"
      />

      {plannerError ? (
        <Text style={styles.errorText}>{plannerError}</Text>
      ) : null}

      <TouchableOpacity style={styles.convertButton} onPress={handleConvertJSON}>
        <Ionicons name="sync-outline" size={20} color="#000" />
        <Text style={styles.convertButtonText}>Convert to Beautiful Plan</Text>
      </TouchableOpacity>

      <Text style={styles.jsonHint}>
        💡 Tip: Ask any AI to generate JSON for you using the prompt in Help section!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tomorrow' && styles.activeTab]}
            onPress={() => setActiveTab('tomorrow')}
          >
            <Text style={[styles.tabText, activeTab === 'tomorrow' && styles.activeTabText]}>Tomorrow</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={() => router.push('/calendar')}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.calendarButton, showPlanner && styles.activePlannerButton]}
          onPress={() => {
            setShowPlanner(!showPlanner);
            if (!showPlanner && dailyPlan) setShowPlanner(false);
          }}
        >
          <Ionicons name="code-outline" size={22} color={showPlanner ? '#4ECDC4' : '#fff'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.taskList}
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
      >
        {showPlanner ? (
          renderJSONInput()
        ) : dailyPlan ? (
          renderDailyPlan()
        ) : (
          <>
            {tasks.map((task, index) => (
              <View key={index} style={styles.taskRow}>
                <TouchableOpacity onPress={() => toggleTask(index)}>
                  <Ionicons
                    name={task.done ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={task.done ? '#fff' : '#555'}
                  />
                </TouchableOpacity>
                <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.text}</Text>
                <TouchableOpacity onPress={() => removeTask(index)}>
                  <Ionicons name="close-circle" size={20} color="#555" />
                </TouchableOpacity>
              </View>
            ))}
            {tasks.length === 0 && !dailyPlan && (
              <View style={styles.emptyTasks}>
                <Ionicons name="list-outline" size={48} color="#333" />
                <Text style={styles.emptyText}>No tasks yet</Text>
                <Text style={styles.emptySubtext}>Tap the + button below to add a task</Text>
              </View>
            )}
            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>

      {!showPlanner && !dailyPlan && (
        <View style={{ paddingBottom: keyboardHeight }}>
          {activeTab === 'today' && (
            <View style={styles.toggleRow}>
              <Ionicons name="home-outline" size={20} color="#888" />
              <Text style={styles.toggleText}>Show on Home Screen</Text>
              <Switch
                value={showOnHome}
                onValueChange={setShowOnHome}
                trackColor={{ false: '#333', true: '#4ECDC4' }}
                thumbColor={showOnHome ? '#fff' : '#888'}
              />
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputLeft}>
              <Ionicons name="timer-outline" size={20} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="Task"
                placeholderTextColor="#555"
                value={taskInput}
                onChangeText={setTaskInput}
                onSubmitEditing={addTask}
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={addTask}>
              <Text style={styles.saveButtonText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {renderHelpModal()}
      {renderSummaryModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  calendarButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePlannerButton: {
    backgroundColor: '#4ECDC420',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  taskText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  taskDone: {
    color: '#555',
    textDecorationLine: 'line-through',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: -4,
    paddingVertical: 1,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
  },
  toggleText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  inputLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTasks: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 8,
  },
  // JSON Planner Styles
  jsonContainer: {
    paddingVertical: 16,
  },
  jsonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jsonHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  jsonHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jsonTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  helpButton: {
    padding: 4,
  },
  viewPlanButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewPlanText: {
    color: '#4ECDC4',
    fontSize: 13,
  },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFEAA730',
  },
  helpBannerText: {
    flex: 1,
    color: '#FFEAA7',
    fontSize: 13,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4ECDC430',
  },
  exampleButtonText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '500',
  },
  jsonInput: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 200,
    maxHeight: 300,
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  convertButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginTop: 8,
  },
  jsonHint: {
    color: '#555',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModalContent: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  helpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  helpModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  helpScroll: {
    padding: 20,
  },
  helpSection: {
    marginBottom: 24,
  },
  helpSectionTitle: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  helpText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  promptBox: {
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  promptText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    color: '#999',
    fontSize: 13,
  },
  closeHelpButton: {
    backgroundColor: '#4ECDC4',
    margin: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeHelpText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Summary Modal Styles
  summaryModalContent: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  summaryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  summaryModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  summaryScroll: {
    padding: 20,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  achievementBox: {
    backgroundColor: '#1a2a1a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginVertical: 10,
  },
  achievementText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  achievementSubtext: {
    color: '#aaa',
    fontSize: 12,
  },
  greatBox: {
    backgroundColor: '#1a2a1a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    marginVertical: 10,
  },
  greatText: {
    color: '#FFEAA7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greatSubtext: {
    color: '#aaa',
    fontSize: 12,
  },
  encourageBox: {
    backgroundColor: '#1a1a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    marginVertical: 10,
  },
  encourageText: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  encourageSubtext: {
    color: '#aaa',
    fontSize: 12,
  },
  closeSummaryButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeSummaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Daily Plan Styles
  planContainer: {
    paddingVertical: 16,
  },
  liveTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  liveTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  liveTimeLabel: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  currentTimeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 4,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
  },
  progressText: {
    color: '#888',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planDate: {
    color: '#888',
    fontSize: 14,
  },
  planName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  mottoBox: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  mottoText: {
    color: '#999',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  sleepRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  sleepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  sleepLabel: {
    color: '#888',
    fontSize: 13,
  },
  sleepValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  currentDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC4',
  },
  startingSoonDot: {
    backgroundColor: '#FFEAA7',
  },
  completedDot: {
    backgroundColor: '#4ECDC4',
    opacity: 0.6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1a1a1a',
    marginVertical: 4,
  },
  currentLine: {
    backgroundColor: '#4ECDC4',
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  currentTimelineContent: {
    backgroundColor: '#1a2a2a',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  startingSoonTimelineContent: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  completedTimelineContent: {
    opacity: 0.7,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timelineTime: {
    color: '#4ECDC4',
    fontSize: 13,
    fontWeight: '600',
  },
  currentText: {
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  startingSoonText: {
    color: '#FFEAA7',
  },
  completedText: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  timeRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  timeRemainingText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  startingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAA7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  startingSoonBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  timelineEmoji: {
    fontSize: 18,
  },
  checkboxButton: {
    padding: 2,
  },
  timelineActivity: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  timelineDetails: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  currentDetailsText: {
    color: '#aaa',
  },
  completedDetailsText: {
    color: '#555',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  optionChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionText: {
    color: '#4ECDC4',
    fontSize: 11,
  },
  categoryChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#4ECDC430',
  },
  currentIndicatorText: {
    color: '#4ECDC4',
    fontSize: 11,
    fontWeight: '500',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  checklistText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  completedChecklistText: {
    color: '#555',
    textDecorationLine: 'line-through',
  },
  noteItem: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  noteKey: {
    color: '#4ECDC4',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  noteValue: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
  },
  // Delete Plan Button (bottom)
  deletePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,107,0.15)',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  deletePlanText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});
