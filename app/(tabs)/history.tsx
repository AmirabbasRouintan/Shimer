// app/history.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert
} from "react-native";
import { shadcn } from "../../constants/components-theme";

// Activity definitions with colors
const ACTIVITIES = [
  { name: "UNIVERSITY", minDur: 45, maxDur: 180, color: "#DDA0DD" },
  { name: "Book", minDur: 0.5, maxDur: 60, color: "#98D8C8" },
  { name: "Movies", minDur: 60, maxDur: 180, color: "#45B7D1" },
  { name: "Meditation", minDur: 5, maxDur: 30, color: "#96CEB4" },
  { name: "Work", minDur: 30, maxDur: 180, color: "#96CEB4" },
  { name: "Hobby", minDur: 15, maxDur: 120, color: "#4ECDC4" },
  { name: "Personal development", minDur: 15, maxDur: 90, color: "#FFEAA7" },
  { name: "Exercises/Health", minDur: 10, maxDur: 90, color: "#FF6B6B" },
  { name: "Walk", minDur: 10, maxDur: 60, color: "#F7B731" },
  { name: "Getting ready", minDur: 15, maxDur: 45, color: "#FF9F4A" },
  { name: "Sleep/Rest", minDur: 240, maxDur: 540, color: "#E8635E" },
  { name: "Break", minDur: 2, maxDur: 20, color: "#888888" },
  { name: "Study", minDur: 30, maxDur: 150, color: "#6C5CE7" },
  { name: "Dinner", minDur: 20, maxDur: 60, color: "#FF9F4A" },
  { name: "Free time", minDur: 15, maxDur: 90, color: "#A8E6CF" },
  { name: "Other", minDur: 5, maxDur: 60, color: "#6C5CE7" }
];

const randomDuration = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1) + min);

const formatDuration = (minutes: number): string => {
  if (minutes < 1) return `${Math.round(minutes * 60)} sec`;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

const generateRandomHistory = (date: Date) => {
  const seed = date.getFullYear() * 366 + date.getMonth() * 31 + date.getDate();
  const rnd = (max: number) => Math.floor((seed * 9301 + 49297) % 233280 / 233280 * max);
  let currentMinutes = 0;
  const entries = [];
  const maxDayMinutes = 24 * 60;

  const sleepDur = randomDuration(420, 540);
  if (sleepDur <= maxDayMinutes) {
    entries.push({ time: formatTime(currentMinutes), activity: "Sleep/Rest", durationMinutes: sleepDur, duration: formatDuration(sleepDur) });
    currentMinutes += sleepDur;
  }

  while (currentMinutes < maxDayMinutes - 15) {
    let available = [...ACTIVITIES];
    const lastActivity = entries.length ? entries[entries.length - 1].activity : null;
    if (lastActivity) available = available.filter(a => a.name !== lastActivity);
    const hour = currentMinutes / 60;
    if (hour >= 22 || hour < 6) available = available.filter(a => a.name === "Sleep/Rest");
    else if (hour >= 12 && hour <= 13) available = available.filter(a => ["Lunch", "Dinner", "Break"].includes(a.name) || a.name === "Break");
    else if (hour >= 19 && hour <= 21) available = available.filter(a => ["Movies", "Hobby", "Free time", "Dinner"].includes(a.name));
    if (available.length === 0) available = [...ACTIVITIES];

    const act = available[rnd(available.length)];
    let duration = randomDuration(act.minDur, act.maxDur);
    if (currentMinutes + duration > maxDayMinutes) duration = maxDayMinutes - currentMinutes;
    if (duration < 1) break;

    entries.push({ time: formatTime(currentMinutes), activity: act.name, durationMinutes: duration, duration: formatDuration(duration) });
    currentMinutes += duration;

    if (currentMinutes < maxDayMinutes - 30 && rnd(100) < 35) {
      const breakDur = randomDuration(2, 15);
      entries.push({ time: formatTime(currentMinutes), activity: "Break", durationMinutes: breakDur, duration: formatDuration(breakDur) });
      currentMinutes += breakDur;
    }
  }
  return entries.filter(e => e.durationMinutes > 0);
};

// Icon mapping for activities
const getActivityIcon = (name: string): string => {
  const icons: Record<string, string> = {
    "Book": "book-outline",
    "Movies": "film-outline",
    "Meditation": "leaf-outline",
    "Work": "briefcase-outline",
    "Hobby": "heart-outline",
    "Personal development": "star-outline",
    "Exercises/Health": "fitness-outline",
    "Walk": "walk-outline",
    "Getting ready": "bed-outline",
    "Sleep/Rest": "moon-outline",
    "UNIVERSITY": "school-outline",
    "Break": "cafe-outline",
    "Study": "laptop-outline",
    "Dinner": "restaurant-outline",
    "Free time": "game-controller-outline",
    "Other": "folder-outline"
  };
  return icons[name] || "folder-outline";
};

export default function HistoryScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyData, setHistoryData] = useState<any[]>([]);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(currentDate.getMonth());
  const [calendarYear, setCalendarYear] = useState(currentDate.getFullYear());

  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showActivityList, setShowActivityList] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [entryHours, setEntryHours] = useState(0);
  const [entryMinutes, setEntryMinutes] = useState(0);

  useEffect(() => { setHistoryData(generateRandomHistory(currentDate)); }, [currentDate]);

  const getActivityColor = (activity: string) => {
    const act = ACTIVITIES.find(a => a.name === activity);
    return act ? act.color : "#6C5CE7";
  };

  const formatDate = (date: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const goToPrevDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); };
  const goToNextDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); if (d <= new Date()) setCurrentDate(d); };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(calendarYear, calendarMonth, day);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate > today) return;
    setCurrentDate(selectedDate); setShowCalendar(false);
  };

  const goToTodayInCalendar = () => {
    const today = new Date();
    setCalendarMonth(today.getMonth()); setCalendarYear(today.getFullYear());
    setCurrentDate(today); setShowCalendar(false);
  };

  const changeMonth = (delta: number) => {
    let newMonth = calendarMonth + delta; let newYear = calendarYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalendarMonth(newMonth); setCalendarYear(newYear);
  };

  const handleNewEntry = () => {
    const now = new Date();
    setSelectedActivity("");
    setEntryHours(now.getHours());
    setEntryMinutes(now.getMinutes());
    setShowNewEntry(true);
  };

  const addNewEntry = () => {
    if (!selectedActivity) { Alert.alert("Required", "Please select an activity."); return; }
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const entryTotalMinutes = entryHours * 60 + entryMinutes;
    const durationMin = currentTotalMinutes - entryTotalMinutes;
    if (durationMin <= 0) { Alert.alert("Invalid Time", "Entry time must be before current time."); return; }

    const newEntry = {
      time: `${entryHours.toString().padStart(2, '0')}:${entryMinutes.toString().padStart(2, '0')}`,
      activity: selectedActivity,
      durationMinutes: durationMin,
      duration: formatDuration(durationMin)
    };

    const newHistory = [...historyData, newEntry].sort((a, b) => {
      return parseInt(a.time.replace(':', '')) - parseInt(b.time.replace(':', ''));
    });
    setHistoryData(newHistory); setShowNewEntry(false);
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

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
        <TouchableOpacity key={d} style={[styles.calendarDayCell, isSelected && styles.calendarDaySelected, isFuture && styles.calendarDayDisabled]} onPress={() => !isFuture && handleDateSelect(d)} disabled={isFuture}>
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const renderHistoryList = () => (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {historyData.map((item, idx) => {
        const rowHeight = getRowHeight(item.durationMinutes);
        const barHeight = getBarHeight(rowHeight);
        const barColor = getActivityColor(item.activity);
        return (
          <View key={idx} style={[styles.row, { minHeight: rowHeight }]}>
            <Text style={styles.time}>{item.time}</Text>
            <View style={[styles.bar, { backgroundColor: barColor, height: barHeight }]} />
            <Text style={styles.activity} numberOfLines={2}>{item.activity}</Text>
            <Text style={styles.duration}>{item.duration}</Text>
          </View>
        );
      })}
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
        <TouchableOpacity onPress={handleNewEntry} style={styles.headerRight}>
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

            {/* Activity Selection - Button */}
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
                  style={[styles.activityListItem, selectedActivity === act.name && styles.activityListItemSelected]}
                  onPress={() => {
                    setSelectedActivity(act.name);
                    setShowActivityList(false);
                  }}
                >
                  <View style={[styles.activityListDot, { backgroundColor: act.color }]} />
                  <Ionicons name={getActivityIcon(act.name)} size={22} color={act.color} />
                  <Text style={[styles.activityListText, selectedActivity === act.name && styles.activityListTextSelected]}>
                    {act.name}
                  </Text>
                  {selectedActivity === act.name && (
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
  headerRight: { position: 'absolute', right: 16, top: 60 },
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
  list: { flex: 1, paddingHorizontal: 16, },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 12 },
  time: { color: '#fff', fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontWeight: "600", width: 50 },
  bar: { width: 5, borderRadius: 3, marginHorizontal: 4 },
  activity: { color: shadcn.colors.foreground, fontSize: 15, flex: 1 },
  duration: { color: shadcn.colors.mutedForeground, fontSize: 13, fontWeight: "500", width: 70, textAlign: "right" },

  // Calendar
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

  // New Entry Modal
  newEntryModal: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, width: '92%', maxWidth: 420 },
  newEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  headerBtnAdd: { backgroundColor: '#fff' },
  headerBtnTextCancel: { color: '#888', fontSize: 14, fontWeight: '500' },
  headerBtnTextAdd: { color: '#000', fontSize: 14, fontWeight: '600' },
  newEntryTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  stepLabel: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 12 },

  // Select Activity Button
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

  // Time hint
  timeHint: { color: '#555', fontSize: 11, textAlign: 'center', marginBottom: 8 },

  // Single time picker
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

  // Activity List Modal
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
