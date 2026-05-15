// components/JSONPlanner.tsx
import { getPlanCompletedItem, setPlanCompletedItem } from '../app/activitiesStore';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert, Modal, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

// ---------- Helper Functions ----------
const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return -1;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return -1;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  else if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

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

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'morning': '#FF9F4A', 'fitness': '#FF6B6B', 'self-care': '#DDA0DD',
    'nutrition': '#98D8C8', 'personal-project': '#4ECDC4', 'preparation': '#F7B731',
    'university': '#45B7D1', 'rest': '#96CEB4', 'hacker-training': '#E8635E',
    'ecode-work': '#6C5CE7', 'leisure': '#FFEAA7', 'reflection': '#A8E6CF',
    'sleep': '#1a1a1a', 'work': '#45B7D1', 'learning': '#DDA0DD', 'family': '#FF9F4A',
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

// ---------- Types ----------
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

interface JSONPlannerProps {
  selectedDate?: Date;
  initialPlan?: DailyPlan | null;
  onSave?: (plan: DailyPlan) => void;
  onClose?: () => void;
}

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

// ---------- Main Component ----------
export default function JSONPlanner({ selectedDate, initialPlan, onSave, onClose }: JSONPlannerProps = {}) {
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(initialPlan || null);
  const [jsonInput, setJsonInput] = useState('');
  const [plannerError, setPlannerError] = useState('');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [checklistItems, setChecklistItems] = useState<{ text: string, completed: boolean }[]>([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<DailyPlan | null>(null);

  // Live time tracking
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const itemRefs = useRef<(View | null)[]>([]);

  // Helper to get storage keys with date
  const getStorageKey = (prefix: string, index: number): string => {
    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : 'default';
    return `${dateStr}_${prefix}_${index}`;
  };

  // Load saved plan from props
  useEffect(() => {
    if (initialPlan) {
      try {
        setDailyPlan(initialPlan);
        setEditData(JSON.parse(JSON.stringify(initialPlan)));
        const initializedSchedule = (initialPlan.schedule || []).map((item: ScheduleItem, idx: number) => ({
          ...item,
          completed: getPlanCompletedItem(getStorageKey('plan_completed', idx)),
        }));
        setScheduleItems(initializedSchedule);
        const initializedChecklist = (initialPlan.checklist || []).map((text: string, idx: number) => ({
          text,
          completed: getPlanCompletedItem(getStorageKey('checklist_completed', idx)),
        }));
        setChecklistItems(initializedChecklist);
      } catch (e) {
        console.warn('Failed to load plan', e);
      }
    }
  }, [initialPlan]);

  // Save completed items to storage
  useEffect(() => {
    scheduleItems.forEach((item, idx) => {
      setPlanCompletedItem(getStorageKey('plan_completed', idx), item.completed || false);
    });
  }, [scheduleItems]);

  useEffect(() => {
    checklistItems.forEach((item, idx) => {
      setPlanCompletedItem(getStorageKey('checklist_completed', idx), item.completed);
    });
  }, [checklistItems]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
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

  // Pulse animation
  useEffect(() => {
    const pulseSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseSequence.start();
    return () => pulseSequence.stop();
  }, []);

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
      setEditData(JSON.parse(JSON.stringify(parsed)));
      setScheduleItems((parsed.schedule || []).map((item: ScheduleItem) => ({ ...item, completed: false })));
      setChecklistItems((parsed.checklist || []).map((text: string) => ({ text, completed: false })));
      setPlannerError('');
      setJsonInput('');
      setIsEditing(false);

      if (onSave) {
        onSave(parsed);
      }

      Alert.alert('Success', 'Your daily plan has been saved!');
    } catch (error: any) {
      setPlannerError('Invalid JSON format: ' + error.message);
    }
  };

  const handleSaveEdit = () => {
    if (editData) {
      setDailyPlan(editData);
      setScheduleItems((editData.schedule || []).map((item: ScheduleItem) => ({ ...item, completed: false })));
      setChecklistItems((editData.checklist || []).map((text: string) => ({ text, completed: false })));
      setIsEditing(false);

      if (onSave) {
        onSave(editData);
      }

      Alert.alert('Success', 'Your plan has been updated!');
    }
  };

  const clearPlan = () => {
    Alert.alert(
      'Delete',
      'Are you sure you want to delete your daily plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setDailyPlan(null);
            setScheduleItems([]);
            setChecklistItems([]);
            setCurrentBlockIndex(null);
            if (onSave) {
              onSave(null as any);
            }
          }
        }
      ]
    );
  };

  const copyExampleJSON = () => {
    setJsonInput(exampleJSON);
    Alert.alert('Copied!', 'Example JSON has been pasted into the editor.');
  };

  const toggleScheduleComplete = (index: number) => {
    const updated = [...scheduleItems];
    updated[index].completed = !updated[index].completed;
    setScheduleItems(updated);
  };

  const toggleChecklistComplete = (index: number) => {
    const updated = [...checklistItems];
    updated[index].completed = !updated[index].completed;
    setChecklistItems(updated);
  };

  const scrollToCurrentBlock = () => {
    if (currentBlockIndex !== null && itemRefs.current[currentBlockIndex]) {
      itemRefs.current[currentBlockIndex]?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }),
        () => { }
      );
    } else {
      Alert.alert('Not Available', 'No active schedule block at this time.');
    }
  };

  // Progress bar animation
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

  // Update editData when dailyPlan changes
  useEffect(() => {
    if (dailyPlan && !isEditing) {
      setEditData(JSON.parse(JSON.stringify(dailyPlan)));
    }
  }, [dailyPlan]);

  // Render Edit Mode
  const renderEditMode = () => {
    if (!editData) return null;

    return (
      <ScrollView style={styles.editContainer}>
        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Basic Info</Text>
          <TextInput
            style={styles.editInput}
            placeholder="Name"
            placeholderTextColor="#555"
            value={editData.name}
            onChangeText={(text) => setEditData({ ...editData, name: text })}
          />
          <TextInput
            style={styles.editInput}
            placeholder="Motto"
            placeholderTextColor="#555"
            value={editData.motto}
            onChangeText={(text) => setEditData({ ...editData, motto: text })}
          />
          <View style={styles.editRow}>
            <TextInput
              style={[styles.editInput, styles.editHalfInput]}
              placeholder="Wake up (e.g., 8:00 AM)"
              placeholderTextColor="#555"
              value={editData.wake_up}
              onChangeText={(text) => setEditData({ ...editData, wake_up: text })}
            />
            <TextInput
              style={[styles.editInput, styles.editHalfInput]}
              placeholder="Sleep target (e.g., 11:00 PM)"
              placeholderTextColor="#555"
              value={editData.sleep_target}
              onChangeText={(text) => setEditData({ ...editData, sleep_target: text })}
            />
          </View>
        </View>

        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Checklist</Text>
          {editData.checklist.map((item, idx) => (
            <View key={idx} style={styles.editChecklistRow}>
              <TextInput
                style={styles.editChecklistInput}
                value={item}
                onChangeText={(text) => {
                  const newChecklist = [...editData.checklist];
                  newChecklist[idx] = text;
                  setEditData({ ...editData, checklist: newChecklist });
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  const newChecklist = editData.checklist.filter((_, i) => i !== idx);
                  setEditData({ ...editData, checklist: newChecklist });
                }}
              >
                <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setEditData({ ...editData, checklist: [...editData.checklist, ''] })}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Checklist Item</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Schedule</Text>
          {editData.schedule.map((item, idx) => (
            <View key={idx} style={styles.editScheduleCard}>
              <View style={styles.editScheduleHeader}>
                <TextInput
                  style={styles.editScheduleTime}
                  placeholder="Time (e.g., 9:00 AM)"
                  placeholderTextColor="#555"
                  value={item.time}
                  onChangeText={(text) => {
                    const newSchedule = [...editData.schedule];
                    newSchedule[idx] = { ...newSchedule[idx], time: text };
                    setEditData({ ...editData, schedule: newSchedule });
                  }}
                />
                <TextInput
                  style={styles.editScheduleEmoji}
                  placeholder="Emoji"
                  placeholderTextColor="#555"
                  value={item.emoji}
                  onChangeText={(text) => {
                    const newSchedule = [...editData.schedule];
                    newSchedule[idx] = { ...newSchedule[idx], emoji: text };
                    setEditData({ ...editData, schedule: newSchedule });
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const newSchedule = editData.schedule.filter((_, i) => i !== idx);
                    setEditData({ ...editData, schedule: newSchedule });
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.editScheduleActivity}
                placeholder="Activity"
                placeholderTextColor="#555"
                value={item.activity}
                onChangeText={(text) => {
                  const newSchedule = [...editData.schedule];
                  newSchedule[idx] = { ...newSchedule[idx], activity: text };
                  setEditData({ ...editData, schedule: newSchedule });
                }}
              />
              <TextInput
                style={styles.editScheduleDetails}
                placeholder="Details"
                placeholderTextColor="#555"
                value={item.details}
                multiline
                onChangeText={(text) => {
                  const newSchedule = [...editData.schedule];
                  newSchedule[idx] = { ...newSchedule[idx], details: text };
                  setEditData({ ...editData, schedule: newSchedule });
                }}
              />
              <TextInput
                style={styles.editScheduleCategory}
                placeholder="Category"
                placeholderTextColor="#555"
                value={item.category}
                onChangeText={(text) => {
                  const newSchedule = [...editData.schedule];
                  newSchedule[idx] = { ...newSchedule[idx], category: text };
                  setEditData({ ...editData, schedule: newSchedule });
                }}
              />
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setEditData({
              ...editData,
              schedule: [...editData.schedule, { time: '', emoji: '📌', activity: '', details: '', category: 'other', options: [] }]
            })}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Schedule Item</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Notes</Text>
          {Object.entries(editData.notes).map(([key, value], idx) => (
            <View key={idx} style={styles.editNoteRow}>
              <TextInput
                style={styles.editNoteKey}
                placeholder="Key"
                placeholderTextColor="#555"
                value={key}
                onChangeText={(text) => {
                  const newNotes = { ...editData.notes };
                  delete newNotes[key];
                  newNotes[text] = value;
                  setEditData({ ...editData, notes: newNotes });
                }}
              />
              <TextInput
                style={styles.editNoteValue}
                placeholder="Value"
                placeholderTextColor="#555"
                value={value}
                onChangeText={(text) => {
                  const newNotes = { ...editData.notes };
                  newNotes[key] = text;
                  setEditData({ ...editData, notes: newNotes });
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  const newNotes = { ...editData.notes };
                  delete newNotes[key];
                  setEditData({ ...editData, notes: newNotes });
                }}
              >
                <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setEditData({ ...editData, notes: { ...editData.notes, 'new_note': '' } })}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelEditButton} onPress={() => setIsEditing(false)}>
            <Text style={styles.cancelEditText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveEdit}>
            <Text style={styles.saveEditText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // Render Help Modal
  const renderHelpModal = () => (
    <Modal visible={showHelpModal} transparent animationType="slide">
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
              <Text style={styles.helpText}>Tap on any checkbox to mark complete. Progress is saved automatically!</Text>
            </View>
            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>📍 Jump to Current Time</Text>
              <Text style={styles.helpText}>Tap the location button in the header to instantly scroll to your current schedule block.</Text>
            </View>
            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>📊 View Progress</Text>
              <Text style={styles.helpText}>Tap the chart button to see daily progress in a donut chart.</Text>
            </View>
            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>✏️ Edit Plan</Text>
              <Text style={styles.helpText}>Tap the edit button to modify name, motto, schedule, checklist, and notes.</Text>
            </View>
            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>🤖 AI Prompt</Text>
              <View style={styles.promptBox}>
                <Text style={styles.promptText}>"Create a daily schedule JSON for me. Include wake_up time, sleep_target time, a motivational motto, checklist, and schedule array. Each schedule item must have: time, emoji, activity, details, and category."</Text>
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

  // Render Summary Modal (Donut Chart)
  const renderSummaryModal = () => {
    const statsLocal = getCompletionStats();
    const size = 200;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (statsLocal.percentage / 100) * circumference;

    return (
      <Modal visible={showSummaryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModalContent}>
            <View style={styles.summaryModalHeader}>
              <Text style={styles.summaryModalTitle}>📊 Day Progress</Text>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.summaryScroll}>
              <View style={styles.donutContainer}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#1a1a1a" strokeWidth={strokeWidth} fill="none" />
                  <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#fff" strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={circumference} strokeDashoffset={progressOffset} strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`} />
                  <G>
                    <SvgText x={size / 2} y={size / 2 - 10} textAnchor="middle" fill="#fff" fontSize={32} fontWeight="bold">
                      {Math.round(statsLocal.percentage)}%
                    </SvgText>
                    <SvgText x={size / 2} y={size / 2 + 15} textAnchor="middle" fill="#888" fontSize={12}>Complete</SvgText>
                  </G>
                </Svg>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}><Ionicons name="checkbox-outline" size={24} color="#fff" /><Text style={styles.statNumber}>{statsLocal.completed}/{statsLocal.total}</Text><Text style={styles.statLabel}>Total Tasks</Text></View>
                <View style={styles.statCard}><Ionicons name="time-outline" size={24} color="#FF9F4A" /><Text style={styles.statNumber}>{statsLocal.scheduleCompleted}/{statsLocal.scheduleTotal}</Text><Text style={styles.statLabel}>Schedule</Text></View>
                <View style={styles.statCard}><Ionicons name="list-outline" size={24} color="#DDA0DD" /><Text style={styles.statNumber}>{statsLocal.checklistCompleted}/{statsLocal.checklistTotal}</Text><Text style={styles.statLabel}>Checklist</Text></View>
              </View>
              {statsLocal.percentage === 100 && <View style={styles.achievementBox}><Ionicons name="trophy" size={32} color="#FFD700" /><Text style={styles.achievementText}>Perfect Day! 🎉</Text><Text style={styles.achievementSubtext}>You completed everything!</Text></View>}
              {statsLocal.percentage >= 70 && statsLocal.percentage < 100 && <View style={styles.greatBox}><Ionicons name="star" size={28} color="#FFEAA7" /><Text style={styles.greatText}>Great Progress! 🌟</Text><Text style={styles.greatSubtext}>You're doing awesome today!</Text></View>}
              {statsLocal.percentage < 30 && statsLocal.total > 0 && <View style={styles.encourageBox}><Ionicons name="rocket" size={28} color="#fff" /><Text style={styles.encourageText}>You've got this! 💪</Text><Text style={styles.encourageSubtext}>Start checking off your tasks</Text></View>}
              <TouchableOpacity style={styles.closeSummaryButton} onPress={() => setShowSummaryModal(false)}><Text style={styles.closeSummaryText}>Continue Your Day</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Daily Plan View
  const renderDailyPlanView = () => {
    if (!dailyPlan) return null;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.planContainer}>
        <View style={styles.liveTimeHeader}>
          <View style={styles.liveTimeIndicator}>
            <Animated.View style={[styles.pulsingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveTimeLabel}>LIVE</Text>
          </View>
          <Text style={styles.currentTimeText}>{timeString}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={scrollToCurrentBlock}><Ionicons name="locate" size={20} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSummaryModal(true)}><Ionicons name="stats-chart" size={20} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(true)}><Ionicons name="create-outline" size={20} color="#fff" /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}><Animated.View style={[styles.progressBarFill, { width: progressWidth }]} /></View>
          <Text style={styles.progressText}>{Math.round(stats.percentage)}% Complete</Text>
        </View>

        <View style={styles.planHeader}>
          <View><Text style={styles.planDate}>{dailyPlan.date || (selectedDate ? selectedDate.toLocaleDateString() : 'Today')}</Text><Text style={styles.planName}>{dailyPlan.name || 'Your Day'}</Text></View>
        </View>
        {dailyPlan.motto && <View style={styles.mottoBox}><Ionicons name="quote" size={16} color="#888" /><Text style={styles.mottoText}>{dailyPlan.motto}</Text></View>}
        <View style={styles.sleepRow}>
          <View style={styles.sleepItem}><Ionicons name="sunny-outline" size={16} color="#FF9F4A" /><Text style={styles.sleepLabel}>Wake</Text><Text style={styles.sleepValue}>{dailyPlan.wake_up || '—'}</Text></View>
          <View style={styles.sleepItem}><Ionicons name="moon-outline" size={16} color="#fff" /><Text style={styles.sleepLabel}>Sleep</Text><Text style={styles.sleepValue}>{dailyPlan.sleep_target || '—'}</Text></View>
        </View>

        <Text style={styles.scheduleTitle}>📋 Schedule</Text>
        {scheduleItems.map((item, idx) => {
          const isCurrent = currentBlockIndex === idx;
          const isStartingSoon = !isCurrent && getStartingSoon(item);
          const nextItem = idx + 1 < scheduleItems.length ? scheduleItems[idx + 1] : null;
          const timeRemaining = isCurrent ? getTimeRemaining(item, nextItem) : '';
          return (
            <View key={idx} style={styles.timelineItem} ref={(ref) => itemRefs.current[idx] = ref}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: getCategoryColor(item.category) }, isCurrent && styles.currentDot, isStartingSoon && styles.startingSoonDot, item.completed && styles.completedDot]} />
                {idx < scheduleItems.length - 1 && <View style={[styles.timelineLine, isCurrent && styles.currentLine]} />}
              </View>
              <View style={[styles.timelineContent, isCurrent && styles.currentTimelineContent, isStartingSoon && styles.startingSoonTimelineContent, item.completed && styles.completedTimelineContent]}>
                <View style={styles.timelineHeader}>
                  <View style={styles.timeContainer}>
                    <Text style={[styles.timelineTime, isCurrent && styles.currentText, isStartingSoon && styles.startingSoonText, item.completed && styles.completedText]}>{item.time}</Text>
                    {isCurrent && timeRemaining && <View style={styles.timeRemainingBadge}><Ionicons name="timer-outline" size={10} color="#000" /><Text style={styles.timeRemainingText}>{timeRemaining}</Text></View>}
                    {isStartingSoon && <View style={styles.startingSoonBadge}><Ionicons name="alert-circle" size={10} color="#000" /><Text style={styles.startingSoonBadgeText}>Starting soon</Text></View>}
                  </View>
                  <View style={styles.headerRight}>
                    <Text style={styles.timelineEmoji}>{item.emoji}</Text>
                    <TouchableOpacity onPress={() => toggleScheduleComplete(idx)}><Ionicons name={item.completed ? 'checkbox' : 'square-outline'} size={22} color={item.completed ? '#fff' : '#555'} /></TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.timelineActivity, isCurrent && styles.currentText, item.completed && styles.completedText]}>{item.activity}</Text>
                <Text style={[styles.timelineDetails, isCurrent && styles.currentDetailsText, item.completed && styles.completedDetailsText]}>{item.details}</Text>
                {item.options && item.options.length > 0 && <View style={styles.optionsContainer}>{item.options.map((opt, i) => <View key={i} style={styles.optionChip}><Text style={styles.optionText}>{opt}</Text></View>)}</View>}
                <View style={styles.categoryChip}><Text style={styles.categoryChipText}>{dailyPlan.categories?.[item.category] || item.category}</Text></View>
                {isCurrent && <View style={styles.currentIndicator}><Ionicons name="play-circle" size={14} color="#fff" /><Text style={styles.currentIndicatorText}>You should be doing this now</Text></View>}
              </View>
            </View>
          );
        })}

        {checklistItems.length > 0 && (
          <>
            <Text style={styles.scheduleTitle}>✅ Checklist</Text>
            {checklistItems.map((item, idx) => (
              <View key={idx} style={styles.checklistItem}>
                <TouchableOpacity onPress={() => toggleChecklistComplete(idx)}><Ionicons name={item.completed ? 'checkbox' : 'square-outline'} size={22} color={item.completed ? '#fff' : '#555'} /></TouchableOpacity>
                <Text style={[styles.checklistText, item.completed && styles.completedChecklistText]}>{item.text}</Text>
              </View>
            ))}
          </>
        )}

        {dailyPlan.notes && Object.keys(dailyPlan.notes).length > 0 && (
          <>
            <Text style={styles.scheduleTitle}>📝 Notes</Text>
            {Object.entries(dailyPlan.notes).map(([key, value], idx) => (
              <View key={idx} style={styles.noteItem}><Text style={styles.noteKey}>{key.replace(/_/g, ' ')}:</Text><Text style={styles.noteValue}>{String(value)}</Text></View>
            ))}
          </>
        )}

        <View style={{ height: 60 }} />
      </View>
    );
  };

  // Render JSON Input View
  const renderJSONInputView = () => (
    <View style={styles.jsonContainer}>
      <View style={styles.jsonHeader}>
        <View style={styles.jsonHeaderLeft}><Ionicons name="code-slash" size={24} color="#fff" /><Text style={styles.jsonTitle}>JSON Planner</Text></View>
        <View style={styles.jsonHeaderButtons}>
          <TouchableOpacity onPress={() => setShowHelpModal(true)}><Ionicons name="help-circle-outline" size={22} color="#fff" /></TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.helpBanner} onPress={() => setShowHelpModal(true)}><Ionicons name="bulb-outline" size={20} color="#FFEAA7" /><Text style={styles.helpBannerText}>Tap for help, AI prompts, and feature guide!</Text><Ionicons name="chevron-forward" size={16} color="#FFEAA7" /></TouchableOpacity>
      <TouchableOpacity style={styles.exampleButton} onPress={copyExampleJSON}><Ionicons name="copy-outline" size={18} color="#fff" /><Text style={styles.exampleButtonText}>Load Example JSON</Text></TouchableOpacity>
      <TextInput style={styles.jsonInput} multiline placeholder='Paste your JSON plan here...' placeholderTextColor="#555" value={jsonInput} onChangeText={(text) => { setJsonInput(text); setPlannerError(''); }} textAlignVertical="top" />
      {plannerError ? <Text style={styles.errorText}>{plannerError}</Text> : null}
      <TouchableOpacity style={styles.convertButton} onPress={handleConvertJSON}><Ionicons name="sync-outline" size={20} color="#000" /><Text style={styles.convertButtonText}>Convert to Beautiful Plan</Text></TouchableOpacity>
      <Text style={styles.jsonHint}>💡 Tip: Ask any AI to generate JSON for you using the prompt in Help section!</Text>
    </View>
  );

  return (
    <ScrollView ref={scrollViewRef} style={styles.scrollView} keyboardShouldPersistTaps="handled">
      {isEditing && dailyPlan ? renderEditMode() : (dailyPlan ? renderDailyPlanView() : renderJSONInputView())}
      {renderHelpModal()}
      {renderSummaryModal()}
      {/* Delete Button - Bottom Left without background */}
      {dailyPlan && !isEditing && (
        <TouchableOpacity style={styles.deleteButton} onPress={clearPlan}>
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  // JSON Planner Styles
  jsonContainer: { paddingVertical: 16 },
  jsonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  jsonHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jsonTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  jsonHeaderButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  helpButton: { padding: 4 },
  viewPlanButton: { backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewPlanText: { color: '#fff', fontSize: 13 },
  helpBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 16, gap: 10, borderWidth: 1, borderColor: '#FFEAA730' },
  helpBannerText: { flex: 1, color: '#FFEAA7', fontSize: 13 },
  exampleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1a1a1a', paddingVertical: 10, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#fff30' },
  exampleButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  jsonInput: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1a1a1a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', minHeight: 200, maxHeight: 300 },
  convertButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  convertButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginTop: 8 },
  jsonHint: { color: '#555', fontSize: 12, marginTop: 12, textAlign: 'center' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  helpModalContent: { backgroundColor: '#0a0a0a', borderRadius: 20, width: '90%', maxHeight: '85%', borderWidth: 1, borderColor: '#1a1a1a' },
  helpModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  helpModalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  helpScroll: { padding: 20 },
  helpSection: { marginBottom: 24 },
  helpSectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  helpText: { color: '#999', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  promptBox: { backgroundColor: '#1a1a1a', padding: 14, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#fff' },
  promptText: { color: '#fff', fontSize: 13, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  closeHelpButton: { backgroundColor: '#fff', margin: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  closeHelpText: { color: '#000', fontSize: 16, fontWeight: '700' },
  summaryModalContent: { backgroundColor: '#0a0a0a', borderRadius: 20, width: '90%', maxHeight: '85%', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  summaryModalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  summaryScroll: { padding: 20 },
  donutContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
  statNumber: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12 },
  achievementBox: { backgroundColor: '#1a2a1a', padding: 20, borderRadius: 12, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FFD700', marginVertical: 10 },
  achievementText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  achievementSubtext: { color: '#aaa', fontSize: 12 },
  greatBox: { backgroundColor: '#1a2a1a', padding: 20, borderRadius: 12, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FFEAA7', marginVertical: 10 },
  greatText: { color: '#FFEAA7', fontSize: 18, fontWeight: 'bold' },
  greatSubtext: { color: '#aaa', fontSize: 12 },
  encourageBox: { backgroundColor: '#1a1a2a', padding: 20, borderRadius: 12, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#fff', marginVertical: 10 },
  encourageText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  encourageSubtext: { color: '#aaa', fontSize: 12 },
  closeSummaryButton: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeSummaryText: { color: '#000', fontSize: 16, fontWeight: '700' },
  // Daily Plan Styles
  planContainer: { paddingVertical: 16, paddingBottom: 80 },
  liveTimeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  liveTimeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4444' },
  liveTimeLabel: { color: '#FF4444', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  currentTimeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 12 },
  progressBarContainer: { marginBottom: 16 },
  progressBarBg: { height: 6, backgroundColor: '#1a1a1a', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  progressText: { color: '#888', fontSize: 11, textAlign: 'right', marginTop: 4 },
  planHeader: { marginBottom: 16 },
  planDate: { color: '#888', fontSize: 14 },
  planName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  mottoBox: { flexDirection: 'row', backgroundColor: '#0a0a0a', padding: 16, borderRadius: 12, gap: 10, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#fff' },
  mottoText: { color: '#999', fontSize: 14, flex: 1, lineHeight: 20 },
  sleepRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  sleepItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 },
  sleepLabel: { color: '#888', fontSize: 13 },
  sleepValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  scheduleTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 12 },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  currentDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff' },
  startingSoonDot: { backgroundColor: '#FFEAA7' },
  completedDot: { backgroundColor: '#fff', opacity: 0.6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#1a1a1a', marginVertical: 4 },
  currentLine: { backgroundColor: '#fff' },
  timelineContent: { flex: 1, backgroundColor: '#0a0a0a', borderRadius: 12, padding: 14, marginBottom: 4 },
  currentTimelineContent: { backgroundColor: '#1a2a2a', borderWidth: 1, borderColor: '#fff' },
  startingSoonTimelineContent: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#FFEAA7' },
  completedTimelineContent: { opacity: 0.7 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineTime: { color: '#fff', fontSize: 13, fontWeight: '600' },
  currentText: { color: '#fff', fontWeight: 'bold' },
  startingSoonText: { color: '#FFEAA7' },
  completedText: { color: '#666', textDecorationLine: 'line-through' },
  timeRemainingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 },
  timeRemainingText: { color: '#000', fontSize: 10, fontWeight: '600' },
  startingSoonBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEAA7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 },
  startingSoonBadgeText: { color: '#000', fontSize: 10, fontWeight: '600' },
  timelineEmoji: { fontSize: 18 },
  timelineActivity: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  timelineDetails: { color: '#888', fontSize: 13, lineHeight: 18 },
  currentDetailsText: { color: '#aaa' },
  completedDetailsText: { color: '#555' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  optionChip: { backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  optionText: { color: '#fff', fontSize: 11 },
  categoryChip: { marginTop: 10, alignSelf: 'flex-start' },
  categoryChipText: { color: '#666', fontSize: 11, textTransform: 'capitalize' },
  currentIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fff30' },
  currentIndicatorText: { color: '#fff', fontSize: 11, fontWeight: '500' },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  checklistText: { color: '#fff', fontSize: 14, flex: 1 },
  completedChecklistText: { color: '#555', textDecorationLine: 'line-through' },
  noteItem: { backgroundColor: '#0a0a0a', padding: 12, borderRadius: 10, marginBottom: 8 },
  noteKey: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  noteValue: { color: '#999', fontSize: 13, lineHeight: 18 },
  deleteButton: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
  },
  // Edit Mode Styles
  editContainer: { paddingVertical: 16 },
  editSection: { marginBottom: 24 },
  editSectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  editInput: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 10 },
  editRow: { flexDirection: 'row', gap: 10 },
  editHalfInput: { flex: 1 },
  editChecklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  editChecklistInput: { flex: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1a1a1a', borderRadius: 10, padding: 10, color: '#fff', fontSize: 14 },
  editScheduleCard: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 12 },
  editScheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  editScheduleTime: { flex: 2, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 8, color: '#fff', fontSize: 13 },
  editScheduleEmoji: { width: 60, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 8, color: '#fff', fontSize: 13, textAlign: 'center' },
  editScheduleActivity: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14, marginBottom: 8 },
  editScheduleDetails: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 13, minHeight: 60, marginBottom: 8 },
  editScheduleCategory: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 8, color: '#fff', fontSize: 12 },
  editNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  editNoteKey: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 13 },
  editNoteValue: { flex: 2, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 13 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1a1a1a', paddingVertical: 12, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  editActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 20, marginBottom: 30 },
  cancelEditButton: { flex: 1, backgroundColor: '#1a1a1a', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  cancelEditText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  saveEditButton: { flex: 1, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveEditText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
