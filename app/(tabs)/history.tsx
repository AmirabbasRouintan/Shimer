// app/history.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  TextInput
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import { getHistoryLogs, HistoryLog, clearHistoryLogs, subscribe, getActiveTimer, addHistoryLog } from "../activitiesStore";

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

// Format duration with live counting
const formatLiveDuration = (startTime: number, isActive: boolean): string => {
  if (!isActive) return '';
  const now = Date.now();
  const durationSeconds = Math.floor((now - startTime) / 1000);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

// Combine consecutive identical entries
const combineConsecutiveEntries = (logs: HistoryLog[]): HistoryLog[] => {
  if (logs.length === 0) return [];

  const combined: HistoryLog[] = [];

  for (let i = 0; i < logs.length; i++) {
    const current = logs[i];
    const prev = combined[combined.length - 1];

    if (prev && prev.title === current.title && prev.type === current.type) {
      // Combine with previous entry
      prev.durationSeconds += current.durationSeconds;
      prev.durationMinutes = Math.floor(prev.durationSeconds / 60);
      prev.durationFormatted = formatDuration(prev.durationSeconds);
    } else {
      combined.push({ ...current });
    }
  }

  return combined;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
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
    "Hobby": "#4ECDC4",
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

export default function HistoryScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(currentDate.getMonth());
  const [calendarYear, setCalendarYear] = useState(currentDate.getFullYear());

  // New Entry Modal states
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [entryHours, setEntryHours] = useState(0);
  const [entryMinutes, setEntryMinutes] = useState(0);
  const [showActivityList, setShowActivityList] = useState(false);

  // Live active timer state
  const [activeTimer, setActiveTimerState] = useState<{ title: string; type: string; color: string; startTime: number } | null>(null);
  const [liveDuration, setLiveDuration] = useState<string>('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadHistoryForDate = useCallback((date: Date) => {
    const allLogs = getHistoryLogs();
    const filtered = allLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === date.toDateString();
    });

    // Sort by timestamp ascending (oldest first, newest at bottom)
    const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);

    // Combine consecutive identical entries
    const combined = combineConsecutiveEntries(sorted);
    setHistoryLogs(combined);
  }, []);

  // Check and update active timer for live view
  const updateActiveTimer = useCallback(() => {
    const timer = getActiveTimer();
    if (timer && timer.activityName) {
      const now = Date.now();
      if (!activeTimer || activeTimer.title !== timer.activityName) {
        const estimatedStartTime = now - (timer.durationSeconds * 1000);
        setActiveTimerState({
          title: timer.activityName,
          type: 'activity',
          color: timer.activityColor,
          startTime: estimatedStartTime
        });
      }
    } else {
      setActiveTimerState(null);
    }
  }, [activeTimer]);

  // Live timer interval
  useEffect(() => {
    updateActiveTimer();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      updateActiveTimer();

      if (activeTimer) {
        const duration = formatLiveDuration(activeTimer.startTime, true);
        setLiveDuration(duration);
      } else {
        setLiveDuration('');
      }

      loadHistoryForDate(currentDate);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer, currentDate, loadHistoryForDate, updateActiveTimer]);

  // Load history when component mounts and when screen gets focus
  useEffect(() => {
    loadHistoryForDate(currentDate);
  }, [currentDate, loadHistoryForDate]);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      loadHistoryForDate(currentDate);
      updateActiveTimer();
    });
    return unsubscribe;
  }, [currentDate, loadHistoryForDate, updateActiveTimer]);

  useFocusEffect(
    useCallback(() => {
      loadHistoryForDate(currentDate);
      updateActiveTimer();
      return () => { };
    }, [currentDate, loadHistoryForDate, updateActiveTimer])
  );

  // New Entry functions
  const handleNewEntry = () => {
    const now = new Date();
    setSelectedActivity("");
    setEntryHours(now.getHours());
    setEntryMinutes(now.getMinutes());
    setShowNewEntry(true);
  };

  const addNewEntry = () => {
    if (!selectedActivity) {
      Alert.alert("Required", "Please select an activity.");
      return;
    }

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const entryTotalMinutes = entryHours * 60 + entryMinutes;
    let durationMin = currentTotalMinutes - entryTotalMinutes;

    if (durationMin <= 0) {
      // If entry time is in the future, use 1 minute as default
      durationMin = 1;
    }

    const durationSeconds = durationMin * 60;

    addHistoryLog({
      type: 'activity',
      title: selectedActivity,
      color: getActivityColor(selectedActivity),
      durationSeconds: durationSeconds,
      durationMinutes: durationMin,
      durationFormatted: formatDuration(durationSeconds),
      timestamp: Date.now() - (durationSeconds * 1000),
      date: new Date(Date.now() - (durationSeconds * 1000)).toISOString(),
    });

    loadHistoryForDate(currentDate);
    setShowNewEntry(false);
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const goToPrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goToNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d <= today) setCurrentDate(d);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(calendarYear, calendarMonth, day);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate > today) return;
    setCurrentDate(selectedDate);
    setShowCalendar(false);
  };

  const goToTodayInCalendar = () => {
    const today = new Date();
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
    setCurrentDate(today);
    setShowCalendar(false);
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

  const getBarHeight = (rowHeight: number) => Math.max(4, rowHeight - 16);

  const renderHistoryList = () => (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {/* History entries - oldest first, newest at bottom */}
      {historyLogs.map((item) => {
        const rowHeight = getRowHeight(item.durationMinutes);
        const barHeight = getBarHeight(rowHeight);
        return (
          <View key={item.id} style={[styles.row, { minHeight: rowHeight }]}>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
              <Ionicons name={getTypeIcon(item.type)} size={12} color="#888" style={styles.typeIcon} />
            </View>
            <View style={[styles.bar, { backgroundColor: item.color, height: barHeight }]} />
            <View style={styles.contentContainer}>
              <Text style={styles.activity} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.duration}>{item.durationFormatted}</Text>
            </View>
          </View>
        );
      })}

      {/* Live Active Timer Row - at the bottom (latest) */}
      {activeTimer && (
        <>
          {historyLogs.length > 0 && <View style={styles.separator} />}
          <View style={[styles.row, styles.liveRow, { minHeight: getRowHeight(1) }]}>
            <View style={styles.timeContainer}>
              <Text style={[styles.time, styles.liveTime]}>NOW</Text>
              <Ionicons name="flash" size={12} color="#4ECDC4" style={styles.typeIcon} />
            </View>
            <View style={[styles.bar, { backgroundColor: activeTimer.color, height: getBarHeight(getRowHeight(1)) }]} />
            <View style={styles.contentContainer}>
              <Text style={[styles.activity, styles.liveActivity]} numberOfLines={2}>{activeTimer.title}</Text>
              <Text style={[styles.duration, styles.liveDuration]}>{liveDuration || '0s'}</Text>
            </View>
          </View>
        </>
      )}

      {historyLogs.length === 0 && !activeTimer && (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#333" />
          <Text style={styles.emptyTitle}>No History</Text>
          <Text style={styles.emptyText}>
            Complete timers or tap + to add an entry
          </Text>
        </View>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );

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
          <TouchableOpacity onPress={goToNextDay} style={[styles.dateArrow, !isToday(currentDate) && styles.disabledArrow]} disabled={!isToday(currentDate)}>
            <Ionicons name="chevron-forward" size={20} color={isToday(currentDate) ? shadcn.colors.border : shadcn.colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleNewEntry} style={styles.newEntryButton}>
          <Text style={styles.newEntryText}>New Entry</Text>
        </TouchableOpacity>
      </View>

      {renderHistoryList()}
      {renderCalendar()}

      {/* New Entry Modal */}
      <Modal visible={showNewEntry} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.newEntryModal}>
            <View style={styles.newEntryHeader}>
              <TouchableOpacity onPress={() => setShowNewEntry(false)} style={styles.headerBtn}>
                <Text style={styles.headerBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.newEntryTitle}>New Entry</Text>
              <TouchableOpacity onPress={addNewEntry} style={[styles.headerBtn, styles.headerBtnAdd]}>
                <Text style={styles.headerBtnTextAdd}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Activity Selection */}
            <Text style={styles.stepLabel}>Activity</Text>
            <TouchableOpacity
              style={styles.selectActivityBtn}
              onPress={() => setShowActivityList(true)}
            >
              {selectedActivity ? (
                <View style={styles.selectedActivityRow}>
                  <View style={[styles.selectedActivityDot, { backgroundColor: getActivityColor(selectedActivity) }]} />
                  <Ionicons name={getActivityIcon(selectedActivity)} size={18} color="#4ECDC4" />
                  <Text style={styles.selectActivityBtnTextSelected}>{selectedActivity}</Text>
                </View>
              ) : (
                <View style={styles.selectActivityPlaceholder}>
                  <Ionicons name="add-circle-outline" size={20} color="#888" />
                  <Text style={styles.selectActivityBtnText}>Choose an activity</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            {/* Time Selection */}
            <Text style={styles.stepLabel}>When did it start?</Text>
            <Text style={styles.timeHint}>
              Now: {formatNumber(new Date().getHours())}:{formatNumber(new Date().getMinutes())}
            </Text>
            <View style={styles.singlePickerContainer}>
              <ScrollView style={styles.singlePickerScroll} showsVerticalScrollIndicator={false}>
                {(() => {
                  const now = new Date();
                  const currentTotal = now.getHours() * 60 + now.getMinutes();
                  const times: { label: string; hours: number; minutes: number; ago: string }[] = [];
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
                    times.push({ label: `${formatNumber(hrs)}:${formatNumber(mins)}`, hours: hrs, minutes: mins, ago });
                  }
                  return times.map((t, idx) => {
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
                  });
                })()}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Activity List Modal */}
      <Modal visible={showActivityList} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.activityListModal}>
            <View style={styles.activityListHeader}>
              <TouchableOpacity onPress={() => setShowActivityList(false)}>
                <Text style={styles.activityListCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.activityListTitle}>Activity</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.activityListScroll} showsVerticalScrollIndicator={false}>
              {ACTIVITIES.map((act, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.activityListItem, selectedActivity === act && styles.activityListItemSelected]}
                  onPress={() => {
                    setSelectedActivity(act);
                    setShowActivityList(false);
                  }}
                >
                  <View style={[styles.activityListDot, { backgroundColor: getActivityColor(act) }]} />
                  <Ionicons name={getActivityIcon(act)} size={22} color={getActivityColor(act)} />
                  <Text style={[styles.activityListText, selectedActivity === act && styles.activityListTextSelected]}>
                    {act}
                  </Text>
                  {selectedActivity === act && (
                    <Ionicons name="checkmark-circle" size={22} color="#4ECDC4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 12 },
  liveRow: { backgroundColor: 'rgba(78,205,196,0.05)', borderRadius: 12, marginBottom: 4 },
  timeContainer: { alignItems: 'center', width: 50 },
  time: { color: '#fff', fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontWeight: "600" },
  liveTime: { color: '#4ECDC4', fontWeight: '800' },
  typeIcon: { marginTop: 2 },
  bar: { width: 5, borderRadius: 3, marginHorizontal: 4 },
  contentContainer: { flex: 1 },
  activity: { color: shadcn.colors.foreground, fontSize: 15 },
  liveActivity: { color: '#4ECDC4', fontWeight: '600' },
  duration: { color: shadcn.colors.mutedForeground, fontSize: 12, marginTop: 2 },
  liveDuration: { color: '#4ECDC4', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
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

  // New Entry Modal Styles
  newEntryModal: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, width: '92%', maxWidth: 420 },
  newEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  headerBtnAdd: { backgroundColor: '#fff' },
  headerBtnTextCancel: { color: '#888', fontSize: 14, fontWeight: '500' },
  headerBtnTextAdd: { color: '#000', fontSize: 14, fontWeight: '600' },
  newEntryTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  stepLabel: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 12 },
  selectActivityBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0a0a0a', paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 4,
  },
  selectActivityPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectActivityBtnText: { color: '#888', fontSize: 15 },
  selectedActivityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedActivityDot: { width: 8, height: 8, borderRadius: 4 },
  selectActivityBtnTextSelected: { color: '#4ECDC4', fontSize: 15, fontWeight: '600' },
  timeHint: { color: '#555', fontSize: 11, textAlign: 'center', marginBottom: 8 },
  singlePickerContainer: { height: 200, backgroundColor: '#0a0a0a', borderRadius: 12, overflow: 'hidden' },
  singlePickerScroll: { flex: 1, paddingVertical: 4 },
  singlePickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 6, marginVertical: 1, borderRadius: 8,
  },
  singlePickerItemSelected: { backgroundColor: 'rgba(78,205,196,0.12)' },
  singlePickerTime: { color: '#aaa', fontSize: 15, fontWeight: '500' },
  singlePickerTimeSelected: { color: '#4ECDC4', fontWeight: '700' },
  singlePickerAgo: { color: '#555', fontSize: 11, fontWeight: '400' },
  singlePickerAgoSelected: { color: '#4ECDC4', fontWeight: '500' },
  activityListModal: {
    backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20,
    width: '92%', maxWidth: 420, maxHeight: '70%',
  },
  activityListHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
  },
  activityListCancel: { color: '#888', fontSize: 16 },
  activityListTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  activityListScroll: { maxHeight: 400 },
  activityListItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4,
    backgroundColor: '#0a0a0a',
  },
  activityListItemSelected: {
    backgroundColor: 'rgba(78,205,196,0.08)',
    borderWidth: 1, borderColor: '#4ECDC4',
  },
  activityListDot: { width: 8, height: 8, borderRadius: 4 },
  activityListText: { color: '#fff', fontSize: 16, flex: 1 },
  activityListTextSelected: { color: '#4ECDC4', fontWeight: '600' },
});
