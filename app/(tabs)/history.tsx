// app/history.tsx - Apple-style version with requested changes
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import {
  getHistoryLogs,
  HistoryLog,
  clearHistoryLogs,
  subscribe,
  getActiveTimer,
  addHistoryLogWithOverlapRemoval,
  updateHistoryLog,
  deleteHistoryLog
} from "../activitiesStore";

// Apple-style Custom Alert Component
const AppleAlert = ({ visible, title, message, onConfirm, onCancel, confirmText = "OK", cancelText = null, singleButton = false }: any) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.alertDivider} />
          <View style={styles.alertButtons}>
            {!singleButton && cancelText && (
              <>
                <TouchableOpacity style={styles.alertCancelButton} onPress={onCancel}>
                  <Text style={styles.alertCancelText}>{cancelText}</Text>
                </TouchableOpacity>
                <View style={styles.alertButtonDivider} />
              </>
            )}
            <TouchableOpacity style={[styles.alertConfirmButton, singleButton && styles.alertSingleButton]} onPress={onConfirm}>
              <Text style={[styles.alertConfirmText, singleButton && styles.alertSingleButtonText]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Apple-style Wheel Picker Component
const WheelPicker = ({ value, onValueChange, items }: { value: number; onValueChange: (val: number) => void; items: number[] }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemHeight = 44;
  const visibleItems = 3;
  const [selectedIndex, setSelectedIndex] = useState(items.indexOf(value));

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
    scrollViewRef.current?.scrollTo({
      y: index * itemHeight,
      animated: true,
    });
  };

  useEffect(() => {
    const initialIndex = items.findIndex(i => i === value);
    if (initialIndex !== -1 && initialIndex !== selectedIndex) {
      setSelectedIndex(initialIndex);
      scrollToIndex(initialIndex);
    }
  }, [value]);

  return (
    <View style={styles.wheelPickerContainer}>
      <View style={styles.wheelPickerWrapper}>
        <View style={styles.wheelPickerFadeTop} pointerEvents="none" />
        <View style={styles.wheelPickerFadeBottom} pointerEvents="none" />
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
              <Text
                style={[
                  styles.wheelPickerItemText,
                  selectedIndex === idx && styles.wheelPickerItemTextSelected,
                ]}
              >
                {item.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const formatDate = (date: Date) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
};

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'activity': return 'timer-outline';
    case 'goal': return 'flag-outline';
    case 'break': return 'cafe-outline';
    default: return 'time-outline';
  }
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${hours}h`;
    }
  } else if (minutes > 0) {
    if (remainingSeconds > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${minutes}m`;
    }
  } else {
    return `${seconds}s`;
  }
};

// Combine consecutive identical entries
const getDateLabel = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatDate(date);
};

const getDatesForRange = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
};

const combineConsecutiveEntries = (logs: HistoryLog[]): HistoryLog[] => {
  if (logs.length === 0) return [];

  const combined: HistoryLog[] = [];

  for (let i = 0; i < logs.length; i++) {
    const current = logs[i];
    const prev = combined[combined.length - 1];

    if (prev && prev.title === current.title && prev.type === current.type) {
      prev.durationSeconds += current.durationSeconds;
      prev.durationMinutes = Math.floor(prev.durationSeconds / 60);
      prev.durationFormatted = formatDuration(prev.durationSeconds);
    } else {
      combined.push({ ...current });
    }
  }

  return combined;
};

// Predefined activities list for new entry
const ACTIVITIES = [
  "Work", "Hobby", "Personal development", "Exercises/Health",
  "Walk", "Getting ready", "Sleep/Rest", "Break", "Study",
  "Dinner", "Free time", "Other"
];

const getActivityColor = (activity: string): string => {
  const colors: Record<string, string> = {
    "Work": "#96CEB4",
    "Hobby": "#fff",
    "Personal development": "#FFEAA7",
    "Exercises/Health": "#FF6B6B",
    "Walk": "#F7B731",
    "Getting ready": "#FF9F4A",
    "Sleep/Rest": "#E8635E",
    "Break": "#888888",
    "Study": "#6C5CE7",
    "Dinner": "#FF9F4A",
    "Free time": "#A8E6CF",
    "Other": "#6C5CE7"
  };
  return colors[activity] || "#6C5CE7";
};

const getActivityIcon = (activity: string): string => {
  const icons: Record<string, string> = {
    "Work": "briefcase-outline",
    "Hobby": "heart-outline",
    "Personal development": "star-outline",
    "Exercises/Health": "fitness-outline",
    "Walk": "walk-outline",
    "Getting ready": "bed-outline",
    "Sleep/Rest": "moon-outline",
    "Break": "cafe-outline",
    "Study": "laptop-outline",
    "Dinner": "restaurant-outline",
    "Free time": "game-controller-outline",
    "Other": "folder-outline"
  };
  return icons[activity] || "folder-outline";
};

// Generate time options once and reuse
const generateTimeOptions = () => {
  const options: { label: string; hours: number; minutes: number; ago: string }[] = [];
  const now = new Date();
  const currentTotal = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i <= 24 * 60; i += 5) {
    const pastTotal = currentTotal - i;
    let h = pastTotal % (24 * 60);
    if (h < 0) h += 24 * 60;
    const hrs = Math.floor(h / 60);
    const mins = h % 60;
    let ago;
    if (i === 0) ago = "Now";
    else if (i < 60) ago = `${i}m ago`;
    else { const hh = Math.floor(i / 60); const mm = i % 60; ago = `${hh}h${mm > 0 ? ` ${mm}m` : ''} ago`; }
    options.push({
      label: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
      hours: hrs,
      minutes: mins,
      ago
    });
  }
  return options;
};

// Pre-compute time options
const TIME_OPTIONS = generateTimeOptions();
const hourOptions = Array.from({ length: 24 }, (_, i) => i);
const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

export default function HistoryScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyLogs, setHistoryLogs] = useState<{ dateLabel: string; entries: HistoryLog[] }[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(currentDate.getMonth());
  const [calendarYear, setCalendarYear] = useState(currentDate.getFullYear());

  // New Entry Modal states
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [entryHours, setEntryHours] = useState(new Date().getHours());
  const [entryMinutes, setEntryMinutes] = useState(new Date().getMinutes());
  const [showActivityList, setShowActivityList] = useState(false);

  // Edit Entry Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HistoryLog | null>(null);
  const [editSelectedActivity, setEditSelectedActivity] = useState("");
  const [editDurationHours, setEditDurationHours] = useState(0);
  const [editDurationMinutes, setEditDurationMinutes] = useState(0);
  const [editShowActivityList, setEditShowActivityList] = useState(false);

  // Apple Alert states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [showRequiredAlert, setShowRequiredAlert] = useState(false);
  const [showInvalidDurationAlert, setShowInvalidDurationAlert] = useState(false);
  const [showInvalidTimeAlert, setShowInvalidTimeAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Live active timer state
  const [activeTimer, setActiveTimerState] = useState<{ title: string; type: string; color: string; startTime: number } | null>(null);
  const [liveDuration, setLiveDuration] = useState<string>('');

  // Use a timestamp to force updates without causing infinite loops
  const [timestamp, setTimestamp] = useState(Date.now());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTimeRef = useRef<string>('');

  // Get current time string for hint
  const getCurrentTimeString = useCallback(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  const loadHistory = useCallback(() => {
    const allLogs = getHistoryLogs();
    const today = new Date();
    const isViewingToday = currentDate.toDateString() === today.toDateString();

    if (isViewingToday) {
      // Show last 3 days
      const dates = getDatesForRange();
      const grouped = dates.map(date => {
        const filtered = allLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate.toDateString() === date.toDateString();
        });
        const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
        const combined = combineConsecutiveEntries(sorted);
        return { dateLabel: getDateLabel(date), entries: combined };
      });
      setHistoryLogs(grouped);
    } else {
      // Show only the selected day
      const filtered = allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === currentDate.toDateString();
      });
      const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
      const combined = combineConsecutiveEntries(sorted);
      setHistoryLogs([{ dateLabel: formatDate(currentDate), entries: combined }]);
    }
  }, [currentDate]);

  const updateActiveTimer = useCallback(() => {
    const timer = getActiveTimer();

    if (timer && timer.activityName) {
      const now = Date.now();
      let startTime = timer.startTime;

      if (!startTime || startTime > now) {
        startTime = now - (timer.durationSeconds * 1000);
      }

      const elapsedSeconds = Math.floor((now - startTime) / 1000);

      setActiveTimerState({
        title: timer.activityName,
        type: timer.activityName === 'Break' ? 'break' : 'activity',
        color: timer.activityColor,
        startTime: startTime
      });

      setLiveDuration(formatDuration(elapsedSeconds));
    } else {
      setActiveTimerState(null);
      setLiveDuration('');
    }
  }, []);

  useEffect(() => {
    updateActiveTimer();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      updateActiveTimer();
      currentTimeRef.current = getCurrentTimeString();
      loadHistory();
      setTimestamp(Date.now());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadHistory, updateActiveTimer, getCurrentTimeString]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      loadHistory();
      updateActiveTimer();
      setTimestamp(Date.now());
    });
    return unsubscribe;
  }, [loadHistory, updateActiveTimer]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      updateActiveTimer();
      setTimestamp(Date.now());
      // Scroll to bottom to show the latest item first
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
      return () => { };
    }, [loadHistory, updateActiveTimer])
  );

  const handleEditPress = (entry: HistoryLog) => {
    setEditingEntry(entry);
    setEditSelectedActivity(entry.title);
    setEditDurationHours(Math.floor(entry.durationMinutes / 60));
    setEditDurationMinutes(entry.durationMinutes % 60);
    setShowEditModal(true);
  };

  const handleDeletePress = (entryId: string) => {
    setDeletingEntryId(entryId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingEntryId) {
      deleteHistoryLog(deletingEntryId);
      loadHistory();
      setShowDeleteConfirm(false);
      setDeletingEntryId(null);
    }
  };

  const saveEditEntry = () => {
    if (!editingEntry) return;
    if (!editSelectedActivity) {
      setAlertMessage("Please select an activity.");
      setShowRequiredAlert(true);
      return;
    }

    const totalMinutes = editDurationHours * 60 + editDurationMinutes;
    if (totalMinutes <= 0) {
      setAlertMessage("Please enter a valid duration.");
      setShowInvalidDurationAlert(true);
      return;
    }

    const durationSeconds = totalMinutes * 60;

    const updatedEntry: HistoryLog = {
      ...editingEntry,
      title: editSelectedActivity,
      color: getActivityColor(editSelectedActivity),
      durationSeconds: durationSeconds,
      durationMinutes: totalMinutes,
      durationFormatted: formatDuration(durationSeconds),
    };

    updateHistoryLog(editingEntry.id, updatedEntry);
    loadHistory();
    setShowEditModal(false);
    setEditingEntry(null);
  };

  const addNewEntry = () => {
    if (!selectedActivity) {
      setAlertMessage("Please select an activity.");
      setShowRequiredAlert(true);
      return;
    }

    const now = Date.now();
    const entryDate = new Date();
    entryDate.setHours(entryHours, entryMinutes, 0, 0);

    let startTimestamp = entryDate.getTime();
    if (startTimestamp > now) {
      startTimestamp = now;
    }

    const durationSeconds = Math.floor((now - startTimestamp) / 1000);

    if (durationSeconds <= 0) {
      setAlertMessage("The end time must be after the start time.");
      setShowInvalidTimeAlert(true);
      return;
    }

    const durationMinutes = Math.floor(durationSeconds / 60);
    const durationFormatted = formatDuration(durationSeconds);

    addHistoryLogWithOverlapRemoval(
      {
        type: 'activity',
        title: selectedActivity,
        color: getActivityColor(selectedActivity),
        durationSeconds: durationSeconds,
        durationMinutes: durationMinutes,
        durationFormatted: durationFormatted,
        timestamp: startTimestamp,
        date: new Date(startTimestamp).toISOString(),
      },
      startTimestamp,
      now
    );

    loadHistory();
    setShowNewEntry(false);
    setSelectedActivity("");
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const goToPrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
    // Scroll to top when changing date
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const goToNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d <= today) setCurrentDate(d);
    // Scroll to top when changing date
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(calendarYear, calendarMonth, day);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate > today) return;
    setCurrentDate(selectedDate);
    setShowCalendar(false);
    // Scroll to top when selecting date from calendar
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const goToTodayInCalendar = () => {
    const today = new Date();
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
    setCurrentDate(today);
    setShowCalendar(false);
    // Scroll to top when going to today
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const changeMonth = (delta: number) => {
    let newMonth = calendarMonth + delta;
    let newYear = calendarYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let dayCells = [];
    for (let i = 0; i < firstDay; i++) dayCells.push(<View key={`e-${i}`} style={styles.calendarDayCell} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(calendarYear, calendarMonth, d);
      const isSelected = currentDate.toDateString() === cellDate.toDateString();
      const isFuture = cellDate > today;
      dayCells.push(
        <TouchableOpacity
          key={d}
          style={[styles.calendarDayCell, isSelected && styles.calendarDaySelected, isFuture && styles.calendarDayDisabled]}
          onPress={() => !isFuture && handleDateSelect(d)}
          disabled={isFuture}
        >
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, isFuture && styles.calendarDayTextDisabled]}>{d}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={24} color={shadcn.colors.foreground} /></TouchableOpacity>
              <Text style={styles.calendarMonthText}>{monthNames[calendarMonth]} {calendarYear}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={24} color={shadcn.colors.foreground} /></TouchableOpacity>
            </View>
            <View style={styles.weekDaysRow}>{weekDays.map(day => <Text key={day} style={styles.weekDayText}>{day}</Text>)}</View>
            <View style={styles.calendarDaysGrid}>{dayCells}</View>
            <TouchableOpacity style={styles.todayButton} onPress={goToTodayInCalendar}><Text style={styles.todayButtonText}>Today</Text></TouchableOpacity>
            <TouchableOpacity style={styles.closeCalendarButton} onPress={() => setShowCalendar(false)}><Text style={styles.closeCalendarText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const BASE_HEIGHT = 40;
  const getRowHeight = (durationMinutes: number) => {
    if (durationMinutes < 10) return BASE_HEIGHT * 0.8;
    else if (durationMinutes < 30) { const t = (durationMinutes - 10) / 20; return BASE_HEIGHT * (0.9 + t * 0.5); }
    else if (durationMinutes < 60) { const t = (durationMinutes - 30) / 30; return BASE_HEIGHT * (1.0 + t * 0.5); }
    else if (durationMinutes < 240) { const t = (durationMinutes - 60) / 180; return BASE_HEIGHT * (1.0 + t * 1.0); }
    else { const extraHours = Math.min(4, (durationMinutes - 240) / 120); return BASE_HEIGHT * (6.0 + extraHours); }
  };

  const getBarHeight = (rowHeight: number) => Math.max(8, rowHeight - 16); // Increased minimum bar height from 4 to 8

  const renderHistoryList = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.list}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContentContainer}
    >
      {/* Empty day messages at the top */}
      {historyLogs.filter(g => g.entries.length === 0).map((group) => (
        <View key={`empty-${group.dateLabel}`} style={styles.emptyDayContainer}>
          <Text style={styles.emptyDayText}>No entries for {group.dateLabel}</Text>
        </View>
      ))}

      {/* Day groups with entries */}
      {historyLogs.map((group) => {
        if (group.entries.length === 0) return null;
        return (
        <View key={group.dateLabel}>
          <View style={styles.dayHeader}>
            <View style={styles.dayHeaderLine} />
            <Text style={styles.dayHeaderText}>{group.dateLabel}</Text>
            <View style={styles.dayHeaderLine} />
          </View>
          {group.entries.map((item) => {
            const rowHeight = getRowHeight(item.durationMinutes);
            const barHeight = getBarHeight(rowHeight);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.row, { minHeight: rowHeight }]}
                activeOpacity={0.7}
                onPress={() => handleEditPress(item)}
                onLongPress={() => handleDeletePress(item.id)}
                delayLongPress={300}
              >
                <View style={styles.timeContainer}>
                  <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
                  <Ionicons name={getTypeIcon(item.type)} size={12} color="#888" style={styles.typeIcon} />
                </View>
                <View style={[styles.bar, { backgroundColor: item.color, height: barHeight, width: 8, borderRadius: 4 }]} />
                <View style={styles.contentContainer}>
                  <Text style={styles.activity} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.duration}>{item.durationFormatted}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        );
      })}

      {/* Live Timer - Always at the very bottom */}
      {activeTimer && (
        <View style={[styles.row, styles.liveRow, { minHeight: getRowHeight(Math.max(1, Math.floor((Date.now() - activeTimer.startTime) / 60000))) }]}>
          <View style={styles.timeContainer}>
            <Text style={[styles.time, styles.liveTime]}>{formatTime(activeTimer.startTime)}</Text>
            <Ionicons name={activeTimer.type === 'break' ? "cafe-outline" : "flash"} size={12} color="#fff" style={styles.typeIcon} />
          </View>
          <View style={[styles.bar, { backgroundColor: activeTimer.color, height: getBarHeight(getRowHeight(Math.max(1, Math.floor((Date.now() - activeTimer.startTime) / 60000)))), width: 8, borderRadius: 4 }]} />
          <View style={styles.contentContainer}>
            <Text style={[styles.activity, styles.liveActivity]} numberOfLines={2}>{activeTimer.title}</Text>
            <Text style={[styles.duration, styles.liveDuration]}>{liveDuration || '0s'}</Text>
          </View>
        </View>
      )}

      {historyLogs.every(g => g.entries.length === 0) && !activeTimer && (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#333" />
          <Text style={styles.emptyTitle}>No History</Text>
          <Text style={styles.emptyText}>
            Complete timers or tap + to add an entry
          </Text>
        </View>
      )}

      {/* Extra bottom padding for better scrolling */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const handleNewEntry = () => {
    const now = new Date();
    setSelectedActivity("");
    setEntryHours(now.getHours());
    setEntryMinutes(now.getMinutes());
    setShowNewEntry(true);
  };

  // Memoized time picker to prevent re-renders
  const TimePicker = useMemo(() => (
    <ScrollView style={styles.singlePickerScroll} showsVerticalScrollIndicator={false}>
      {TIME_OPTIONS.map((t, idx) => {
        const isSelected = entryHours === t.hours && entryMinutes === t.minutes;
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.singlePickerItem, isSelected && styles.singlePickerItemSelected]}
            onPress={() => { setEntryHours(t.hours); setEntryMinutes(t.minutes); }}
          >
            <Text style={[styles.singlePickerTime, isSelected && styles.singlePickerTimeSelected]}>{t.label}</Text>
            <Text style={[styles.singlePickerAgo, isSelected && styles.singlePickerAgoSelected]}>{t.ago}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  ), [entryHours, entryMinutes]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.replace('/things')} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={goToPrevDay} style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={20} color={shadcn.colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            {isToday(currentDate) && <View style={styles.todayDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextDay} style={[styles.dateArrow, isToday(currentDate) && styles.disabledArrow]}>
            <Ionicons name="chevron-forward" size={20} color={isToday(currentDate) ? shadcn.colors.border : shadcn.colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleNewEntry} style={styles.newEntryButton}>
          <Text style={styles.newEntryText}>New Entry</Text>
        </TouchableOpacity>
      </View>

      {renderHistoryList()}
      {renderCalendar()}

      {/* Apple Style Edit Entry Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleModal}>
            <View style={styles.appleModalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.appleModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleModalTitle}>Edit Entry</Text>
              <TouchableOpacity onPress={saveEditEntry}>
                <Text style={styles.appleModalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Activity Selection */}
            <View style={styles.appleSection}>
              <Text style={styles.appleSectionLabel}>ACTIVITY</Text>
              <TouchableOpacity
                style={styles.appleSelector}
                onPress={() => setEditShowActivityList(true)}
              >
                {editSelectedActivity ? (
                  <View style={styles.appleSelectedRow}>
                    <View style={[styles.appleColorDot, { backgroundColor: getActivityColor(editSelectedActivity) }]} />
                    <Ionicons name={getActivityIcon(editSelectedActivity)} size={20} color="#fff" />
                    <Text style={styles.appleSelectedText}>{editSelectedActivity}</Text>
                  </View>
                ) : (
                  <View style={styles.appleSelectedRow}>
                    <Ionicons name="add-circle-outline" size={20} color="#888" />
                    <Text style={styles.applePlaceholderText}>Choose an activity</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Duration Pickers */}
            <View style={styles.appleSection}>
              <Text style={styles.appleSectionLabel}>DURATION</Text>
              <View style={styles.appleWheelRow}>
                <View style={styles.appleWheelColumn}>
                  <Text style={styles.appleWheelLabel}>Hours</Text>
                  <WheelPicker
                    value={editDurationHours}
                    onValueChange={setEditDurationHours}
                    items={hourOptions}
                  />
                </View>
                <View style={styles.appleWheelColumn}>
                  <Text style={styles.appleWheelLabel}>Minutes</Text>
                  <WheelPicker
                    value={editDurationMinutes}
                    onValueChange={setEditDurationMinutes}
                    items={minuteOptions}
                  />
                </View>
              </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.appleDeleteButton}
              onPress={() => {
                if (editingEntry) {
                  setShowEditModal(false);
                  handleDeletePress(editingEntry.id);
                }
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={styles.appleDeleteText}>Delete Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Apple Style New Entry Modal */}
      <Modal visible={showNewEntry} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleModal}>
            <View style={styles.appleModalHeader}>
              <TouchableOpacity onPress={() => setShowNewEntry(false)}>
                <Text style={styles.appleModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleModalTitle}>New Entry</Text>
              <TouchableOpacity onPress={addNewEntry}>
                <Text style={styles.appleModalAdd}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Activity Selection */}
            <View style={styles.appleSection}>
              <Text style={styles.appleSectionLabel}>ACTIVITY</Text>
              <TouchableOpacity
                style={styles.appleSelector}
                onPress={() => setShowActivityList(true)}
              >
                {selectedActivity ? (
                  <View style={styles.appleSelectedRow}>
                    <View style={[styles.appleColorDot, { backgroundColor: getActivityColor(selectedActivity) }]} />
                    <Ionicons name={getActivityIcon(selectedActivity)} size={20} color="#fff" />
                    <Text style={styles.appleSelectedText}>{selectedActivity}</Text>
                  </View>
                ) : (
                  <View style={styles.appleSelectedRow}>
                    <Ionicons name="add-circle-outline" size={20} color="#888" />
                    <Text style={styles.applePlaceholderText}>Choose an activity</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Start Time Selection */}
            <View style={styles.appleSection}>
              <Text style={styles.appleSectionLabel}>START TIME</Text>
              <Text style={styles.appleTimeHint}>Now: {getCurrentTimeString()}</Text>
              <View style={styles.singlePickerContainer}>
                {TimePicker}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Apple Style Activity List Modal for New Entry */}
      <Modal visible={showActivityList} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleListModal}>
            <View style={styles.appleListHeader}>
              <TouchableOpacity onPress={() => setShowActivityList(false)}>
                <Text style={styles.appleListCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleListTitle}>Activity</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.appleListScroll} showsVerticalScrollIndicator={false}>
              {ACTIVITIES.map((act, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.appleListItem, selectedActivity === act && styles.appleListItemSelected]}
                  onPress={() => {
                    setSelectedActivity(act);
                    setShowActivityList(false);
                  }}
                >
                  <View style={[styles.appleListDot, { backgroundColor: getActivityColor(act) }]} />
                  <Ionicons name={getActivityIcon(act)} size={22} color={getActivityColor(act)} />
                  <Text style={[styles.appleListText, selectedActivity === act && styles.appleListTextSelected]}>
                    {act}
                  </Text>
                  {selectedActivity === act && (
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Apple Style Edit Activity List Modal */}
      <Modal visible={editShowActivityList} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleListModal}>
            <View style={styles.appleListHeader}>
              <TouchableOpacity onPress={() => setEditShowActivityList(false)}>
                <Text style={styles.appleListCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.appleListTitle}>Activity</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.appleListScroll} showsVerticalScrollIndicator={false}>
              {ACTIVITIES.map((act, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.appleListItem, editSelectedActivity === act && styles.appleListItemSelected]}
                  onPress={() => {
                    setEditSelectedActivity(act);
                    setEditShowActivityList(false);
                  }}
                >
                  <View style={[styles.appleListDot, { backgroundColor: getActivityColor(act) }]} />
                  <Ionicons name={getActivityIcon(act)} size={22} color={getActivityColor(act)} />
                  <Text style={[styles.appleListText, editSelectedActivity === act && styles.appleListTextSelected]}>
                    {act}
                  </Text>
                  {editSelectedActivity === act && (
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Apple Style Alerts */}
      <AppleAlert
        visible={showDeleteConfirm}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingEntryId(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <AppleAlert
        visible={showRequiredAlert}
        title="Required"
        message={alertMessage}
        onConfirm={() => setShowRequiredAlert(false)}
        confirmText="OK"
        singleButton={true}
      />

      <AppleAlert
        visible={showInvalidDurationAlert}
        title="Invalid Duration"
        message={alertMessage}
        onConfirm={() => setShowInvalidDurationAlert(false)}
        confirmText="OK"
        singleButton={true}
      />

      <AppleAlert
        visible={showInvalidTimeAlert}
        title="Invalid Time"
        message={alertMessage}
        onConfirm={() => setShowInvalidTimeAlert(false)}
        confirmText="OK"
        singleButton={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12,
  },
  headerLeft: { position: 'absolute', left: 16, top: 60 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  newEntryButton: { position: 'absolute', right: 16, top: 60 },
  newEntryText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  dateContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: shadcn.colors.card,
    borderRadius: 20, paddingHorizontal: 1, paddingVertical: 4,
  },
  dateArrow: { paddingHorizontal: 8, paddingVertical: 4 },
  disabledArrow: { opacity: 0.3 },
  dateButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4 },
  dateText: { color: shadcn.colors.foreground, fontSize: 14, fontWeight: "600" },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: shadcn.colors.brand },
  list: { flex: 1, paddingHorizontal: 16 },
  listContentContainer: {
    paddingBottom: 40,
  },
  bottomPadding: {
    height: 60,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  dayHeaderText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  dayHeaderLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#2a2a2a',
  },
  emptyDayContainer: {
    paddingVertical: 40,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 12,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  liveRow: {
    // Removed background color
    borderRadius: 12,
    marginBottom: 4
  },
  timeContainer: { alignItems: 'center', width: 50 },
  time: { color: '#fff', fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontWeight: "600" },
  liveTime: { color: '#fff', fontWeight: '800' },
  typeIcon: { marginTop: 2 },
  bar: {
    width: 8,  // Made wider
    borderRadius: 4,
    marginHorizontal: 4
  },
  contentContainer: { flex: 1 },
  activity: { color: shadcn.colors.foreground, fontSize: 15 },
  liveActivity: { color: '#fff', fontWeight: '600' },
  duration: { color: shadcn.colors.mutedForeground, fontSize: 12, marginTop: 2 },
  liveDuration: { color: '#fff', fontWeight: '600' },
  rowActions: {
    padding: 4,
  },
  separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },

  // Calendar Modal (keep existing)
  calendarModal: { backgroundColor: shadcn.colors.card, borderRadius: 20, padding: 20, width: '90%', maxWidth: 350 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarMonthText: { color: shadcn.colors.foreground, fontSize: 18, fontWeight: '600' },
  weekDaysRow: { flexDirection: 'row', marginBottom: 10 },
  weekDayText: { flex: 1, textAlign: 'center', color: shadcn.colors.mutedForeground, fontSize: 12, fontWeight: '600' },
  calendarDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  calendarDaySelected: { backgroundColor: shadcn.colors.brand, borderRadius: 30 },
  calendarDayDisabled: { opacity: 0.3 },
  calendarDayText: { color: shadcn.colors.foreground, fontSize: 14 },
  calendarDayTextSelected: { color: shadcn.colors.brandForeground, fontWeight: 'bold' },
  calendarDayTextDisabled: { color: shadcn.colors.mutedForeground },
  todayButton: { marginTop: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: shadcn.colors.secondary, alignItems: 'center' },
  todayButtonText: { color: shadcn.colors.foreground, fontWeight: '600' },
  closeCalendarButton: { marginTop: 10, paddingVertical: 10, alignItems: 'center' },
  closeCalendarText: { color: shadcn.colors.mutedForeground },

  // Apple Modal Styles
  appleModal: {
    backgroundColor: '#0f0f11',
    borderRadius: 14,
    padding: 0,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  appleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#38383a',
  },
  appleModalCancel: {
    color: '#ff3b30',
    fontSize: 17,
    fontWeight: '500',
  },
  appleModalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  appleModalSave: {
    color: '#007aff',
    fontSize: 17,
    fontWeight: '600',
  },
  appleModalAdd: {
    color: '#007aff',
    fontSize: 17,
    fontWeight: '600',
  },
  appleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  appleSectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1e',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  appleSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appleColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  appleSelectedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  applePlaceholderText: {
    color: '#888',
    fontSize: 16,
  },
  appleWheelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  appleWheelColumn: {
    flex: 1,
    alignItems: 'center',
  },
  appleWheelLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  appleTimeHint: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },
  appleDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#38383a',
  },
  appleDeleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },

  // Wheel Picker Styles
  wheelPickerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  wheelPickerWrapper: {
    height: 132,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  wheelPickerScroll: {
    height: 132,
    width: '100%',
  },
  wheelPickerFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 45,
    backgroundColor: 'rgba(15,15,17,0.95)',
    zIndex: 10,
  },
  wheelPickerFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 45,
    backgroundColor: 'rgba(15,15,17,0.95)',
    zIndex: 10,
  },
  wheelPickerSelectedIndicator: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(100,100,110,0.1)',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 5,
  },
  wheelPickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelPickerItemText: {
    color: '#555',
    fontSize: 20,
    fontWeight: '500',
  },
  wheelPickerItemTextSelected: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },

  // Apple List Modal Styles
  appleListModal: {
    backgroundColor: '#0f0f11',
    borderRadius: 14,
    padding: 0,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  appleListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#38383a',
  },
  appleListCancel: {
    color: '#ff3b30',
    fontSize: 17,
    fontWeight: '500',
  },
  appleListTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  appleListScroll: {
    padding: 8,
  },
  appleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#1c1c1e',
  },
  appleListItemSelected: {
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderWidth: 1,
    borderColor: '#fff',
  },
  appleListDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  appleListText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  appleListTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // Single Picker (for time selection)
  singlePickerContainer: { height: 200, backgroundColor: '#1c1c1e', borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  singlePickerScroll: { flex: 1, paddingVertical: 4 },
  singlePickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 6, marginVertical: 1, borderRadius: 8,
  },
  singlePickerItemSelected: { backgroundColor: 'rgba(78,205,196,0.12)' },
  singlePickerTime: { color: '#aaa', fontSize: 15, fontWeight: '500' },
  singlePickerTimeSelected: { color: '#fff', fontWeight: '700' },
  singlePickerAgo: { color: '#555', fontSize: 11, fontWeight: '400' },
  singlePickerAgoSelected: { color: '#fff', fontWeight: '500' },

  // Apple Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    width: '80%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  alertTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  alertMessage: {
    color: '#8e8e93',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 18,
  },
  alertDivider: {
    height: 0.5,
    backgroundColor: '#38383a',
  },
  alertButtons: {
    flexDirection: 'row',
  },
  alertCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  alertCancelText: {
    color: '#ff3b30',
    fontSize: 17,
    fontWeight: '500',
  },
  alertButtonDivider: {
    width: 0.5,
    backgroundColor: '#38383a',
  },
  alertConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  alertConfirmText: {
    color: '#007aff',
    fontSize: 17,
    fontWeight: '600',
  },
  alertSingleButton: {
    justifyContent: 'center',
  },
  alertSingleButtonText: {
    fontWeight: '600',
  },
});
