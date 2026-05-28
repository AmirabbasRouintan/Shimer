// app/main.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import JSONPlanner from '../../components/JSONPlanner';
import { Activity, Folder, getActivities, getCalendarEvents, getDailyPlan, getFolders, setActiveTimer, subscribe, getSuspendedGoal, getSuspendedActivities, setSuspendedGoal, removeSuspendedActivity, SuspendedGoalData, SuspendedActivityData } from '../activitiesStore';

const store = {};

// Swipeable Event Row Component (unchanged functionality, restyled)
const SwipeableEventRow = ({ event, timeDisplay, onDelete, onPress }: any) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) {
        translateX.setValue(Math.max(gesture.dx, -70));
      } else if (translateX._value < 0) {
        translateX.setValue(Math.min(translateX._value + gesture.dx, 0));
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -30 || (isSwiped && gesture.dx < 0)) {
        Animated.timing(translateX, { toValue: -70, duration: 200, useNativeDriver: true }).start();
        setIsSwiped(true);
      } else {
        Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        setIsSwiped(false);
      }
    },
  });

  const handlePress = () => {
    if (isSwiped) {
      Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      setIsSwiped(false);
    } else {
      onPress?.();
    }
  };

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity style={styles.deleteEventButton} onPress={onDelete} activeOpacity={0.8}>
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text style={styles.deleteEventButtonText}>Delete</Text>
      </TouchableOpacity>
      <Animated.View
        style={[styles.todayEventCard, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.eventCardContent} onPress={handlePress} activeOpacity={0.7}>
          <View style={[styles.eventPill, timeDisplay.isPassed ? styles.eventPillPassed : styles.eventPillUpcoming]}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.eventPillText}>{event.time}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={[styles.eventTimeRemaining, timeDisplay.isPassed ? styles.eventTimePassed : styles.eventTimeUpcoming]}>
              {timeDisplay.text}
            </Text>
            <Text style={styles.eventTitle}>{event.title}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Swipeable Paused Item Row
const SwipeablePauseRow = ({ item, color, label, timeDisplay, onDelete, onPress }: any) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) {
        translateX.setValue(Math.max(gesture.dx, -70));
      } else if (translateX._value < 0) {
        translateX.setValue(Math.min(translateX._value + gesture.dx, 0));
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -30 || (isSwiped && gesture.dx < 0)) {
        Animated.timing(translateX, { toValue: -70, duration: 200, useNativeDriver: true }).start();
        setIsSwiped(true);
      } else {
        Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        setIsSwiped(false);
      }
    },
  });

  const handlePress = () => {
    if (isSwiped) {
      Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      setIsSwiped(false);
    } else {
      onPress?.();
    }
  };

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity style={styles.deleteEventButton} onPress={onDelete} activeOpacity={0.8}>
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text style={styles.deleteEventButtonText}>Delete</Text>
      </TouchableOpacity>
      <Animated.View
        style={[styles.pauseCard, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.pauseCardContent} onPress={handlePress} activeOpacity={0.7}>
          <Ionicons name="pause-circle" size={20} color={color} />
          <Text style={[styles.pauseCardLabel, { color }]}>{label}</Text>
          <Text style={styles.pauseCardTitle} numberOfLines={1}>{item.name || item.title}</Text>
          <Text style={[styles.pauseCardTime, { color }]}>{timeDisplay}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Apple-style Scroll Wheel Picker Component (unchanged)
const WheelPicker = ({ value, onValueChange, min, max, bgColor = '#1a1a1a' }: { value: number; onValueChange: (val: number) => void; min: number; max: number; bgColor?: string }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemHeight = 44;
  const visibleItems = 3;
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const [selectedIndex, setSelectedIndex] = useState(value - min);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemHeight);
    const newIndex = Math.max(0, Math.min(index, items.length - 1));
    if (newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
      onValueChange(items[newIndex]);
    }
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({ y: index * itemHeight, animated: true });
  };

  useEffect(() => {
    const initialIndex = items.findIndex(i => i === value);
    if (initialIndex !== -1 && initialIndex !== selectedIndex) {
      setSelectedIndex(initialIndex);
      scrollToIndex(initialIndex);
    }
  }, [value]);

  const fadeColor = `rgba(${parseInt(bgColor.slice(1,3), 16)},${parseInt(bgColor.slice(3,5), 16)},${parseInt(bgColor.slice(5,7), 16)},0.95)`;

  return (
    <View style={styles.wheelPickerContainer}>
      <View style={styles.wheelPickerWrapper}>
        <View style={[styles.wheelPickerFadeTop, { backgroundColor: fadeColor }]} pointerEvents="none" />
        <View style={[styles.wheelPickerFadeBottom, { backgroundColor: fadeColor }]} pointerEvents="none" />
        <View style={styles.wheelPickerSelectedIndicator} />
        <ScrollView
          ref={scrollViewRef}
          style={styles.wheelPickerScroll}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll}
          onScrollEndDrag={handleScroll}
          contentContainerStyle={{ paddingVertical: ((visibleItems - 1) / 2) * itemHeight }}
        >
          {items.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.wheelPickerItem, { height: itemHeight }]}
              onPress={() => {
                setSelectedIndex(idx);
                onValueChange(item);
                scrollToIndex(idx);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.wheelPickerItemText, selectedIndex === idx && styles.wheelPickerItemTextSelected]}>
                {item.toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default function MainScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [todayEvents, setTodayEvents] = useState<{ title: string; time: string }[]>([]);
  const [lastMidnightCheck, setLastMidnightCheck] = useState<Date | null>(null);

  // New Task Modal States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [taskText, setTaskText] = useState('');
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Event Timer Modal States
  const [showEventTimerModal, setShowEventTimerModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ title: string; time: string } | null>(null);
  const [eventSelectedActivity, setEventSelectedActivity] = useState<Activity | null>(null);
  const [eventTimerHours, setEventTimerHours] = useState(0);
  const [eventTimerMinutes, setEventTimerMinutes] = useState(0);
  const [showEventActivityPicker, setShowEventActivityPicker] = useState(false);

  // JSON Planner Modal States
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [todayPlan, setTodayPlan] = useState<any>(null);
  const [todayDate, setTodayDate] = useState<Date>(new Date());

  // Suspended / Paused Items
  const [suspendedGoal, setSuspendedGoalState] = useState<SuspendedGoalData | null>(getSuspendedGoal());
  const [suspendedActivities, setSuspendedActivitiesState] = useState<SuspendedActivityData[]>(getSuspendedActivities());

  // Ref to always have the latest activeTab value for the subscribe callback
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const presets = [
    { label: "5m", mins: 5 },
    { label: "10m", mins: 10 },
    { label: "15m", mins: 15 },
    { label: "25m", mins: 25 },
    { label: "30m", mins: 30 },
    { label: "45m", mins: 45 },
    { label: "1h", mins: 60 },
    { label: "1.5h", mins: 90 },
    { label: "2h", mins: 120 },
  ];

  const totalTimeDisplay = () => {
    const total = timerHours * 3600 + timerMinutes * 60;
    if (total === 0) return "0:00";
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, "0")}`;
    return `${mins}:00`;
  };

  // Load activities
  useEffect(() => {
    setActivities(getActivities());
    const unsubscribe = subscribe(() => setActivities(getActivities()));
    return unsubscribe;
  }, []);

  const getTodayDateKey = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const checkTodayPlan = () => {
    const dailyPlans = getDailyPlan() || {};
    const dateKey = getTodayDateKey();
    const plan = dailyPlans[dateKey] || null;
    setTodayPlan(plan);
    return plan;
  };

  useEffect(() => { checkTodayPlan(); }, []);

  const refreshTodayPlan = () => { checkTodayPlan(); };

  const getTimeDisplay = (eventTime: string): { text: string; isPassed: boolean } => {
    const now = new Date();
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventDate = new Date();
    eventDate.setHours(hours, minutes, 0, 0);
    const diffMs = eventDate.getTime() - now.getTime();
    if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return { text: `${diffMins}m`, isPassed: false };
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      if (remainingMins > 0) return { text: `${diffHours}h ${remainingMins}m`, isPassed: false };
      return { text: `${diffHours}h`, isPassed: false };
    } else {
      const passedMs = Math.abs(diffMs);
      const passedMins = Math.floor(passedMs / 60000);
      if (passedMins < 60) return { text: `${passedMins}m`, isPassed: true };
      const passedHours = Math.floor(passedMins / 60);
      const remainingMins = passedMins % 60;
      if (remainingMins > 0) return { text: `${passedHours}h ${remainingMins}m`, isPassed: true };
      return { text: `${passedHours}h`, isPassed: true };
    }
  };

  const handleEventPress = (event: { title: string; time: string }) => {
    setSelectedEvent(event);
    setEventSelectedActivity(null);
    setEventTimerHours(0);
    setEventTimerMinutes(0);
    setShowEventTimerModal(true);
  };

  const startEventTimer = () => {
    if (!eventSelectedActivity) {
      Alert.alert('Required', 'Please select an activity.');
      return;
    }
    const totalMinutes = eventTimerHours * 60 + eventTimerMinutes;
    if (totalMinutes === 0) {
      Alert.alert('Required', 'Please set a timer duration.');
      return;
    }
    setActiveTimer({
      activityName: eventSelectedActivity.name,
      activityColor: eventSelectedActivity.color,
      durationSeconds: totalMinutes * 60,
      startTime: Date.now(),
    });
    setShowEventTimerModal(false);
    setSelectedEvent(null);
    setEventSelectedActivity(null);
    router.push('/');
  };

  const handlePlannerSave = (plan: any) => {
    const dateKey = getTodayDateKey();
    const allPlans = getDailyPlan() || {};
    if (plan === null) delete allPlans[dateKey];
    else allPlans[dateKey] = plan;
    const { setDailyPlan } = require('../activitiesStore');
    setDailyPlan(allPlans);
    refreshTodayPlan();
    setShowPlannerModal(false);
  };

  const checkAndMoveTomorrowTasks = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour === 0 && currentMinute === 0) {
      const today = new Date();
      if (lastMidnightCheck && lastMidnightCheck.toDateString() === today.toDateString()) return;
      const currentFolders = getFolders();
      const todayFolder = currentFolders.find(f => f.name === 'Today');
      const tomorrowFolder = currentFolders.find(f => f.name === 'Tomorrow');
      if (tomorrowFolder && tomorrowFolder.items.length > 0) {
        const tomorrowTasks = tomorrowFolder.items;
        if (todayFolder) {
          const updatedFolders = currentFolders.map(f => {
            if (f.name === 'Today') return { ...f, items: [...f.items, ...tomorrowTasks] };
            if (f.name === 'Tomorrow') return { ...f, items: [] };
            return f;
          });
          setFolders(updatedFolders);
          Alert.alert('New Day Started', `${tomorrowTasks.length} task(s) from Tomorrow have been moved to Today.`);
        }
      }
      setLastMidnightCheck(now);
    }
  };

  useEffect(() => {
    checkAndMoveTomorrowTasks();
    const interval = setInterval(checkAndMoveTomorrowTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayEvents = () => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const calendarEvents = getCalendarEvents();
    const todaysEvents = calendarEvents[dateKey] || [];
    setTodayEvents([...todaysEvents]);
    refreshTodayPlan();
  };

  const deleteEvent = (index: number) => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const calendarEvents = getCalendarEvents();
    const events = calendarEvents[dateKey] || [];
    if (events[index]) {
      events.splice(index, 1);
      if (events.length === 0) delete calendarEvents[dateKey];
      else calendarEvents[dateKey] = events;
      const { setCalendarEvents } = require('../activitiesStore');
      setCalendarEvents(calendarEvents);
      loadTodayEvents();
    }
  };

  const handleResumePausedActivity = (item: SuspendedActivityData) => {
    setActiveTimer({
      activityName: item.name,
      activityColor: item.color,
      durationSeconds: item.remainingSeconds,
      userSelectedDuration: item.userDuration,
    });
    router.push('/');
  };

  const handleResumePausedGoal = (item: SuspendedGoalData) => {
    setActiveTimer({
      activityName: item.title,
      activityColor: item.color,
      durationSeconds: item.remainingSeconds,
      userSelectedDuration: item.userDuration,
    });
    router.push('/');
  };

  const handleDeletePausedGoal = () => {
    setSuspendedGoal(null);
  };

  const handleDeletePausedActivity = (index: number) => {
    removeSuspendedActivity(index);
  };

  // Load folders and subscribe to changes – FIXED: no more accidental tab reset
  useEffect(() => {
    const loadedFolders = getFolders();
    setFolders(loadedFolders);
    if (loadedFolders.length > 0 && !activeTab) {
      setActiveTab(loadedFolders[0].name);
    }

    const unsubscribe = subscribe(() => {
      const updatedFolders = getFolders();
      setFolders(updatedFolders);

      // Only reset active tab if the currently selected tab no longer exists
      const stillExists = updatedFolders.some(f => f.name === activeTabRef.current);
      if (!stillExists && updatedFolders.length > 0) {
        setActiveTab(updatedFolders[0].name);
      }
      loadTodayEvents();
      setSuspendedGoalState(getSuspendedGoal());
      setSuspendedActivitiesState(getSuspendedActivities());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const saved = store[`tasks_${activeTab}`];
    if (saved) setTasks(JSON.parse(saved));
    else setTasks([]);
    if (activeTab === 'Today') loadTodayEvents();
    else setTodayEvents([]);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Today') {
      loadTodayEvents();
      const interval = setInterval(loadTodayEvents, 60000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height * 0.85)
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

  const openTaskModal = () => {
    setSelectedActivity(null);
    setTaskText('');
    setTimerHours(0);
    setTimerMinutes(0);
    setShowTaskModal(true);
  };

  const addTask = () => {
    if (!taskText.trim()) {
      Alert.alert('Required', 'Please enter a task description.');
      return;
    }
    if (!selectedActivity) {
      Alert.alert('Required', 'Please select an activity.');
      return;
    }
    const totalMinutes = timerHours * 60 + timerMinutes;
    const taskWithDetails = {
      id: Date.now().toString(),
      text: taskText.trim(),
      activity: selectedActivity.name,
      activityColor: selectedActivity.color,
      activityIcon: selectedActivity.icon,
      duration: totalMinutes > 0 ? `${timerHours}h ${timerMinutes}m` : 'No timer',
      durationMinutes: totalMinutes,
    };
    const newTasks = [...tasks, taskWithDetails];
    setTasks(newTasks);
    store[`tasks_${activeTab}`] = JSON.stringify(newTasks);
    setShowTaskModal(false);
    setTaskText('');
    setSelectedActivity(null);
    setTimerHours(0);
    setTimerMinutes(0);
  };

  const formatPauseTime = (seconds: number): string => {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTaskPress = (task) => {
    if (task.durationMinutes > 0) {
      setActiveTimer({
        activityName: task.activity,
        activityColor: task.activityColor,
        durationSeconds: task.durationMinutes * 60,
        startTime: Date.now(),
      });
    }
    router.push('/');
  };

  const removeTask = (index, event) => {
    event.stopPropagation();
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    store[`tasks_${activeTab}`] = JSON.stringify(newTasks);
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar - iOS style with underline indicator */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {folders.map((folder, index) => (
            <TouchableOpacity key={index} style={styles.tabButton} onPress={() => setActiveTab(folder.name)}>
              <Text style={[styles.tabText, activeTab === folder.name && styles.activeTabText]}>{folder.name}</Text>
              {activeTab === folder.name && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.calendarButton} onPress={() => router.push('/calendar')}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.taskList} keyboardShouldPersistTaps="handled">
        {/* Today's Events Section */}
        {activeTab === 'Today' && todayEvents.length > 0 && (
          <View style={styles.todayEventsSection}>
            {todayEvents.map((event, index) => {
              const timeDisplay = getTimeDisplay(event.time);
              return (
                <SwipeableEventRow
                  key={index}
                  event={event}
                  timeDisplay={timeDisplay}
                  onDelete={() => deleteEvent(index)}
                  onPress={() => handleEventPress(event)}
                />
              );
            })}
          </View>
        )}

        {/* Tasks List */}
        {tasks.map((task, index) => (
          <TouchableOpacity
            key={index}
            style={styles.taskItem}
            onPress={() => handleTaskPress(task)}
            activeOpacity={0.6}
          >
            <View style={[styles.taskIndicator, { backgroundColor: task.activityColor }]} />
            <View style={styles.taskContent}>
              <Text style={styles.taskText}>{task.text}</Text>
              <View style={styles.taskMeta}>
                <Ionicons name={task.activityIcon || "folder-outline"} size={12} color={task.activityColor} />
                <Text style={[styles.taskActivity, { color: task.activityColor }]}>{task.activity}</Text>
                {task.durationMinutes > 0 && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <Ionicons name="timer-outline" size={10} color="#555" />
                    <Text style={styles.taskDuration}>{task.duration}</Text>
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={(e) => removeTask(index, e)} style={styles.removeTaskBtn}>
              <Ionicons name="close" size={18} color="#555" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {tasks.length === 0 && (activeTab !== 'Today' || todayEvents.length === 0) && (
          <View style={styles.emptyTasks}>
            <Ionicons name="list-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add a task</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Paused */}
      {(suspendedGoal || suspendedActivities.length > 0) && (
        <View style={styles.pausedSectionBottom}>
          {suspendedGoal && (
            <SwipeablePauseRow
              item={suspendedGoal}
              color={suspendedGoal.color}
              label="Goal"
              timeDisplay={formatPauseTime(suspendedGoal.remainingSeconds)}
              onDelete={handleDeletePausedGoal}
              onPress={() => handleResumePausedGoal(suspendedGoal)}
            />
          )}
          {suspendedActivities.map((item, idx) => (
            <SwipeablePauseRow
              key={idx}
              item={item}
              color={item.color}
              label="Activity"
              timeDisplay={formatPauseTime(item.remainingSeconds)}
              onDelete={() => handleDeletePausedActivity(idx)}
              onPress={() => handleResumePausedActivity(item)}
            />
          ))}
        </View>
      )}

      {/* JSON Planner Button */}
      {activeTab === 'Today' && todayPlan && (
        <View style={styles.plannerButtonContainer}>
          <TouchableOpacity style={styles.plannerButton} onPress={() => setShowPlannerModal(true)}>
            <Ionicons name="document-text-outline" size={22} color="#000" />
            <Text style={styles.plannerButtonText}>VIEW TODAY'S PLAN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar - iOS style */}
      <View style={{ paddingBottom: keyboardHeight }}>
        <View style={styles.inputRow}>
          <View style={styles.inputLeft}>
            <Ionicons name="timer-outline" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Task"
              placeholderTextColor="#555"
              value={taskInput}
              onChangeText={setTaskInput}
              onFocus={openTaskModal}
            />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={openTaskModal}>
            <Text style={styles.saveButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* New Task Modal - Apple Style (matches things.tsx) */}
      <Modal visible={showTaskModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleTimerModal}>
            <View style={styles.appleTimerHeader}>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Text style={styles.appleTimerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleTimerTitle}>New Task</Text>
              <TouchableOpacity onPress={addTask}>
                <Text style={styles.appleTimerStart}>Save</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.appleTimerActivityRow} onPress={() => setShowActivityPicker(true)}>
              {selectedActivity ? (
                <>
                  <View style={[styles.appleActivityDot, { backgroundColor: selectedActivity.color }]} />
                  <Ionicons name={selectedActivity.icon as any} size={20} color={selectedActivity.color} />
                  <Text style={styles.appleActivityName}>{selectedActivity.name}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#888" />
                  <Text style={{ color: '#888', fontSize: 17 }}>Select an activity</Text>
                </>
              )}
              <Ionicons name="chevron-forward" size={18} color="#555" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TextInput
              style={styles.appleTaskInput}
              placeholder="What needs to be done?"
              placeholderTextColor="#555"
              value={taskText}
              onChangeText={setTaskText}
              autoFocus
            />

            <View style={styles.appleTimeDisplay}>
              <Text style={styles.appleTimeDisplayText}>{totalTimeDisplay()}</Text>
            </View>

            <View style={styles.appleDivider} />

            <View style={styles.appleWheelContainer}>
              <WheelPicker
                value={timerHours}
                onValueChange={setTimerHours}
                min={0}
                max={23}
                bgColor="#0f0f11"
              />
              <Text style={styles.wheelPickerColon}>:</Text>
              <WheelPicker
                value={timerMinutes}
                onValueChange={setTimerMinutes}
                min={0}
                max={59}
                bgColor="#0f0f11"
              />
            </View>

            <View style={styles.appleDivider} />

            <View style={styles.applePresetsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.applePresetsContainer}>
                {presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.mins}
                    style={[
                      styles.applePresetButton,
                      timerHours === Math.floor(preset.mins / 60) && timerMinutes === preset.mins % 60 && styles.applePresetButtonSelected,
                    ]}
                    onPress={() => {
                      setTimerHours(Math.floor(preset.mins / 60));
                      setTimerMinutes(preset.mins % 60);
                    }}
                  >
                    <Text style={[
                      styles.applePresetButtonText,
                      timerHours === Math.floor(preset.mins / 60) && timerMinutes === preset.mins % 60 && styles.applePresetButtonTextSelected,
                    ]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Activity Picker Modal */}
      <Modal visible={showActivityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleTimerModal}>
            <View style={styles.appleTimerHeader}>
              <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                <Text style={styles.appleTimerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleTimerTitle}>Select Activity</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.activityList}>
              {activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => { setSelectedActivity(activity); setShowActivityPicker(false); }}
                >
                  <View style={[styles.activityColorDot, { backgroundColor: activity.color }]} />
                  <Ionicons name={activity.icon as any} size={22} color={activity.color} />
                  <Text style={styles.activityNameText}>{activity.name}</Text>
                  {selectedActivity?.id === activity.id && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Event Timer Modal - Apple Style (matches things.tsx) */}
      <Modal visible={showEventTimerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleTimerModal}>
            <View style={styles.appleTimerHeader}>
              <TouchableOpacity onPress={() => setShowEventTimerModal(false)}>
                <Text style={styles.appleTimerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleTimerTitle}>Start Timer</Text>
              <TouchableOpacity onPress={startEventTimer}>
                <Text style={styles.appleTimerStart}>Start</Text>
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <View style={styles.appleTimerEventInfo}>
                <Ionicons name="calendar-outline" size={16} color="#2196F3" />
                <Text style={styles.appleTimerEventText}>{selectedEvent.title} at {selectedEvent.time}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.appleTimerActivityRow} onPress={() => setShowEventActivityPicker(true)}>
              {eventSelectedActivity ? (
                <>
                  <View style={[styles.appleActivityDot, { backgroundColor: eventSelectedActivity.color }]} />
                  <Ionicons name={eventSelectedActivity.icon as any} size={20} color={eventSelectedActivity.color} />
                  <Text style={styles.appleActivityName}>{eventSelectedActivity.name}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#888" />
                  <Text style={{ color: '#888', fontSize: 17 }}>Select an activity</Text>
                </>
              )}
              <Ionicons name="chevron-forward" size={18} color="#555" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <View style={styles.appleTimeDisplay}>
              <Text style={styles.appleTimeDisplayText}>
                {eventTimerHours === 0 && eventTimerMinutes === 0
                  ? '0:00'
                  : `${eventTimerHours}:${eventTimerMinutes.toString().padStart(2, '0')}`}
              </Text>
            </View>

            <View style={styles.appleDivider} />

            <View style={styles.appleWheelContainer}>
              <WheelPicker
                value={eventTimerHours}
                onValueChange={setEventTimerHours}
                min={0}
                max={23}
                bgColor="#0f0f11"
              />
              <Text style={styles.wheelPickerColon}>:</Text>
              <WheelPicker
                value={eventTimerMinutes}
                onValueChange={setEventTimerMinutes}
                min={0}
                max={59}
                bgColor="#0f0f11"
              />
            </View>

            <View style={styles.appleDivider} />

            <View style={styles.applePresetsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.applePresetsContainer}>
                {presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.mins}
                    style={[
                      styles.applePresetButton,
                      eventTimerHours === Math.floor(preset.mins / 60) && eventTimerMinutes === preset.mins % 60 && styles.applePresetButtonSelected,
                    ]}
                    onPress={() => {
                      setEventTimerHours(Math.floor(preset.mins / 60));
                      setEventTimerMinutes(preset.mins % 60);
                    }}
                  >
                    <Text style={[
                      styles.applePresetButtonText,
                      eventTimerHours === Math.floor(preset.mins / 60) && eventTimerMinutes === preset.mins % 60 && styles.applePresetButtonTextSelected,
                    ]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEventActivityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleTimerModal}>
            <View style={styles.appleTimerHeader}>
              <TouchableOpacity onPress={() => setShowEventActivityPicker(false)}>
                <Text style={styles.appleTimerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleTimerTitle}>Select Activity</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.activityList}>
              {activities.map((activity) => (
                <TouchableOpacity key={activity.id} style={styles.activityItem} onPress={() => { setEventSelectedActivity(activity); setShowEventActivityPicker(false); }}>
                  <View style={[styles.activityColorDot, { backgroundColor: activity.color }]} />
                  <Ionicons name={activity.icon as any} size={22} color={activity.color} />
                  <Text style={styles.activityNameText}>{activity.name}</Text>
                  {eventSelectedActivity?.id === activity.id && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showPlannerModal} animationType="slide" onRequestClose={() => setShowPlannerModal(false)}>
        <View style={styles.plannerModalContainer}>
          <View style={styles.plannerModalHeader}>
            <TouchableOpacity style={styles.plannerModalCloseButton} onPress={() => setShowPlannerModal(false)}>
              <Text style={styles.plannerModalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.plannerModalTitle}>{todayDate.toLocaleDateString('default', { month: 'long' })} {todayDate.getDate()}, {todayDate.getFullYear()}</Text>
            <View style={{ width: 50 }} />
          </View>
          <JSONPlanner selectedDate={todayDate} initialPlan={todayPlan} onSave={handlePlannerSave} onClose={() => setShowPlannerModal(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  // Tab Bar - iOS style
  tabBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  tabScroll: { paddingRight: 16, gap: 8 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 4, marginRight: 16, position: 'relative' },
  tabText: { color: '#888', fontSize: 17, fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: '600' },
  activeTabIndicator: { position: 'absolute', bottom: 0, left: 4, right: 4, height: 2, backgroundColor: '#fff', borderRadius: 1 },
  calendarButton: { padding: 8, backgroundColor: '#1a1a1a', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  taskList: { flex: 1, paddingHorizontal: 16 },
  todayEventsSection: { marginBottom: 24 },
  swipeContainer: { marginBottom: 12, position: 'relative' },
  deleteEventButton: { position: 'absolute', right: 2, top: 2, bottom: 2, width: 60, backgroundColor: '#FF453A', justifyContent: 'center', alignItems: 'center', borderRadius: 8, opacity: 0.95 },
  deleteEventButtonText: { color: '#fff', fontSize: 11, marginTop: 2, fontWeight: '600' },
  todayEventCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 0, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a', backgroundColor: '#000' },
  eventCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  eventPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, minWidth: 70, justifyContent: 'center' },
  eventPillUpcoming: { backgroundColor: '#2196F3' },
  eventPillPassed: { backgroundColor: '#F44336' },
  eventPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  eventInfo: { flex: 1 },
  eventTimeRemaining: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  eventTimeUpcoming: { color: '#2196F3' },
  eventTimePassed: { color: '#F44336' },
  eventTitle: { color: '#fff', fontSize: 15, fontWeight: '500' },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  taskIndicator: { width: 3, height: 28, borderRadius: 2, marginRight: 14 },
  taskContent: { flex: 1 },
  taskText: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskActivity: { fontSize: 12, fontWeight: '500' },
  metaDot: { color: '#444', fontSize: 12 },
  taskDuration: { color: '#555', fontSize: 11 },
  removeTaskBtn: { padding: 8 },
  inputRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  inputLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12 },
  saveButton: { backgroundColor: '#fff', width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#000', fontSize: 28, fontWeight: '600', marginTop: -4 },
  emptyTasks: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#888', fontSize: 18, marginTop: 16, fontWeight: '500' },
  emptySubtext: { color: '#555', fontSize: 14, marginTop: 8 },
  plannerButtonContainer: { paddingHorizontal: 16, paddingVertical: 12, borderTopColor: '#1a1a1a', backgroundColor: '#000' },
  plannerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 12, borderRadius: 10 },
  plannerButtonText: { color: '#000', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  appleTaskModal: { backgroundColor: '#1a1a1a', borderRadius: 14, width: '90%', maxWidth: 400, overflow: 'hidden' },
  appleTaskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#2a2a2a' },
  appleTaskCancel: { color: '#888', fontSize: 17, fontWeight: '500' },
  appleTaskTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  appleTaskSave: { color: '#fff', fontSize: 17, fontWeight: '600' },
  appleActivityContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#1c1c1e', marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 10 },
  appleActivityDot: { width: 10, height: 10, borderRadius: 5 },
  appleActivityName: { color: '#fff', fontSize: 17, fontWeight: '500' },
  appleActivityPlaceholder: { color: '#888', fontSize: 17 },
  appleTaskInput: { color: '#fff', fontSize: 16, backgroundColor: '#0a0a0a', marginHorizontal: 16, marginBottom: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  appleTimeDisplay: { alignItems: 'center', paddingVertical: 20 },
  appleTimeDisplayText: { color: '#fff', fontSize: 52, fontWeight: '700', letterSpacing: 1 },
  appleDivider: { height: 0.5, backgroundColor: '#38383a', marginHorizontal: 16 },
  appleWheelContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  wheelPickerContainer: { flex: 1, alignItems: 'center' },
  wheelPickerWrapper: { height: 132, width: '90%', position: 'relative', overflow: 'hidden' },
  wheelPickerScroll: { height: 132, width: '100%' },
  wheelPickerFadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 45, backgroundColor: 'rgba(26,26,26,0.95)', zIndex: 10 },
  wheelPickerFadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 45, backgroundColor: 'rgba(26,26,26,0.95)', zIndex: 10 },
  wheelPickerSelectedIndicator: { position: 'absolute', top: 44, left: 0, right: 0, height: 44, borderRadius: 10, backgroundColor: 'rgba(100,100,110,0.1)', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', zIndex: 5 },
  wheelPickerItem: { justifyContent: 'center', alignItems: 'center' },
  wheelPickerItemText: { color: '#555', fontSize: 20, fontWeight: '500' },
  wheelPickerItemTextSelected: { color: '#fff', fontSize: 24, fontWeight: '700' },
  wheelPickerColon: { color: '#fff', fontSize: 32, fontWeight: '300', marginBottom: 16 },
  applePresetsWrapper: { paddingHorizontal: 16, paddingVertical: 16 },
  applePresetsContainer: { gap: 8, paddingHorizontal: 4 },
  applePresetButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1c1c1e' },
  applePresetButtonSelected: { backgroundColor: '#007aff' },
  applePresetButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  applePresetButtonTextSelected: { color: '#fff', fontWeight: '600' },
  // Apple Timer Modal Styles (matches things.tsx)
  appleTimerModal: { backgroundColor: '#0f0f11', borderRadius: 14, padding: 0, width: '90%', maxWidth: 400, overflow: 'hidden' },
  appleTimerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#38383a' },
  appleTimerCancel: { color: '#ff3b30', fontSize: 17, fontWeight: '500' },
  appleTimerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  appleTimerStart: { color: '#007aff', fontSize: 17, fontWeight: '600' },
  appleTimerEventInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#1c1c1e', marginHorizontal: 16, marginTop: 12, borderRadius: 10 },
  appleTimerEventText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  appleTimerActivityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#1c1c1e', marginHorizontal: 16, marginTop: 8, marginBottom: 8, borderRadius: 10 },
  activityColorDot: { width: 12, height: 12, borderRadius: 6 },
  activityList: { maxHeight: 400 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, backgroundColor: '#0a0a0a' },
  activityNameText: { color: '#fff', fontSize: 16, flex: 1 },
  plannerModalContainer: { flex: 1, backgroundColor: '#000' },
  plannerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#000' },
  plannerModalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  plannerModalCloseButton: { backgroundColor: '#FF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  plannerModalClose: { color: '#fff', fontSize: 16, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  sectionHeaderText: { color: '#888', fontSize: 15, fontWeight: '600' },
  pauseCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 0, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a', backgroundColor: '#000' },
  pauseCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pauseCardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  pauseCardTitle: { color: '#fff', fontSize: 14, fontWeight: '500', flex: 1 },
  pauseCardTime: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  pausedSection: { marginTop: 16, marginBottom: 8 },
  pausedSectionBottom: { paddingHorizontal: 20, paddingVertical: 6 },
});
