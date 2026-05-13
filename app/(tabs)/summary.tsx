// app/summary.tsx – minimal, compact, with Things button
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar
} from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { shadcn } from "../../constants/components-theme";

const { width: screenWidth } = Dimensions.get("window");

// Activity color map (compact version)
const ACTIVITY_COLORS: Record<string, { solid: string; gradient: string[] }> = {
  "Sleep/Rest": { solid: "#E8635E", gradient: ["#E8635E", "#D84A45"] },
  Work: { solid: "#96CEB4", gradient: ["#96CEB4", "#7AB89A"] },
  University: { solid: "#DDA0DD", gradient: ["#DDA0DD", "#C77BC7"] },
  Hobby: { solid: "#4ECDC4", gradient: ["#4ECDC4", "#3AB5AC"] },
  "Exercises/Health": { solid: "#FF6B6B", gradient: ["#FF6B6B", "#E85555"] },
  "Personal development": { solid: "#FFEAA7", gradient: ["#FFEAA7", "#FFD97D"] },
  Movies: { solid: "#45B7D1", gradient: ["#45B7D1", "#3498B8"] },
  Meditation: { solid: "#96CEB4", gradient: ["#96CEB4", "#7AB89A"] },
  Book: { solid: "#98D8C8", gradient: ["#98D8C8", "#7FC4B4"] },
  Walk: { solid: "#F7B731", gradient: ["#F7B731", "#E0A520"] },
  "Getting ready": { solid: "#FF9F4A", gradient: ["#FF9F4A", "#E88A35"] },
  Break: { solid: "#888888", gradient: ["#888888", "#6F6F6F"] },
  Study: { solid: "#6C5CE7", gradient: ["#6C5CE7", "#5849C7"] },
  Dinner: { solid: "#FF9F4A", gradient: ["#FF9F4A", "#E88A35"] },
  "Free time": { solid: "#A8E6CF", gradient: ["#A8E6CF", "#8FD4B8"] }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const formatHours = (minutes: number): string => (minutes / 60).toFixed(1) + "h";

// Data generators (unchanged)
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
        { name: "Free time", minutes: 35 }
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
        { name: "Dinner", minutes: 35 }
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
        { name: "Free time", minutes: 360 }
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
        { name: "Free time", minutes: 1680 }
      ];
    default:
      return [];
  }
};

const getDailyTotals = (period: string) => {
  const today = new Date();
  const data: { label: string; totalMinutes: number }[] = [];
  if (period === "Today") {
    data.push({ label: "Today", totalMinutes: 1440 });
  } else if (period === "Yesterday") {
    data.push({ label: "Yesterday", totalMinutes: 1395 });
  } else if (period === "7 days") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      data.push({ label: dayName, totalMinutes: 1200 + Math.floor(Math.random() * 400) });
    }
  } else if (period === "30 days") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      data.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        totalMinutes: 1100 + Math.floor(Math.random() * 500)
      });
    }
  }
  return data;
};

// Donut Chart (smaller)
const DonutChart = ({ activities, totalMinutes }: { activities: { name: string; minutes: number }[]; totalMinutes: number }) => {
  const radius = 65;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const [animatedValues] = useState(activities.map(() => new Animated.Value(0)));
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.stagger(40, animatedValues.map(anim => Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 7 })))
    ]).start();
  }, []);

  let cumulativePercent = 0;

  return (
    <Animated.View style={[styles.donutWrapper, { opacity: fadeAnim }]}>
      <Svg width="150" height="150" viewBox="0 0 150 150">
        <Circle cx="75" cy="75" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="none" />
        {activities.map((item, idx) => {
          const colors = ACTIVITY_COLORS[item.name] || { solid: "#888888", gradient: ["#888888", "#6F6F6F"] };
          const percent = (item.minutes / totalMinutes) * 100;
          const dashArray = (percent / 100) * circumference;
          const dashOffset = -cumulativePercent * circumference;
          cumulativePercent += percent / 100;
          return (
            <Circle
              key={idx}
              cx="75"
              cy="75"
              r={radius}
              stroke={colors.solid}
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
        <Text style={styles.centerTotal}>{formatHours(totalMinutes)}</Text>
        <Text style={styles.centerSub}>tracked</Text>
      </View>
    </Animated.View>
  );
};

// Multi-Line Chart (compact)
const MultiLineChart = ({ activities, period }: { activities: { name: string; minutes: number }[]; period: string }) => {
  const daily = getDailyTotals(period);
  const days = daily.length;
  const activityLines = activities.map((act) => {
    const perDay = Math.round(act.minutes / days);
    return {
      name: act.name,
      color: ACTIVITY_COLORS[act.name]?.solid || "#888888",
      data: daily.map(() => perDay + Math.floor(Math.random() * 30 - 15))
    };
  });
  const chartHeight = 160;
  const maxHour = 24;
  const stepX = days > 1 ? (screenWidth - 70) / (days - 1) : (screenWidth - 70) / 2;
  const lines = activityLines.map(line => ({
    ...line,
    points: line.data.map((val, i) => ({
      x: 40 + i * stepX,
      y: chartHeight + 8 - (Math.max(0, val) / (maxHour * 60)) * chartHeight
    }))
  }));
  const yTicks = [0, 6, 12, 18, 24];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ width: screenWidth - 36, alignSelf: "center", opacity: fadeAnim }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendScroll} contentContainerStyle={styles.legendContent}>
        {activities.map((act, idx) => {
          const colors = ACTIVITY_COLORS[act.name] || { solid: "#888888" };
          return (
            <View key={idx} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.solid }]} />
              <Text style={styles.legendText}>{act.name}</Text>
            </View>
          );
        })}
      </ScrollView>
      <Svg width={screenWidth - 36} height={chartHeight + 40}>
        {yTicks.map(tick => {
          const y = chartHeight + 8 - (tick / maxHour) * chartHeight;
          return (
            <React.Fragment key={tick}>
              <Line x1={35} y1={y} x2={screenWidth - 56} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3,3" />
              <SvgText x={30} y={y + 3} fontSize="9" fill={shadcn.colors.mutedForeground} textAnchor="end">{tick}h</SvgText>
            </React.Fragment>
          );
        })}
        <Line x1={35} y1={8} x2={35} y2={chartHeight + 12} stroke={shadcn.colors.border} strokeWidth={1.5} />
        <Line x1={35} y1={chartHeight + 12} x2={screenWidth - 56} y2={chartHeight + 12} stroke={shadcn.colors.border} strokeWidth={1.5} />
        {lines.map((line, lineIdx) => (
          <React.Fragment key={lineIdx}>
            {line.points.length > 1 && line.points.map((pt, i) => {
              if (i === 0) return null;
              return (
                <React.Fragment key={`${lineIdx}-${i}`}>
                  <Line x1={line.points[i - 1].x} y1={line.points[i - 1].y} x2={pt.x} y2={pt.y} stroke={line.color} strokeWidth={3} opacity={0.3} />
                  <Line x1={line.points[i - 1].x} y1={line.points[i - 1].y} x2={pt.x} y2={pt.y} stroke={line.color} strokeWidth={2} />
                </React.Fragment>
              );
            })}
            {line.points.map((pt, i) => (
              <React.Fragment key={`dot-${lineIdx}-${i}`}>
                <Circle cx={pt.x} cy={pt.y} r={4} fill={line.color} opacity={0.3} />
                <Circle cx={pt.x} cy={pt.y} r={2.5} fill={line.color} stroke={shadcn.colors.background} strokeWidth={1} />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
        {daily.map((d, i) => {
          const x = 40 + i * stepX;
          return <SvgText key={i} x={x} y={chartHeight + 28} fontSize="9" fill={shadcn.colors.mutedForeground} textAnchor="middle">{d.label.length > 4 ? d.label.slice(0, 3) : d.label}</SvgText>;
        })}
      </Svg>
    </Animated.View>
  );
};

// Activity Row (smaller)
const ActivityRow = ({ activity, totalMinutes, index }: { activity: { name: string; minutes: number }; totalMinutes: number; index: number }) => {
  const colors = ACTIVITY_COLORS[activity.name] || { solid: "#888888", gradient: ["#888888", "#6F6F6F"] };
  const percent = ((activity.minutes / totalMinutes) * 100).toFixed(1);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 30, useNativeDriver: true }),
      Animated.spring(progressAnim, { toValue: parseFloat(percent), delay: index * 30, useNativeDriver: false, tension: 40, friction: 8 })
    ]).start();
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <Animated.View style={[styles.listRow, { opacity: fadeAnim }]}>
      <View style={[styles.colorBadge, { backgroundColor: colors.solid }]} />
      <View style={styles.listInfo}>
        <View style={styles.listTop}>
          <Text style={styles.listName}>{activity.name}</Text>
          <Text style={styles.listPercent}>{percent}%</Text>
        </View>
        <Text style={styles.listTime}>{formatDuration(activity.minutes)}</Text>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBar, { width: progressWidth, backgroundColor: colors.solid }]} />
        </View>
      </View>
    </Animated.View>
  );
};

// Main Screen
export default function SummaryScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState("Today");
  const [chartType, setChartType] = useState<"donut" | "line">("donut");
  const scrollY = useRef(new Animated.Value(0)).current;

  const activities = getActivitiesForPeriod(period);
  const totalMinutes = activities.reduce((sum, a) => sum + a.minutes, 0);

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: "clamp" });
  const headerScale = scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0.96], extrapolate: "clamp" });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Animated header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={shadcn.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <TouchableOpacity onPress={() => router.push("/things")} style={styles.thingsButton}>
            <Text style={styles.thingsButtonText}>Things</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {["Today", "Yesterday", "7d", "30d"].map((p) => {
            const full = p === "7d" ? "7 days" : p === "30d" ? "30 days" : p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.periodChip, period === full && styles.periodChipActive]}
                onPress={() => setPeriod(full)}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodText, period === full && styles.periodTextActive]}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats Cards (smaller) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={18} color={shadcn.colors.brand} />
            <Text style={styles.statValue}>{formatHours(totalMinutes)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="list-outline" size={18} color={shadcn.colors.destructive} />
            <Text style={styles.statValue}>{activities.length}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={18} color={shadcn.colors.warning} />
            <Text style={styles.statValue}>{((totalMinutes / 1440) * 100).toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Day used</Text>
          </View>
        </View>

        {/* Chart Toggle (smaller) */}
        <View style={styles.chartTypeRow}>
          <TouchableOpacity
            style={[styles.chartTypeBtn, chartType === "donut" && styles.chartTypeBtnActive]}
            onPress={() => setChartType("donut")}
          >
            <Ionicons name="pie-chart-outline" size={16} color={chartType === "donut" ? shadcn.colors.brand : shadcn.colors.mutedForeground} />
            <Text style={[styles.chartTypeText, chartType === "donut" && styles.chartTypeTextActive]}>Distribution</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chartTypeBtn, chartType === "line" && styles.chartTypeBtnActive]}
            onPress={() => setChartType("line")}
          >
            <Ionicons name="analytics-outline" size={16} color={chartType === "line" ? shadcn.colors.brand : shadcn.colors.mutedForeground} />
            <Text style={[styles.chartTypeText, chartType === "line" && styles.chartTypeTextActive]}>Trends</Text>
          </TouchableOpacity>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          {chartType === "donut" ? (
            <DonutChart activities={activities} totalMinutes={totalMinutes} />
          ) : (
            <MultiLineChart activities={activities} period={period} />
          )}
        </View>

        {/* Activity Breakdown */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Breakdown</Text>
          {activities.map((act, idx) => (
            <ActivityRow key={idx} activity={act} totalMinutes={totalMinutes} index={idx} />
          ))}
        </View>

        <View style={{ height: 20 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 45,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  thingsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(78,205,196,0.2)",
  },
  thingsButtonText: {
    color: shadcn.colors.brand,
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 100 : 90,
    paddingHorizontal: 14,
    paddingBottom: 20,
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
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  periodChipActive: {
    backgroundColor: shadcn.colors.brand,
    borderColor: shadcn.colors.brand,
  },
  periodText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "500",
  },
  periodTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(20,20,20,0.8)",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
  chartTypeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  chartTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chartTypeBtnActive: {
    backgroundColor: "rgba(78,205,196,0.15)",
    borderColor: shadcn.colors.brand,
  },
  chartTypeText: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "500",
  },
  chartTypeTextActive: {
    color: shadcn.colors.brand,
  },
  chartCard: {
    backgroundColor: "rgba(10,10,10,0.8)",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 18,
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
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
  },
  centerSub: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 2,
  },
  legendScroll: {
    marginBottom: 10,
  },
  legendContent: {
    paddingHorizontal: 6,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: "#ddd",
    fontSize: 10,
    fontWeight: "500",
  },
  listSection: {
    marginTop: 4,
  },
  listTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  listRow: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "rgba(15,15,15,0.9)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
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
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  listPercent: {
    color: shadcn.colors.brand,
    fontSize: 14,
    fontWeight: "600",
  },
  listTime: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
  },
});
