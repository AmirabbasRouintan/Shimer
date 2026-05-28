// app/summary.tsx – using real history data (FIXED)
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { shadcn } from "../../constants/components-theme";
import { getHistoryLogs, HistoryLog } from "../activitiesStore";

const { width: screenWidth } = Dimensions.get("window");

// Activity colors mapping
const ACTIVITY_COLORS: Record<string, string> = {
  "Sleep/Rest": "#E8635E",
  "Work": "#96CEB4",
  "University": "#DDA0DD",
  "Hobby": "#fff",
  "Exercises/Health": "#FF6B6B",
  "Personal development": "#FFEAA7",
  "Movies": "#45B7D1",
  "Meditation": "#96CEB4",
  "Book": "#98D8C8",
  "Walk": "#F7B731",
  "Getting ready": "#FF9F4A",
  "Break": "#888888",
  "Study": "#6C5CE7",
  "Dinner": "#FF9F4A",
  "Free time": "#A8E6CF",
  "Other": "#6C5CE7",
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const formatHours = (minutes: number): string =>
  (minutes / 60).toFixed(1) + "h";

// Get activities from history logs for a specific date range
const getActivitiesFromHistory = (logs: HistoryLog[]): { name: string; minutes: number }[] => {
  const activityMap: Record<string, number> = {};

  logs.forEach(log => {
    if (log.type === 'activity') {
      const minutes = log.durationMinutes;
      if (activityMap[log.title]) {
        activityMap[log.title] += minutes;
      } else {
        activityMap[log.title] = minutes;
      }
    }
  });

  // Convert to array and sort by minutes (descending)
  return Object.entries(activityMap)
    .map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
};

// Get date range string
const getDateRange = (period: string, referenceDate: Date): string => {
  const formatDate = (date: Date) =>
    `${date.getDate()} ${date.toLocaleString("default", { month: "short" })}`;

  if (period === "Today") return formatDate(referenceDate);
  if (period === "Yesterday") {
    const yesterday = new Date(referenceDate);
    yesterday.setDate(referenceDate.getDate() - 1);
    return formatDate(yesterday);
  }
  if (period === "7 days") {
    const end = new Date(referenceDate);
    const start = new Date(referenceDate);
    start.setDate(referenceDate.getDate() - 6);
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  if (period === "30 days") {
    const end = new Date(referenceDate);
    const start = new Date(referenceDate);
    start.setDate(referenceDate.getDate() - 29);
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  return "";
};

// Filter logs by period
const filterLogsByPeriod = (logs: HistoryLog[], period: string, referenceDate: Date): HistoryLog[] => {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const monthAgo = new Date(today);
  monthAgo.setDate(today.getDate() - 29);
  monthAgo.setHours(0, 0, 0, 0);

  return logs.filter(log => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    const logTime = logDate.getTime();

    switch (period) {
      case "Today":
        return logTime === today.getTime();
      case "Yesterday":
        return logTime === yesterday.getTime();
      case "7 days":
        return logTime >= weekAgo.getTime() && logTime <= today.getTime();
      case "30 days":
        return logTime >= monthAgo.getTime() && logTime <= today.getTime();
      default:
        return true;
    }
  });
};

// Calculate total minutes from logs
const calculateTotalMinutes = (logs: HistoryLog[]): number => {
  return logs.reduce((sum, log) => sum + log.durationMinutes, 0);
};

// Calculate total for previous period
const getPreviousPeriodTotal = (period: string, allLogs: HistoryLog[], referenceDate: Date): number => {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  if (period === "Today") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayLogs = filterLogsByPeriod(allLogs, "Yesterday", yesterday);
    return calculateTotalMinutes(yesterdayLogs);
  }
  if (period === "Yesterday") {
    const todayLogs = filterLogsByPeriod(allLogs, "Today", referenceDate);
    return calculateTotalMinutes(todayLogs);
  }
  if (period === "7 days") {
    const prevWeekStart = new Date(today);
    prevWeekStart.setDate(today.getDate() - 13);
    const prevWeekEnd = new Date(today);
    prevWeekEnd.setDate(today.getDate() - 7);
    const prevWeekLogs = allLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      const logTime = logDate.getTime();
      return logTime >= prevWeekStart.getTime() && logTime < prevWeekEnd.getTime();
    });
    return calculateTotalMinutes(prevWeekLogs);
  }
  if (period === "30 days") {
    const prevMonthStart = new Date(today);
    prevMonthStart.setDate(today.getDate() - 59);
    const prevMonthEnd = new Date(today);
    prevMonthEnd.setDate(today.getDate() - 29);
    const prevMonthLogs = allLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      const logTime = logDate.getTime();
      return logTime >= prevMonthStart.getTime() && logTime < prevMonthEnd.getTime();
    });
    return calculateTotalMinutes(prevMonthLogs);
  }
  return 0;
};

// Donut Chart
const DonutChart = ({
  activities,
  totalMinutes,
}: {
  activities: { name: string; minutes: number }[];
  totalMinutes: number;
}) => {
  const size = screenWidth * 0.65;
  const radius = size / 2;
  const innerRadius = radius * 0.6;
  const center = radius;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, activities]);

  // Don't render if no data
  if (totalMinutes === 0 || activities.length === 0) {
    return (
      <View style={styles.noDataChart}>
        <Text style={styles.noDataChartText}>No data for this period</Text>
      </View>
    );
  }

  let startAngle = -Math.PI / 2;
  const slices: { path: string; color: string }[] = [];

  activities.forEach((item) => {
    const angle = (item.minutes / totalMinutes) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const largeArc = angle > Math.PI ? 1 : 0;

    const x1Outer = center + radius * Math.cos(startAngle);
    const y1Outer = center + radius * Math.sin(startAngle);
    const x2Outer = center + radius * Math.cos(endAngle);
    const y2Outer = center + radius * Math.sin(endAngle);
    const x1Inner = center + innerRadius * Math.cos(startAngle);
    const y1Inner = center + innerRadius * Math.sin(startAngle);
    const x2Inner = center + innerRadius * Math.cos(endAngle);
    const y2Inner = center + innerRadius * Math.sin(endAngle);

    const pathString = `
      M ${x1Outer} ${y1Outer}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
      L ${x2Inner} ${y2Inner}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}
      Z
    `;
    slices.push({
      path: pathString,
      color: ACTIVITY_COLORS[item.name] || "#888888",
    });
    startAngle = endAngle;
  });

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {slices.map((slice, idx) => (
            <Path
              key={idx}
              d={slice.path}
              fill={slice.color}
              stroke={shadcn.colors.background}
              strokeWidth={1.5}
            />
          ))}
        </G>
      </Svg>
      <View style={styles.donutCenterLabel}>
        <Text style={styles.centerTotal}>{formatHours(totalMinutes)}</Text>
        <Text style={styles.centerSub}>tracked</Text>
      </View>
    </Animated.View>
  );
};

// Activity item
const ActivityItem = ({
  activity,
  totalMinutes,
}: {
  activity: { name: string; minutes: number };
  totalMinutes: number;
}) => {
  const color = ACTIVITY_COLORS[activity.name] || "#888888";
  const percent = totalMinutes > 0 ? ((activity.minutes / totalMinutes) * 100).toFixed(1) : "0";
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityHeader}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={styles.activityName}>{activity.name}</Text>
      </View>
      <View style={styles.activityRow}>
        <Text style={styles.activityTime}>
          {formatDuration(activity.minutes)}
        </Text>
        <Text style={styles.activityPercent}>{percent}%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${parseFloat(percent)}%` as const,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

export default function SummaryScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState("Today");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);

  // Load history logs
  const loadHistory = useCallback(() => {
    const allLogs = getHistoryLogs();
    console.log("Total history logs:", allLogs.length);
    setHistoryLogs(allLogs);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // Filter logs based on selected period
  const filteredLogs = filterLogsByPeriod(historyLogs, period, currentDate);
  const activities = getActivitiesFromHistory(filteredLogs);
  const totalMinutes = calculateTotalMinutes(filteredLogs);
  const previousTotal = getPreviousPeriodTotal(period, historyLogs, currentDate);
  const percentChange = previousTotal === 0 ? 0 : ((totalMinutes - previousTotal) / previousTotal) * 100;
  const dateRange = getDateRange(period, currentDate);

  // Debug logging
  console.log(`Period: ${period}, Total minutes: ${totalMinutes}, Activities: ${activities.length}`);

  // If no data, show empty state
  const hasData = activities.length > 0 && totalMinutes > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chartWrapper}>
          <DonutChart activities={activities} totalMinutes={totalMinutes} />
        </View>

        {hasData ? (
          <>
            <View style={styles.trendContainer}>
              <Ionicons
                name={percentChange >= 0 ? "trending-up" : "trending-down"}
                size={14}
                color={
                  percentChange >= 0
                    ? shadcn.colors.successForeground
                    : shadcn.colors.destructiveForeground
                }
              />
              <Text style={styles.trendText}>
                {percentChange >= 0 ? "+" : ""}
                {percentChange.toFixed(1)}% vs previous{" "}
                {period === "Today" ? "day" : period === "Yesterday" ? "day" : period}
              </Text>
            </View>
            <Text style={styles.footerNote}>
              {formatDuration(totalMinutes)} across {activities.length} activities
            </Text>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Breakdown</Text>
            </View>
            <View style={styles.gridContainer}>
              {activities.map((act, idx) => (
                <ActivityItem
                  key={idx}
                  activity={act}
                  totalMinutes={totalMinutes}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptyText}>
              Complete some activities or add history entries to see your summary.
            </Text>
            <TouchableOpacity
              style={styles.goToHistoryButton}
              onPress={() => router.push("/history")}
            >
              <Text style={styles.goToHistoryText}>Go to History →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarRow}>
          <View style={{ width: 40 }} />
          <View style={styles.periodWrapper}>
            <View style={styles.periodRow}>
              {["Today", "Yesterday", "7 days", "30 days"].map((p) => (
                <TouchableOpacity key={p} onPress={() => setPeriod(p)}>
                  <Text
                    style={[
                      styles.periodText,
                      period === p && styles.periodTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.rangeContainer}>
              <Text style={styles.rangeText}>{dateRange}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/things")}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-forward"
              size={22}
              color={shadcn.colors.foreground}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: shadcn.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    paddingBottom: 100,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  donutCenterLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  centerTotal: {
    color: shadcn.colors.foreground,
    fontSize: 24,
    fontWeight: "800",
  },
  centerSub: {
    color: shadcn.colors.mutedForeground,
    fontSize: 9,
    marginTop: 2,
  },
  noDataChart: {
    width: screenWidth * 0.65,
    height: screenWidth * 0.65,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: shadcn.colors.card,
    borderRadius: screenWidth * 0.325,
  },
  noDataChartText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 6,
  },
  trendText: {
    color: shadcn.colors.foreground,
    fontSize: 13,
    fontWeight: "500",
  },
  footerNote: {
    color: shadcn.colors.mutedForeground,
    fontSize: 11,
    textAlign: "center",
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  activityItem: {
    width: (screenWidth - 32 - 12) / 2,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activityName: {
    color: shadcn.colors.foreground,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  activityTime: {
    color: shadcn.colors.foreground,
    fontSize: 15,
    fontWeight: "700",
  },
  activityPercent: {
    color: shadcn.colors.mutedForeground,
    fontSize: 12,
    fontWeight: "500",
  },
  progressBarBg: {
    height: 3,
    backgroundColor: shadcn.colors.secondary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    backgroundColor: shadcn.colors.background,
    borderTopWidth: 0.5,
    borderTopColor: shadcn.colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  bottomBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: shadcn.colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
  },
  periodWrapper: {
    flex: 1,
    alignItems: "center",
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 4,
  },
  periodText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 2,
  },
  periodTextActive: {
    color: shadcn.colors.foreground,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: shadcn.colors.primary,
  },
  rangeContainer: {
    alignItems: "center",
  },
  rangeText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 11,
    backgroundColor: shadcn.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  goToHistoryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: shadcn.colors.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
  },
  goToHistoryText: {
    color: shadcn.colors.foreground,
    fontSize: 15,
    fontWeight: "500",
  },
});
