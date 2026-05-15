// app/summary.tsx – bottom bar raised slightly to avoid system navigation bar
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

const { width: screenWidth } = Dimensions.get("window");

// Activity colors (same as before)
const ACTIVITY_COLORS: Record<string, string> = {
  "Sleep/Rest": "#E8635E",
  Work: "#96CEB4",
  University: "#DDA0DD",
  Hobby: "#4ECDC4",
  "Exercises/Health": "#FF6B6B",
  "Personal development": "#FFEAA7",
  Movies: "#45B7D1",
  Meditation: "#96CEB4",
  Book: "#98D8C8",
  Walk: "#F7B731",
  "Getting ready": "#FF9F4A",
  Break: "#888888",
  Study: "#6C5CE7",
  Dinner: "#FF9F4A",
  "Free time": "#A8E6CF",
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

// Mock data generators (unchanged)
const getActivitiesForPeriod = (period: string) => {
  switch (period) {
    case "Today":
      return [
        { name: "Sleep/Rest", minutes: 480 },
        { name: "Work", minutes: 270 },
        { name: "University", minutes: 195 },
        { name: "Hobby", minutes: 165 },
        { name: "Exercises/Health", minutes: 120 },
        { name: "Personal development", minutes: 90 },
        { name: "Break", minutes: 45 },
        { name: "Dinner", minutes: 40 },
        { name: "Free time", minutes: 35 },
      ];
    case "Yesterday":
      return [
        { name: "Sleep/Rest", minutes: 465 },
        { name: "Work", minutes: 300 },
        { name: "Movies", minutes: 210 },
        { name: "Hobby", minutes: 150 },
        { name: "University", minutes: 120 },
        { name: "Meditation", minutes: 60 },
        { name: "Break", minutes: 30 },
        { name: "Dinner", minutes: 35 },
      ];
    case "7 days":
      return [
        { name: "Sleep/Rest", minutes: 3360 },
        { name: "Work", minutes: 1680 },
        { name: "University", minutes: 1320 },
        { name: "Hobby", minutes: 1080 },
        { name: "Exercises/Health", minutes: 840 },
        { name: "Personal development", minutes: 720 },
        { name: "Break", minutes: 420 },
        { name: "Dinner", minutes: 300 },
        { name: "Free time", minutes: 360 },
      ];
    case "30 days":
      return [
        { name: "Sleep/Rest", minutes: 14400 },
        { name: "Work", minutes: 7200 },
        { name: "University", minutes: 5760 },
        { name: "Hobby", minutes: 4680 },
        { name: "Exercises/Health", minutes: 3600 },
        { name: "Personal development", minutes: 3240 },
        { name: "Break", minutes: 1440 },
        { name: "Dinner", minutes: 1200 },
        { name: "Free time", minutes: 1680 },
      ];
    default:
      return [];
  }
};

const getPreviousPeriodTotal = (
  period: string,
  currentTotal: number,
): number => {
  if (period === "Today") {
    const yesterday = getActivitiesForPeriod("Yesterday");
    return yesterday.reduce((s, a) => s + a.minutes, 0);
  }
  if (period === "Yesterday") {
    const today = getActivitiesForPeriod("Today");
    return today.reduce((s, a) => s + a.minutes, 0);
  }
  if (period === "7 days") return currentTotal * 0.92;
  if (period === "30 days") return currentTotal * 0.95;
  return 0;
};

const getDateRange = (period: string): string => {
  const today = new Date();
  const formatDate = (date: Date) =>
    `${date.getDate()} ${date.toLocaleString("default", { month: "short" })}`;
  if (period === "Today") return formatDate(today);
  if (period === "Yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return formatDate(yesterday);
  }
  if (period === "7 days") {
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  if (period === "30 days") {
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  return "";
};

// Donut Chart – slightly larger (size = screenWidth * 0.52)
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
  }, [fadeAnim]);

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

// Activity item – no background
const ActivityItem = ({
  activity,
  totalMinutes,
}: {
  activity: { name: string; minutes: number };
  totalMinutes: number;
}) => {
  const color = ACTIVITY_COLORS[activity.name] || "#888888";
  const percent = ((activity.minutes / totalMinutes) * 100).toFixed(1);
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

  const activities = getActivitiesForPeriod(period);
  const totalMinutes = activities.reduce((sum, a) => sum + a.minutes, 0);
  const previousTotal = getPreviousPeriodTotal(period, totalMinutes);
  const percentChange = ((totalMinutes - previousTotal) / previousTotal) * 100;
  const dateRange = getDateRange(period);

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
            {period === "Today" ? "day" : period}
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
      </ScrollView>

      {/* Bottom bar – raised slightly (bottom: 12) */}
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
    paddingBottom: 100, // increased to give space above raised bottom bar
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30, // adds space at the top
    marginBottom: 20, // keep bottom spacing as before
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
    bottom: 12, // raised from bottom edge
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
});
