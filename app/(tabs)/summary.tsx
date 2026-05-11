// app/summary.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

// Activity color map (same as before)
const ACTIVITY_COLORS: Record<string, string> = {
  'Sleep/Rest': '#E8635E',
  'Work': '#96CEB4',
  'University': '#DDA0DD',
  'Hobby': '#4ECDC4',
  'Exercises/Health': '#FF6B6B',
  'Personal development': '#FFEAA7',
  'Movies': '#45B7D1',
  'Meditation': '#96CEB4',
  'Book': '#98D8C8',
  'Walk': '#F7B731',
  'Getting ready': '#FF9F4A',
  'Break': '#888888',
  'Study': '#6C5CE7',
  'Dinner': '#FF9F4A',
  'Free time': '#A8E6CF',
};

// Helper: format minutes to readable string
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// ==================== DATA GENERATORS ====================
// Returns activity list with minutes for a given period
const getActivitiesForPeriod = (period: string) => {
  const data: { name: string; minutes: number; color: string }[] = [];
  const seed = (period + 'summary').length; // just to vary numbers
  switch (period) {
    case 'Today':
      return [
        { name: 'Sleep/Rest', minutes: 480, color: '#E8635E' },
        { name: 'Work', minutes: 270, color: '#96CEB4' },
        { name: 'University', minutes: 195, color: '#DDA0DD' },
        { name: 'Hobby', minutes: 165, color: '#4ECDC4' },
        { name: 'Exercises/Health', minutes: 120, color: '#FF6B6B' },
        { name: 'Personal development', minutes: 90, color: '#FFEAA7' },
        { name: 'Break', minutes: 45, color: '#888888' },
        { name: 'Dinner', minutes: 40, color: '#FF9F4A' },
        { name: 'Free time', minutes: 35, color: '#A8E6CF' },
      ];
    case 'Yesterday':
      return [
        { name: 'Sleep/Rest', minutes: 465, color: '#E8635E' },
        { name: 'Work', minutes: 300, color: '#96CEB4' },
        { name: 'Movies', minutes: 210, color: '#45B7D1' },
        { name: 'Hobby', minutes: 150, color: '#4ECDC4' },
        { name: 'University', minutes: 120, color: '#DDA0DD' },
        { name: 'Meditation', minutes: 60, color: '#96CEB4' },
        { name: 'Break', minutes: 30, color: '#888888' },
        { name: 'Dinner', minutes: 35, color: '#FF9F4A' },
      ];
    case '7 days':
      return [
        { name: 'Sleep/Rest', minutes: 3360, color: '#E8635E' },
        { name: 'Work', minutes: 1680, color: '#96CEB4' },
        { name: 'University', minutes: 1320, color: '#DDA0DD' },
        { name: 'Hobby', minutes: 1080, color: '#4ECDC4' },
        { name: 'Exercises/Health', minutes: 840, color: '#FF6B6B' },
        { name: 'Personal development', minutes: 720, color: '#FFEAA7' },
        { name: 'Break', minutes: 420, color: '#888888' },
        { name: 'Dinner', minutes: 300, color: '#FF9F4A' },
        { name: 'Free time', minutes: 360, color: '#A8E6CF' },
      ];
    case '30 days':
      return [
        { name: 'Sleep/Rest', minutes: 14400, color: '#E8635E' },
        { name: 'Work', minutes: 7200, color: '#96CEB4' },
        { name: 'University', minutes: 5760, color: '#DDA0DD' },
        { name: 'Hobby', minutes: 4680, color: '#4ECDC4' },
        { name: 'Exercises/Health', minutes: 3600, color: '#FF6B6B' },
        { name: 'Personal development', minutes: 3240, color: '#FFEAA7' },
        { name: 'Break', minutes: 1440, color: '#888888' },
        { name: 'Dinner', minutes: 1200, color: '#FF9F4A' },
        { name: 'Free time', minutes: 1680, color: '#A8E6CF' },
      ];
    default:
      return [];
  }
};

// Returns daily totals for line chart
const getDailyTotals = (period: string) => {
  const today = new Date();
  const data: { label: string; totalMinutes: number }[] = [];
  if (period === 'Today') {
    data.push({ label: 'Today', totalMinutes: 1440 });
  } else if (period === 'Yesterday') {
    data.push({ label: 'Yesterday', totalMinutes: 1395 });
  } else if (period === '7 days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      data.push({ label: dayName, totalMinutes: 1200 + Math.floor(Math.random() * 400) });
    }
  } else if (period === '30 days') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      data.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        totalMinutes: 1100 + Math.floor(Math.random() * 500),
      });
    }
  }
  return data;
};

// ==================== CHART COMPONENTS ====================

// Donut Chart
const DonutChart = ({ activities, totalMinutes }: { activities: { name: string; minutes: number; color: string }[]; totalMinutes: number }) => {
  const radius = 70;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <View style={styles.donutWrapper}>
      <Svg width="160" height="160" viewBox="0 0 160 160">
        <Circle cx="80" cy="80" r={radius} stroke="#1a1a1a" strokeWidth={strokeWidth} fill="none" />
        {activities.map((item, idx) => {
          const percent = (item.minutes / totalMinutes) * 100;
          const dashArray = (percent / 100) * circumference;
          const dashOffset = -cumulativePercent * circumference;
          cumulativePercent += percent / 100;
          return (
            <Circle
              key={idx}
              cx="80" cy="80" r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          );
        })}
      </Svg>
      <View style={styles.donutCenterLabel}>
        <Text style={styles.centerTotal}>{formatDuration(totalMinutes)}</Text>
        <Text style={styles.centerSub}>tracked</Text>
      </View>
    </View>
  );
};

// Line Chart (daily totals with vertical lines)
const LineChart = ({ data }: { data: { label: string; totalMinutes: number }[] }) => {
  const chartHeight = 160;
  const chartWidth = screenWidth - 80;
  const maxMinutes = Math.max(...data.map(d => d.totalMinutes), 1);
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;
  const points = data.map((d, i) => ({
    x: 40 + i * stepX,
    y: chartHeight + 30 - (d.totalMinutes / maxMinutes) * chartHeight,
    label: d.label,
    value: d.totalMinutes,
  }));

  return (
    <Svg width={screenWidth - 40} height={chartHeight + 60}>
      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
        const y = chartHeight + 30 - ratio * chartHeight;
        return (
          <Line key={ratio} x1={40} y1={y} x2={screenWidth - 60} y2={y} stroke="#1a1a1a" strokeWidth="1" strokeDasharray="4" />
        );
      })}
      {/* Connecting line */}
      {points.length > 1 && (
        <Line
          x1={points[0].x} y1={points[0].y}
          x2={points[points.length - 1].x} y2={points[points.length - 1].y}
          stroke="#4ECDC4" strokeWidth="2" strokeDasharray="6" opacity={0.4}
        />
      )}
      {/* Points with vertical lines */}
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Line x1={p.x} y1={p.y} x2={p.x} y2={chartHeight + 30} stroke="#4ECDC4" strokeWidth="2" />
          <Circle cx={p.x} cy={p.y} r="5" fill="#4ECDC4" stroke="#000" strokeWidth="2" />
          <SvgText x={p.x} y={chartHeight + 45} fontSize="9" fill="#888" textAnchor="middle">{p.label}</SvgText>
          <SvgText x={p.x} y={p.y - 10} fontSize="8" fill="#4ECDC4" textAnchor="middle">{formatDuration(p.value)}</SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
};

// Animated Bar Chart (each bar = an activity)
const AnimatedBar = ({ x, y, width, height, color, delay }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: height,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [height]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        bottom: 0,
        width,
        height: anim,
        backgroundColor: color,
        borderRadius: 4,
      }}
    />
  );
};

const BarChart = ({ activities }: { activities: { name: string; minutes: number; color: string }[] }) => {
  const maxMinutes = Math.max(...activities.map(a => a.minutes), 1);
  const chartHeight = 180;
  const chartWidth = screenWidth - 100;
  const barCount = activities.length;
  const barTotalWidth = chartWidth * 0.8;
  const barWidth = barTotalWidth / barCount - 10;
  const stepX = chartWidth / barCount;

  return (
    <View style={{ height: chartHeight + 60, marginLeft: 20 }}>
      {/* Y axis labels */}
      <View style={styles.yAxisLabels}>
        {[maxMinutes, maxMinutes * 0.75, maxMinutes * 0.5, maxMinutes * 0.25, 0].map((val, i) => (
          <Text key={i} style={styles.yLabel}>{formatDuration(val)}</Text>
        ))}
      </View>
      {/* Bars container */}
      <View style={styles.barsContainer}>
        {activities.map((act, i) => {
          const barHeight = (act.minutes / maxMinutes) * chartHeight;
          const x = i * stepX + (stepX - barWidth) / 2;
          return (
            <View key={i} style={{ position: 'absolute', left: x, bottom: 0, width: barWidth, height: chartHeight }}>
              <AnimatedBar
                x={0}
                y={chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                color={act.color}
                delay={i * 80}
              />
              <Text style={styles.barLabel} numberOfLines={1}>{act.name.length > 8 ? act.name.slice(0, 7) + '…' : act.name}</Text>
              <Text style={styles.barValue}>{formatDuration(act.minutes)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ==================== MAIN SCREEN ====================
export default function SummaryScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState('Today');
  const [chartType, setChartType] = useState<'donut' | 'line' | 'bar'>('donut');

  const activities = getActivitiesForPeriod(period);
  const totalMinutes = activities.reduce((sum, a) => sum + a.minutes, 0);
  const dailyTotals = getDailyTotals(period);

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Period selectors */}
        <View style={styles.periodRow}>
          {['Today', 'Yesterday', '7 days', '30 days'].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart type selectors */}
        <View style={styles.chartTypeRow}>
          {[
            { key: 'donut', icon: 'pie-chart', label: 'Donut' },
            { key: 'line', icon: 'trending-up', label: 'Line' },
            { key: 'bar', icon: 'stats-chart', label: 'Bar' },
          ].map(({ key, icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chartTypeBtn, chartType === key && styles.chartTypeBtnActive]}
              onPress={() => setChartType(key as any)}
            >
              <Ionicons name={icon} size={18} color={chartType === key ? '#4ECDC4' : '#888'} />
              <Text style={[styles.chartTypeText, chartType === key && { color: '#4ECDC4' }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {chartType === 'donut' && (
            <DonutChart activities={activities} totalMinutes={totalMinutes} />
          )}
          {chartType === 'line' && (
            <LineChart data={dailyTotals} />
          )}
          {chartType === 'bar' && (
            <BarChart activities={activities} key={period} />
          )}
        </View>

        {/* Activity breakdown list (progress bars) */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Activity Breakdown</Text>
          {activities.map((act, idx) => {
            const percent = ((act.minutes / totalMinutes) * 100).toFixed(0);
            return (
              <View key={idx} style={styles.listRow}>
                <View style={[styles.dot, { backgroundColor: act.color }]} />
                <View style={styles.listInfo}>
                  <View style={styles.listTop}>
                    <Text style={styles.listName}>{act.name}</Text>
                    <Text style={styles.listPercent}>{percent}%</Text>
                  </View>
                  <Text style={styles.listTime}>{formatDuration(act.minutes)}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: act.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  scrollContent: { flex: 1 },

  periodRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  periodTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18,
    backgroundColor: '#1a1a1a',
  },
  periodTabActive: { backgroundColor: '#4ECDC4' },
  periodText: { color: '#888', fontSize: 13 },
  periodTextActive: { color: '#000', fontWeight: '600' },

  chartTypeRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16, gap: 16 },
  chartTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  chartTypeBtnActive: { backgroundColor: '#4ECDC420', borderWidth: 1, borderColor: '#4ECDC4' },
  chartTypeText: { color: '#888', fontSize: 14 },

  chartArea: { alignItems: 'center', marginBottom: 20 },

  // Donut
  donutWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  donutCenterLabel: { position: 'absolute', alignItems: 'center' },
  centerTotal: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  centerSub: { color: '#888', fontSize: 12 },

  // Bar chart
  yAxisLabels: {
    position: 'absolute', left: -25, top: 0, bottom: 60,
    justifyContent: 'space-between',
  },
  yLabel: { color: '#555', fontSize: 10 },
  barsContainer: {
    flex: 1, marginLeft: 10, marginBottom: 20,
  },
  barLabel: {
    position: 'absolute', bottom: -18, left: 0, right: 0,
    textAlign: 'center', color: '#888', fontSize: 9,
  },
  barValue: {
    position: 'absolute', top: -14, left: 0, right: 0,
    textAlign: 'center', color: '#fff', fontSize: 9, fontWeight: '600',
  },

  // Activity list
  listSection: { paddingHorizontal: 16, marginTop: 10 },
  listTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  listRow: { flexDirection: 'row', marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  listInfo: { flex: 1 },
  listTop: { flexDirection: 'row', justifyContent: 'space-between' },
  listName: { color: '#fff', fontSize: 14 },
  listPercent: { color: '#888', fontSize: 14 },
  listTime: { color: '#aaa', fontSize: 12, marginTop: 2 },
  progressBarBg: { height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, marginTop: 6 },
  progressBar: { height: 4, borderRadius: 2 },
});
