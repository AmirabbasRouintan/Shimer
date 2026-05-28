// app/summary.tsx – fully fixed: bars aligned to the right, no overflow, static header
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
import Svg, { Circle, Line, Rect, Text as SvgText } from "react-native-svg";
import { shadcn } from "../../constants/components-theme";

const { width: screenWidth } = Dimensions.get("window");

// Original activity color map (vibrant)
const ACTIVITY_COLORS: Record<string, string> = {
  "Sleep/Rest": "#E8635E",
  Work: "#96CEB4",
  University: "#DDA0DD",
  Hobby: "#fff",
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
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const formatHours = (minutes: number): string =>
  (minutes / 60).toFixed(1) + "h";

const getPercentChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return (current - previous) / previous * 100;
};

// Data generators
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

const getDailyTotals = (
  period: string,
): { label: string; totalMinutes: number }[] => {
  const today = new Date();
  const data: { label: string; totalMinutes: number }[] = [];

  if (period === "Today") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        d.getDay()
      ];
      const base = 1200;
      const variation = Math.sin(i * 0.5) * 150;
      data.push({
        label: dayName,
        totalMinutes: Math.max(600, base + variation),
      });
    }
  } else if (period === "Yesterday") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i - 1);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        d.getDay()
      ];
      const base = 1150;
      const variation = Math.sin(i * 0.6) * 180;
      data.push({
        label: dayName,
        totalMinutes: Math.max(600, base + variation),
      });
    }
  } else if (period === "7 days") {
    const activities = getActivitiesForPeriod("7 days");
    const totalWeek = activities.reduce((s, a) => s + a.minutes, 0);
    const avgDay = totalWeek / 7;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        d.getDay()
      ];
      const variation = (Math.sin(i * 0.8) + 0.5) * 0.4 * avgDay;
      data.push({
        label: dayName,
        totalMinutes: Math.max(300, avgDay + variation),
      });
    }
  } else if (period === "30 days") {
    const activities = getActivitiesForPeriod("30 days");
    const totalMonth = activities.reduce((s, a) => s + a.minutes, 0);
    const avgDay = totalMonth / 30;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const variation = (Math.sin(i * 0.3) + 0.5) * 0.3 * avgDay;
      data.push({ label, totalMinutes: Math.max(300, avgDay + variation) });
    }
  }
  return data;
};

const getDailyActivityBreakdown = (
  period: string,
  dayIndex: number,
  totalMinutes: number,
): { name: string; minutes: number }[] => {
  const baseActivities = getActivitiesForPeriod(
    period === "Today" || period === "Yesterday" ? period : "7 days",
  );
  let breakdown = baseActivities
    .map(act => ({
      name: act.name,
      minutes: Math.max(
        10,
        act.minutes / (period === "7 days" ? 7 : 30) +
          (Math.random() * 40 - 20),
      ),
    }))
    .filter(a => a.minutes > 0);

  const sum = breakdown.reduce((s, a) => s + a.minutes, 0);
  if (sum > 0) {
    breakdown = breakdown.map(a => ({
      ...a,
      minutes: a.minutes / sum * totalMinutes,
    }));
  }
  return breakdown.sort((a, b) => b.minutes - a.minutes);
};

// Stacked Bar Chart – properly shifted right, no overlap with hour labels
const DailyBarChart = ({ period }: { period: string }) => {
  const dailyData = getDailyTotals(period);
  const chartHeight = 150;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(
    () => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    },
    [period],
  );

  const displayData =
    period === "30 days" ? dailyData.filter((_, i) => i % 3 === 0) : dailyData;
  const barCount = displayData.length;
  // Increased left margin to push bars far enough right
  const leftMargin = 60;
  const rightMargin = 20;
  const chartWidth = screenWidth - 36 - leftMargin - rightMargin;
  const barWidth = Math.min(28, chartWidth / barCount - 6);
  const stepX = chartWidth / barCount;

  const dailyBreakdowns = displayData.map((day, idx) =>
    getDailyActivityBreakdown(period, idx, day.totalMinutes),
  );

  const getBarHeight = (minutes: number) => minutes / (24 * 60) * chartHeight;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Svg width={screenWidth - 36} height={chartHeight + 40}>
        {/* Grid lines and hour labels – placed left of the drawing area */}
        {[0, 6, 12, 18, 24].map(hour => {
          const y = chartHeight - hour / 24 * chartHeight;
          const x1 = leftMargin;
          const x2 = leftMargin + chartWidth;
          return (
            <React.Fragment key={hour}>
              <Line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={shadcn.colors.border}
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <SvgText
                x={leftMargin - 15}
                y={y + 3}
                fontSize="9"
                fill={shadcn.colors.mutedForeground}
                textAnchor="end"
              >
                {hour}h
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Stacked bars – now starting well to the right */}
        {displayData.map((day, dayIdx) => {
          const breakdown = dailyBreakdowns[dayIdx];
          if (!breakdown.length) return null;

          const centerX = leftMargin + dayIdx * stepX;
          const x = centerX - barWidth / 2;
          let currentBottomY = chartHeight;

          return breakdown.map((item, segIdx) => {
            const color = ACTIVITY_COLORS[item.name] || "#888888";
            const height = getBarHeight(item.minutes);
            const y = currentBottomY - height;
            currentBottomY = y;

            const isBottomSegment = segIdx === 0;
            const isTopSegment = segIdx === breakdown.length - 1;

            let rxTopLeft = 0,
              rxTopRight = 0,
              rxBottomLeft = 0,
              rxBottomRight = 0;
            if (isTopSegment) {
              rxTopLeft = 4;
              rxTopRight = 4;
            }
            if (isBottomSegment) {
              rxBottomLeft = 4;
              rxBottomRight = 4;
            }

            return (
              <Rect
                key={`${dayIdx}-${segIdx}`}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={color}
                opacity={0.85}
                rxTopLeft={rxTopLeft}
                rxTopRight={rxTopRight}
                rxBottomLeft={rxBottomLeft}
                rxBottomRight={rxBottomRight}
              />
            );
          });
        })}

        {/* X-axis labels – centered below each bar */}
        {displayData.map((day, i) => {
          const centerX = leftMargin + i * stepX;
          return (
            <SvgText
              key={i}
              x={centerX}
              y={chartHeight + 18}
              fontSize="9"
              fill={shadcn.colors.mutedForeground}
              textAnchor="middle"
            >
              {day.label.length > 4 ? day.label.slice(0, 3) : day.label}
            </SvgText>
          );
        })}
      </Svg>
    </Animated.View>
  );
};

// Donut Chart
const DonutChart = ({
  activities,
  totalMinutes,
}: {
  activities: { name: string; minutes: number }[];
  totalMinutes: number;
}) => {
  const radius = 65;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const [animatedValues] = useState(
    activities.map(() => new Animated.Value(0)),
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.stagger(
        40,
        animatedValues.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }),
        ),
      ),
    ]).start();
  }, []);

  let cumulativePercent = 0;

  return (
    <Animated.View style={[styles.donutWrapper, { opacity: fadeAnim }]}>
      <Svg width="150" height="150" viewBox="0 0 150 150">
        <Circle
          cx="75"
          cy="75"
          r={radius}
          stroke={shadcn.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {activities.map((item, idx) => {
          const color = ACTIVITY_COLORS[item.name] || "#888888";
          const percent = item.minutes / totalMinutes * 100;
          const dashArray = percent / 100 * circumference;
          const dashOffset = -cumulativePercent * circumference;
          cumulativePercent += percent / 100;
          return (
            <Circle
              key={idx}
              cx="75"
              cy="75"
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 75 75)"
              opacity={0.9}
            />
          );
        })}
      </Svg>
      <View style={styles.donutCenterLabel}>
        <Text style={styles.centerTotal}>
          {formatHours(totalMinutes)}
        </Text>
        <Text style={styles.centerSub}>tracked</Text>
      </View>
    </Animated.View>
  );
};

// Activity Row
const ActivityRow = ({
  activity,
  totalMinutes,
  index,
}: {
  activity: { name: string; minutes: number };
  totalMinutes: number;
  index: number;
}) => {
  const color = ACTIVITY_COLORS[activity.name] || "#888888";
  const percent = (activity.minutes / totalMinutes * 100).toFixed(1);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const trend = Math.round((Math.random() * 30 - 15) * 10) / 10;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 30,
        useNativeDriver: true,
      }),
      Animated.spring(progressAnim, {
        toValue: parseFloat(percent),
        delay: index * 30,
        useNativeDriver: false,
        tension: 40,
        friction: 8,
      }),
    ]).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[styles.listRow, { opacity: fadeAnim }]}>
      <View style={[styles.colorBadge, { backgroundColor: color }]} />
      <View style={styles.listInfo}>
        <View style={styles.listTop}>
          <Text style={styles.listName}>
            {activity.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.listPercent}>
              {percent}%
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name={trend >= 0 ? "trending-up" : "trending-down"}
                size={12}
                color={
                  trend >= 0
                    ? shadcn.colors.successForeground
                    : shadcn.colors.destructiveForeground
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      trend >= 0
                        ? shadcn.colors.successForeground
                        : shadcn.colors.destructiveForeground,
                  },
                ]}
              >
                {Math.abs(trend)}%
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.listTime}>
          {formatDuration(activity.minutes)}
        </Text>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

// Main Screen – static header, no Details button
export default function SummaryScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState("Today");

  const activities = getActivitiesForPeriod(period);
  const totalMinutes = activities.reduce((sum, a) => sum + a.minutes, 0);
  const previousTotal = getPreviousPeriodTotal(period, totalMinutes);
  const percentChange = getPercentChange(totalMinutes, previousTotal);
  const avgPerDay =
    period === "7 days"
      ? totalMinutes / 7
      : period === "30 days" ? totalMinutes / 30 : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Static Header – no Details button */}
      <View style={styles.staticHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={shadcn.colors.foreground}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Summary</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {["Today", "Yesterday", "7d", "30d"].map(p => {
            const full = p === "7d" ? "7 days" : p === "30d" ? "30 days" : p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodChip,
                  period === full && styles.periodChipActive,
                ]}
                onPress={() => setPeriod(full)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodText,
                    period === full && styles.periodTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons
              name="time-outline"
              size={18}
              color={shadcn.colors.mutedForeground}
            />
            <Text style={styles.statValue}>
              {formatHours(totalMinutes)}
            </Text>
            <Text style={styles.statLabel}>Total tracked</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="list-outline"
              size={18}
              color={shadcn.colors.mutedForeground}
            />
            <Text style={styles.statValue}>
              {activities.length}
            </Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          {avgPerDay
            ? <View style={styles.statCard}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={shadcn.colors.mutedForeground}
                />
                <Text style={styles.statValue}>
                  {formatHours(avgPerDay)}
                </Text>
                <Text style={styles.statLabel}>Daily avg</Text>
              </View>
            : <View style={styles.statCard}>
                <Ionicons
                  name="trending-up-outline"
                  size={18}
                  color={shadcn.colors.mutedForeground}
                />
                <Text style={styles.statValue}>
                  {(totalMinutes / 1440 * 100).toFixed(0)}%
                </Text>
                <Text style={styles.statLabel}>Day used</Text>
              </View>}
        </View>

        {/* Comparison Card */}
        <View style={styles.comparisonCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name={percentChange >= 0 ? "arrow-up" : "arrow-down"}
              size={16}
              color={
                percentChange >= 0
                  ? shadcn.colors.successForeground
                  : shadcn.colors.destructiveForeground
              }
            />
            <Text style={styles.comparisonText}>
              {percentChange >= 0 ? "+" : ""}
              {percentChange.toFixed(1)}% vs previous{" "}
              {period === "Today"
                ? "day"
                : period === "Yesterday" ? "day" : period}
            </Text>
          </View>
          <Text style={styles.comparisonSubtext}>
            {formatDuration(previousTotal)} → {formatDuration(totalMinutes)}
          </Text>
        </View>

        {/* Distribution Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Distribution</Text>
          <DonutChart activities={activities} totalMinutes={totalMinutes} />
          <View style={{ width: "100%", marginTop: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.legendContentContainer}
            >
              {activities.map((act, idx) =>
                <View key={idx} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: ACTIVITY_COLORS[act.name] || "#888" },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {act.name}
                  </Text>
                </View>,
              )}
            </ScrollView>
          </View>
        </View>

        {/* Daily Overview – properly aligned stacked bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>
            {period === "Today" || period === "Yesterday"
              ? "Last 7 days"
              : "Daily overview"}
          </Text>
          <DailyBarChart period={period} />
          <Text style={styles.chartFootnote}>
            Each bar shows activity breakdown by color
          </Text>
        </View>

        {/* Activity Breakdown */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Breakdown</Text>
          {activities.map((act, idx) =>
            <ActivityRow
              key={idx}
              activity={act}
              totalMinutes={totalMinutes}
              index={idx}
            />,
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  staticHeader: {
    backgroundColor: "rgba(0,0,0,0.95)",
    borderBottomWidth: 0.5,
    borderBottomColor: shadcn.colors.border,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: shadcn.colors.secondary,
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    paddingTop: 16,
  },
  periodContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 18,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: shadcn.colors.secondary,
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
  },
  periodChipActive: {
    backgroundColor: shadcn.colors.primary,
    borderColor: shadcn.colors.primary,
  },
  periodText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    fontWeight: "500",
  },
  periodTextActive: {
    color: shadcn.colors.primaryForeground,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: shadcn.colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
  },
  statValue: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    color: shadcn.colors.mutedForeground,
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
  comparisonCard: {
    backgroundColor: shadcn.colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
  },
  comparisonText: {
    color: shadcn.colors.foreground,
    fontSize: 13,
    fontWeight: "500",
  },
  comparisonSubtext: {
    color: shadcn.colors.mutedForeground,
    fontSize: 12,
  },
  chartCard: {
    backgroundColor: shadcn.colors.card,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
    marginBottom: 18,
  },
  sectionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 14,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  chartFootnote: {
    color: shadcn.colors.mutedForeground,
    fontSize: 10,
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
  },
  donutWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  donutCenterLabel: {
    position: "absolute",
    alignItems: "center",
  },
  centerTotal: {
    color: shadcn.colors.foreground,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
  },
  centerSub: {
    color: shadcn.colors.mutedForeground,
    fontSize: 11,
    marginTop: 2,
  },
  legendContentContainer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: shadcn.colors.secondary,
    borderRadius: 14,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: shadcn.colors.foreground,
    fontSize: 10,
    fontWeight: "500",
  },
  listSection: {
    marginTop: 4,
  },
  listRow: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: shadcn.colors.card,
    borderRadius: 14,
    padding: 10,
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
    alignItems: "center",
  },
  colorBadge: {
    width: 6,
    height: 32,
    borderRadius: 3,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  listName: {
    color: shadcn.colors.foreground,
    fontSize: 14,
    fontWeight: "500",
  },
  listPercent: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    fontWeight: "500",
  },
  trendText: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 2,
  },
  listTime: {
    color: shadcn.colors.mutedForeground,
    fontSize: 12,
    marginBottom: 6,
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
});

function getPreviousPeriodTotal(period: string, currentTotal: number): number {
  if (period === "Today") {
    const yesterday = getActivitiesForPeriod("Yesterday");
    return yesterday.reduce((s, a) => s + a.minutes, 0);
  }
  if (period === "Yesterday") {
    const today = getActivitiesForPeriod("Today");
    return today.reduce((s, a) => s + a.minutes, 0);
  }
  if (period === "7 days") {
    return currentTotal * 0.92;
  }
  if (period === "30 days") {
    return currentTotal * 0.95;
  }
  return 0;
}
