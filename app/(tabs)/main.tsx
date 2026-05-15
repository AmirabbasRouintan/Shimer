// app/main.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getFolders, subscribe, Folder, getCalendarEvents, setFolders, getActivities, Activity, setActiveTimer, getDailyPlan } from '../activitiesStore';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Switch, Platform, Keyboard, Alert, Modal, Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import JSONPlanner from '../../components/JSONPlanner';

const store = {};

// Swipeable Event Row Component
const SwipeableEventRow = ({ event, timeDisplay, onDelete, onPress }: any) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => {
      return Math.abs(gesture.dx) > 5;
    },
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) {
        translateX.setValue(Math.max(gesture.dx, -70));
      } else if (translateX._value < 0) {
        translateX.setValue(Math.min(translateX._value + gesture.dx, 0));
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -30 || (isSwiped && gesture.dx < 0)) {
        Animated.timing(translateX, {
          toValue: -70,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setIsSwiped(true);
      } else {
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setIsSwiped(false);
      }
    },
  });

  const handlePress = () => {
    if (isSwiped) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
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
        style={[
          styles.todayEventCard,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.eventCardContent}
          onPress={handlePress}
          activeOpacity={0.7}
        >
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

export default function MainScreen() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [showOnHome, setShowOnHome] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [todayEvents, setTodayEvents] = useState<{ title: string; time: string }[]>([]);
  const [lastMidnightCheck, setLastMidnightCheck] = useState<Date | null>(null);
  const [eventsKey, setEventsKey] = useState(0);

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

  // Load activities
  useEffect(() => {
    setActivities(getActivities());
    const unsubscribe = subscribe(() => {
      setActivities(getActivities());
    });
    return unsubscribe;
  }, []);

  // Helper function to get today's date key
  const getTodayDateKey = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Check if today has a JSON plan
  const checkTodayPlan = () => {
    const dailyPlans = getDailyPlan() || {};
    const dateKey = getTodayDateKey();
    const plan = dailyPlans[dateKey] || null;
    setTodayPlan(plan);
    return plan;
  };

  // Load today's plan when component mounts and when events change
  useEffect(() => {
    checkTodayPlan();
  }, []);

  // Refresh today's plan when events are updated
  const refreshTodayPlan = () => {
    checkTodayPlan();
  };

  // Helper function to calculate time remaining or time passed for an event
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

  // Handle event click - open timer setup modal
  const handleEventPress = (event: { title: string; time: string }) => {
    setSelectedEvent(event);
    setEventSelectedActivity(null);
    setEventTimerHours(0);
    setEventTimerMinutes(0);
    setShowEventTimerModal(true);
  };

  // Start timer from event
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

  // Handle planner save
  const handlePlannerSave = (plan: any) => {
    const dateKey = getTodayDateKey();
    const allPlans = getDailyPlan() || {};
    if (plan === null) {
      delete allPlans[dateKey];
    } else {
      allPlans[dateKey] = plan;
    }
    const { setDailyPlan } = require('../activitiesStore');
    setDailyPlan(allPlans);
    refreshTodayPlan();
    setShowPlannerModal(false);
  };

  // Check and move tomorrow's tasks to today after midnight
  const checkAndMoveTomorrowTasks = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour === 0 && currentMinute === 0) {
      const today = new Date();
      if (lastMidnightCheck && lastMidnightCheck.toDateString() === today.toDateString()) {
        return;
      }

      const currentFolders = getFolders();
      const todayFolder = currentFolders.find(f => f.name === 'Today');
      const tomorrowFolder = currentFolders.find(f => f.name === 'Tomorrow');

      if (tomorrowFolder && tomorrowFolder.items.length > 0) {
        const tomorrowTasks = tomorrowFolder.items;

        if (todayFolder) {
          const updatedFolders = currentFolders.map(f => {
            if (f.name === 'Today') {
              return { ...f, items: [...f.items, ...tomorrowTasks] };
            }
            if (f.name === 'Tomorrow') {
              return { ...f, items: [] };
            }
            return f;
          });

          setFolders(updatedFolders);
          Alert.alert(
            'New Day Started',
            `${tomorrowTasks.length} task(s) from Tomorrow have been moved to Today.`,
            [{ text: 'OK' }]
          );
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

  // Load today's events from calendar using activitiesStore
  const loadTodayEvents = () => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const calendarEvents = getCalendarEvents();
    const todaysEvents = calendarEvents[dateKey] || [];
    setTodayEvents([...todaysEvents]);
    setEventsKey(prev => prev + 1);
    // Also refresh today's plan when events change
    refreshTodayPlan();
  };

  const deleteEvent = (index: number) => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const calendarEvents = getCalendarEvents();
    const events = calendarEvents[dateKey] || [];

    if (events[index]) {
      events.splice(index, 1);
      if (events.length === 0) {
        delete calendarEvents[dateKey];
      } else {
        calendarEvents[dateKey] = events;
      }

      const { setCalendarEvents } = require('../activitiesStore');
      setCalendarEvents(calendarEvents);
      loadTodayEvents();
    }
  };

  // Load folders from store
  useEffect(() => {
    const loadedFolders = getFolders();
    setFolders(loadedFolders);
    if (loadedFolders.length > 0 && !activeTab) {
      setActiveTab(loadedFolders[0].name);
    }

    const unsubscribe = subscribe(() => {
      const updatedFolders = getFolders();
      setFolders(updatedFolders);
      if (updatedFolders.length > 0 && !activeTab) {
        setActiveTab(updatedFolders[0].name);
      }
      loadTodayEvents();
    });
    return unsubscribe;
  }, []);

  // Load tasks for selected tab
  useEffect(() => {
    const saved = store[`tasks_${activeTab}`];
    if (saved) setTasks(JSON.parse(saved));
    else setTasks([]);

    if (activeTab === 'Today') {
      loadTodayEvents();
    } else {
      setTodayEvents([]);
    }
  }, [activeTab]);

  // Refresh events periodically only for Today tab
  useEffect(() => {
    if (activeTab === 'Today') {
      loadTodayEvents();
      const interval = setInterval(loadTodayEvents, 60000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Keyboard handling
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

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <View style={styles.tabContainer}>
          {folders.map((folder, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tab, activeTab === folder.name && styles.activeTab]}
              onPress={() => setActiveTab(folder.name)}
            >
              <Text style={[styles.tabText, activeTab === folder.name && styles.activeTabText]}>
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={() => router.push('/calendar')}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.taskList} keyboardShouldPersistTaps="handled">
        {/* Today's Events Section - Only show on Today tab */}
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

        {/* Tasks List - Clean minimal style */}
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

      {/* JSON Planner Button - Only show on Today tab when there's a plan */}
      {activeTab === 'Today' && todayPlan && (
        <View style={styles.plannerButtonContainer}>
          <TouchableOpacity
            style={styles.plannerButton}
            onPress={() => setShowPlannerModal(true)}
          >
            <Ionicons name="document-text-outline" size={22} color="#000" />
            <Text style={styles.plannerButtonText}>VIEW TODAY'S PLAN</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* New Task Modal */}
      <Modal visible={showTaskModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity onPress={addTask}>
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Activity</Text>
            <TouchableOpacity
              style={styles.activitySelector}
              onPress={() => setShowActivityPicker(true)}
            >
              {selectedActivity ? (
                <View style={styles.selectedActivityRow}>
                  <View style={[styles.activityColorDot, { backgroundColor: selectedActivity.color }]} />
                  <Ionicons name={selectedActivity.icon as any} size={20} color={selectedActivity.color} />
                  <Text style={styles.selectedActivityText}>{selectedActivity.name}</Text>
                </View>
              ) : (
                <View style={styles.selectedActivityRow}>
                  <Ionicons name="add-circle-outline" size={20} color="#888" />
                  <Text style={styles.selectActivityText}>Select an activity</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Task Description</Text>
            <TextInput
              style={styles.taskDescriptionInput}
              placeholder="What needs to be done?"
              placeholderTextColor="#555"
              value={taskText}
              onChangeText={setTaskText}
              autoFocus
            />

            <Text style={styles.modalLabel}>Timer Duration (Optional)</Text>
            <View style={styles.timerPickerRow}>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Hours</Text>
                <View style={styles.pickerScroller}>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerScrollContent}>
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[styles.pickerItem, timerHours === hour && styles.pickerItemSelected]}
                        onPress={() => setTimerHours(hour)}
                      >
                        <Text style={[styles.pickerItemText, timerHours === hour && styles.pickerItemTextSelected]}>
                          {formatNumber(hour)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.timerSeparator}>:</Text>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Minutes</Text>
                <View style={styles.pickerScroller}>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerScrollContent}>
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[styles.pickerItem, timerMinutes === minute && styles.pickerItemSelected]}
                        onPress={() => setTimerMinutes(minute)}
                      >
                        <Text style={[styles.pickerItemText, timerMinutes === minute && styles.pickerItemTextSelected]}>
                          {formatNumber(minute)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Activity Picker Modal */}
      <Modal visible={showActivityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.activityPickerModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Activity</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.activityList}>
              {activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => {
                    setSelectedActivity(activity);
                    setShowActivityPicker(false);
                  }}
                >
                  <View style={[styles.activityColorDot, { backgroundColor: activity.color }]} />
                  <Ionicons name={activity.icon as any} size={22} color={activity.color} />
                  <Text style={styles.activityNameText}>{activity.name}</Text>
                  {selectedActivity?.id === activity.id && (
                    <Ionicons name="checkmark-circle" size={22} color="#4ECDC4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Event Timer Setup Modal */}
      <Modal visible={showEventTimerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEventTimerModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Start Timer for Event</Text>
              <TouchableOpacity onPress={startEventTimer}>
                <Text style={styles.modalSave}>Start</Text>
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <View style={styles.eventInfoBox}>
                <Text style={styles.eventInfoTitle}>{selectedEvent.title}</Text>
                <Text style={styles.eventInfoTime}>at {selectedEvent.time}</Text>
              </View>
            )}

            <Text style={styles.modalLabel}>Select Activity</Text>
            <TouchableOpacity
              style={styles.activitySelector}
              onPress={() => setShowEventActivityPicker(true)}
            >
              {eventSelectedActivity ? (
                <View style={styles.selectedActivityRow}>
                  <View style={[styles.activityColorDot, { backgroundColor: eventSelectedActivity.color }]} />
                  <Ionicons name={eventSelectedActivity.icon as any} size={20} color={eventSelectedActivity.color} />
                  <Text style={styles.selectedActivityText}>{eventSelectedActivity.name}</Text>
                </View>
              ) : (
                <View style={styles.selectedActivityRow}>
                  <Ionicons name="add-circle-outline" size={20} color="#888" />
                  <Text style={styles.selectActivityText}>Select an activity</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Timer Duration</Text>
            <View style={styles.timerPickerRow}>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Hours</Text>
                <View style={styles.pickerScroller}>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerScrollContent}>
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[styles.pickerItem, eventTimerHours === hour && styles.pickerItemSelected]}
                        onPress={() => setEventTimerHours(hour)}
                      >
                        <Text style={[styles.pickerItemText, eventTimerHours === hour && styles.pickerItemTextSelected]}>
                          {formatNumber(hour)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.timerSeparator}>:</Text>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Minutes</Text>
                <View style={styles.pickerScroller}>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerScrollContent}>
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[styles.pickerItem, eventTimerMinutes === minute && styles.pickerItemSelected]}
                        onPress={() => setEventTimerMinutes(minute)}
                      >
                        <Text style={[styles.pickerItemText, eventTimerMinutes === minute && styles.pickerItemTextSelected]}>
                          {formatNumber(minute)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            <Text style={styles.timerHint}>
              {eventTimerHours === 0 && eventTimerMinutes === 0 ? 'Please set a timer duration' :
                `Timer will run for ${eventTimerHours > 0 ? `${eventTimerHours}h ` : ''}${eventTimerMinutes > 0 ? `${eventTimerMinutes}m` : ''}`}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Event Activity Picker Modal */}
      <Modal visible={showEventActivityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.activityPickerModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEventActivityPicker(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Activity</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.activityList}>
              {activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => {
                    setEventSelectedActivity(activity);
                    setShowEventActivityPicker(false);
                  }}
                >
                  <View style={[styles.activityColorDot, { backgroundColor: activity.color }]} />
                  <Ionicons name={activity.icon as any} size={22} color={activity.color} />
                  <Text style={styles.activityNameText}>{activity.name}</Text>
                  {eventSelectedActivity?.id === activity.id && (
                    <Ionicons name="checkmark-circle" size={22} color="#4ECDC4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* JSON Planner Modal */}
      <Modal visible={showPlannerModal} animationType="slide" onRequestClose={() => setShowPlannerModal(false)}>
        <View style={styles.plannerModalContainer}>
          <View style={styles.plannerModalHeader}>
            <TouchableOpacity onPress={() => setShowPlannerModal(false)}>
              <Text style={styles.plannerModalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.plannerModalTitle}>
              {todayDate.toLocaleDateString('default', { month: 'long' })} {todayDate.getDate()}, {todayDate.getFullYear()}
            </Text>
            <View style={{ width: 50 }} />
          </View>
          <JSONPlanner
            selectedDate={todayDate}
            initialPlan={todayPlan}
            onSave={handlePlannerSave}
            onClose={() => setShowPlannerModal(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8 },
  tabContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 10, padding: 4, flexWrap: 'wrap' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#000' },
  calendarButton: { backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  taskList: { flex: 1, paddingHorizontal: 20 },

  // Swipeable Event Styles
  swipeContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  deleteEventButton: {
    position: 'absolute',
    right: 2,
    top: 2,
    bottom: 2,
    width: 60,
    backgroundColor: '#FF453A',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.95,
  },
  deleteEventButtonText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  eventCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  todayEventsSection: { marginBottom: 20 },
  todayEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#000',
    zIndex: 1,
  },
  eventPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    justifyContent: 'center',
  },
  eventPillUpcoming: { backgroundColor: '#2196F3' },
  eventPillPassed: { backgroundColor: '#F44336' },
  eventPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  eventInfo: { flex: 1 },
  eventTimeRemaining: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  eventTimeUpcoming: { color: '#2196F3' },
  eventTimePassed: { color: '#F44336' },
  eventTitle: { color: '#fff', fontSize: 14, fontWeight: '500' },

  // Tasks - Clean minimal style (no background colors)
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  taskIndicator: {
    width: 3,
    height: 28,
    borderRadius: 2,
    marginRight: 14,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskActivity: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    color: '#444',
    fontSize: 12,
  },
  taskDuration: {
    color: '#555',
    fontSize: 11,
  },
  removeTaskBtn: {
    padding: 8,
  },
  inputRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  inputLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12 },
  saveButton: { backgroundColor: '#fff', width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#000', fontSize: 24, fontWeight: '600', marginTop: -2 },
  emptyTasks: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#888', fontSize: 18, marginTop: 16 },
  emptySubtext: { color: '#555', fontSize: 14, marginTop: 8 },

  // JSON Planner Button Styles
  plannerButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#000',
  },
  plannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  plannerButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, width: '90%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalCancel: { color: '#888', fontSize: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  modalSave: { color: '#4ECDC4', fontSize: 16, fontWeight: '600' },
  modalLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  activitySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a0a0a', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  selectedActivityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityColorDot: { width: 10, height: 10, borderRadius: 5 },
  selectedActivityText: { color: '#4ECDC4', fontSize: 15, fontWeight: '600' },
  selectActivityText: { color: '#888', fontSize: 15 },
  taskDescriptionInput: { color: '#fff', fontSize: 16, backgroundColor: '#0a0a0a', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  timerPickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
  pickerContainer: { flex: 1, alignItems: 'center' },
  pickerLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  pickerScroller: { height: 150, width: '100%', backgroundColor: '#0a0a0a', borderRadius: 12, overflow: 'hidden' },
  pickerScrollContent: { paddingVertical: 50 },
  pickerItem: { paddingVertical: 10, alignItems: 'center', marginVertical: 2, borderRadius: 8, marginHorizontal: 8 },
  pickerItemSelected: { backgroundColor: 'rgba(78,205,196,0.15)' },
  pickerItemText: { color: '#555', fontSize: 20, fontWeight: '500' },
  pickerItemTextSelected: { color: '#4ECDC4', fontWeight: '700', fontSize: 24 },
  timerSeparator: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: 20 },
  timerHint: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 16 },

  // Activity Picker Modal
  activityPickerModal: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, width: '90%', maxWidth: 400, maxHeight: '70%' },
  activityList: { maxHeight: 400 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#2a2a2a' },
  activityNameText: { color: '#fff', fontSize: 16, flex: 1 },

  // Event Info Box Styles
  eventInfoBox: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  eventInfoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventInfoTime: {
    color: '#888',
    fontSize: 14,
  },

  // Planner Modal Styles
  plannerModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  plannerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  plannerModalClose: {
    color: '#fff',
    fontSize: 16,
  },
  plannerModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
