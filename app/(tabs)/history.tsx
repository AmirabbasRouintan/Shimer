// app/history.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

// Activity definitions
const ACTIVITIES = [
  { name: 'Book', minDur: 0.5, maxDur: 60, color: '#98D8C8' },
  { name: 'Movies', minDur: 60, maxDur: 180, color: '#45B7D1' },
  { name: 'Meditation', minDur: 5, maxDur: 30, color: '#96CEB4' },
  { name: 'Work', minDur: 30, maxDur: 180, color: '#96CEB4' },
  { name: 'Hobby', minDur: 15, maxDur: 120, color: '#4ECDC4' },
  { name: 'Personal development', minDur: 15, maxDur: 90, color: '#FFEAA7' },
  { name: 'Exercises/Health', minDur: 10, maxDur: 90, color: '#FF6B6B' },
  { name: 'Walk', minDur: 10, maxDur: 60, color: '#F7B731' },
  { name: 'Getting ready', minDur: 15, maxDur: 45, color: '#FF9F4A' },
  { name: 'Sleep/Rest', minDur: 240, maxDur: 540, color: '#E8635E' },
  { name: 'UNIVERSITY', minDur: 45, maxDur: 180, color: '#DDA0DD' },
  { name: 'Break', minDur: 2, maxDur: 20, color: '#888888' },
  { name: 'Study', minDur: 30, maxDur: 150, color: '#6C5CE7' },
  { name: 'Dinner', minDur: 20, maxDur: 60, color: '#FF9F4A' },
  { name: 'Free time', minDur: 15, maxDur: 90, color: '#A8E6CF' },
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
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const generateRandomHistory = (date: Date) => {
  const seed = date.getFullYear() * 366 + date.getMonth() * 31 + date.getDate();
  const rnd = (max: number) => Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * max);

  let currentMinutes = 0;
  const entries = [];
  const maxDayMinutes = 24 * 60;

  const sleepDur = randomDuration(420, 540);
  if (sleepDur <= maxDayMinutes) {
    entries.push({
      time: formatTime(currentMinutes),
      activity: 'Sleep/Rest',
      durationMinutes: sleepDur,
      duration: formatDuration(sleepDur),
    });
    currentMinutes += sleepDur;
  }

  while (currentMinutes < maxDayMinutes - 15) {
    let available = [...ACTIVITIES];
    const lastActivity = entries.length ? entries[entries.length - 1].activity : null;
    if (lastActivity) available = available.filter(a => a.name !== lastActivity);
    const hour = currentMinutes / 60;
    if (hour >= 22 || hour < 6) available = available.filter(a => a.name === 'Sleep/Rest');
    else if (hour >= 12 && hour <= 13) available = available.filter(a => ['Lunch', 'Dinner', 'Break'].includes(a.name) || a.name === 'Break');
    else if (hour >= 19 && hour <= 21) available = available.filter(a => ['Movies', 'Hobby', 'Free time', 'Dinner'].includes(a.name));
    if (available.length === 0) available = [...ACTIVITIES];

    const act = available[rnd(available.length)];
    let duration = randomDuration(act.minDur, act.maxDur);
    if (currentMinutes + duration > maxDayMinutes) duration = maxDayMinutes - currentMinutes;
    if (duration < 1) break;

    entries.push({
      time: formatTime(currentMinutes),
      activity: act.name,
      durationMinutes: duration,
      duration: formatDuration(duration),
    });
    currentMinutes += duration;

    if (currentMinutes < maxDayMinutes - 30 && rnd(100) < 35) {
      const breakDur = randomDuration(2, 15);
      entries.push({
        time: formatTime(currentMinutes),
        activity: 'Break',
        durationMinutes: breakDur,
        duration: formatDuration(breakDur),
      });
      currentMinutes += breakDur;
    }
  }
  return entries.filter(e => e.durationMinutes > 0);
};

export default function HistoryScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'summary'>('history');

  useEffect(() => {
    setHistoryData(generateRandomHistory(currentDate));
  }, [currentDate]);

  const getActivityColor = (activity: string) => {
    const act = ACTIVITIES.find(a => a.name === activity);
    return act ? act.color : '#6C5CE7';
  };

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const goToPrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= new Date()) setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // Height scaling (same as before)
  const BASE_HEIGHT = 40;
  const getRowHeight = (durationMinutes: number) => {
    if (durationMinutes < 10) return BASE_HEIGHT * 0.8;
    else if (durationMinutes < 30) {
      const t = (durationMinutes - 10) / 20;
      const factor = 0.9 + t * 0.5;
      return BASE_HEIGHT * factor;
    } else if (durationMinutes < 60) {
      const t = (durationMinutes - 30) / 30;
      const factor = 1.0 + t * 0.5;
      return BASE_HEIGHT * factor;
    } else if (durationMinutes < 240) {
      const t = (durationMinutes - 60) / 180;
      const factor = 1.0 + t * 1.0;
      return BASE_HEIGHT * factor;
    } else {
      const extraHours = Math.min(4, (durationMinutes - 240) / 120);
      const factor = 6.0 + extraHours;
      return BASE_HEIGHT * factor;
    }
  };
  const getBarHeight = (rowHeight: number) => Math.max(4, rowHeight - 16);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // --- Summary data aggregation ---
  const totalMinutes = historyData.reduce((sum, item) => sum + item.durationMinutes, 0);
  const activityTotals = historyData.reduce((acc, item) => {
    const existing = acc.find(a => a.name === item.activity);
    if (existing) {
      existing.minutes += item.durationMinutes;
    } else {
      acc.push({ name: item.activity, minutes: item.durationMinutes, color: getActivityColor(item.activity) });
    }
    return acc;
  }, [] as { name: string; minutes: number; color: string }[]);
  // Sort by minutes descending
  activityTotals.sort((a, b) => b.minutes - a.minutes);

  // Donut chart data (use top 5-6 activities)
  const donutData = activityTotals.slice(0, 6);
  const otherMinutes = activityTotals.slice(6).reduce((sum, a) => sum + a.minutes, 0);
  if (otherMinutes > 0) {
    donutData.push({ name: 'Other', minutes: otherMinutes, color: '#888888' });
  }

  const donutRadius = 60;
  const donutStrokeWidth = 12;
  const circumference = 2 * Math.PI * donutRadius;
  let cumulativePercent = 0;

  const renderSummary = () => (
    <ScrollView style={styles.list}>
      {/* Period tabs */}
      <View style={styles.periodTabs}>
        {['Today', 'Yesterday', '7 days', '30 days'].map((period, idx) => (
          <TouchableOpacity key={idx} style={styles.periodTab}>
            <Text style={styles.periodTabText}>{period}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Donut chart */}
      <View style={styles.donutContainer}>
        <Svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background circle */}
          <Circle cx="70" cy="70" r={donutRadius} stroke="#1a1a1a" strokeWidth={donutStrokeWidth} fill="none" />
          {/* Data slices */}
          {donutData.map((item, idx) => {
            const percent = (item.minutes / totalMinutes) * 100;
            const dashArray = (percent / 100) * circumference;
            const dashOffset = -cumulativePercent * circumference;
            cumulativePercent += percent / 100;
            return (
              <Circle
                key={idx}
                cx="70" cy="70" r={donutRadius}
                stroke={item.color}
                strokeWidth={donutStrokeWidth}
                fill="none"
                strokeDasharray={`${dashArray} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
            );
          })}
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.totalTime}>{formatDuration(totalMinutes)}</Text>
          <Text style={styles.totalLabel}>tracked</Text>
        </View>
      </View>

      {/* Activity list (like things.tsx summary rows) */}
      {activityTotals.map((item, idx) => {
        const percent = (item.minutes / totalMinutes) * 100;
        return (
          <View key={idx} style={styles.summaryRow}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <View style={styles.summaryInfo}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryTime}>{formatDuration(item.minutes)} / day</Text>
                <Text style={styles.summaryPercent}>{Math.round(percent)}%</Text>
              </View>
              <Text style={styles.summaryName}>{item.name}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          </View>
        );
      })}
      <Text style={styles.dateFooter}>{formatDate(currentDate)}</Text>
    </ScrollView>
  );

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
      {/* Top bar: back button + date with stuck arrows */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={goToPrevDay} style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToToday} style={styles.dateButton}>
            <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            {isToday(currentDate) && <View style={styles.todayDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToNextDay}
            style={[styles.dateArrow, !isToday(currentDate) && styles.disabledArrow]}
            disabled={!isToday(currentDate)}
          >
            <Ionicons name="chevron-forward" size={20} color={isToday(currentDate) ? '#444' : '#fff'} />
          </TouchableOpacity>
        </View>

        <View style={styles.placeholder} />
      </View>

      {/* Main content: either summary or history list */}
      {activeTab === 'summary' ? renderSummary() : renderHistoryList()}

      {/* Bottom navigation tabs */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <TouchableOpacity style={styles.bottomTab} onPress={() => setActiveTab('summary')}>
            <Ionicons name="list-outline" size={18} color={activeTab === 'summary' ? '#fff' : '#888'} />
            <Text style={[styles.bottomTabText, activeTab === 'summary' && { color: '#fff' }]}>Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomTab} onPress={() => setActiveTab('history')}>
            <Ionicons name="time-outline" size={18} color={activeTab === 'history' ? '#fff' : '#888'} />
            <Text style={[styles.bottomTabText, activeTab === 'history' && { color: '#fff' }]}>History</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="share-outline" size={18} color="#4ECDC4" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  backButton: { padding: 4 },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  dateArrow: { paddingHorizontal: 8, paddingVertical: 4 },
  disabledArrow: { opacity: 0.3 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ECDC4' },
  placeholder: { width: 30 },
  list: { flex: 1, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  time: {
    color: '#4ECDC4',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    width: 50,
  },
  bar: { width: 5, borderRadius: 3, marginHorizontal: 4 },
  activity: { color: '#fff', fontSize: 15, flex: 1 },
  duration: { color: '#888', fontSize: 13, fontWeight: '500', width: 70, textAlign: 'right' },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#1a1a1a',
  },
  bottomLeft: { flexDirection: 'row', gap: 20 },
  bottomTab: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bottomTabText: { color: '#666', fontSize: 14 },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exportText: { color: '#4ECDC4', fontSize: 13, fontWeight: '500' },

  // Summary styles (copied from things.tsx)
  periodTabs: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  periodTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1a1a1a' },
  periodTabText: { color: '#888', fontSize: 13 },
  donutContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  totalTime: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  totalLabel: { color: '#888', fontSize: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111' },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  summaryInfo: { flex: 1 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryTime: { color: '#fff', fontSize: 15 },
  summaryName: { color: '#888', fontSize: 12 },
  summaryPercent: { color: '#888', fontSize: 15, fontWeight: '600' },
  progressBarBg: { height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, marginTop: 6 },
  progressBarFill: { height: 4, borderRadius: 2 },
  dateFooter: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 20 },
});
