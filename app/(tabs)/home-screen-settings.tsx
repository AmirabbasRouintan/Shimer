import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { shadcn } from "../../constants/components-theme";

function ShadcnSwitch({ value, onValueChange }: any) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[
        styles.switchTrack,
        { backgroundColor: value ? shadcn.colors.brand : shadcn.colors.border },
      ]}
    >
      <Animated.View
        style={[
          styles.switchThumb,
          { transform: [{ translateX: value ? 20 : 0 }] },
        ]}
      />
    </TouchableOpacity>
  );
}

export default function HomeScreenSettings() {
  const router = useRouter();
  const [showClock, setShowClock] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={shadcn.colors.foreground}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home Screen</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionHeader}>DISPLAY OPTIONS</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="time-outline"
              size={22}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.rowText}>Show Clock</Text>
          </View>
          <ShadcnSwitch value={showClock} onValueChange={setShowClock} />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="checkbox-outline"
              size={22}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.rowText}>Show Tasks</Text>
          </View>
          <ShadcnSwitch value={showTasks} onValueChange={setShowTasks} />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="stats-chart-outline"
              size={22}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.rowText}>Show Summary</Text>
          </View>
          <ShadcnSwitch value={showSummary} onValueChange={setShowSummary} />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="time-outline"
              size={22}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.rowText}>Show History</Text>
          </View>
          <ShadcnSwitch value={showHistory} onValueChange={setShowHistory} />
        </View>

        <Text style={styles.sectionHeader}>LAYOUT</Text>
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="grid-outline"
              size={22}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.rowText}>Widget Layout</Text>
          </View>
          <Text style={styles.valueText}>Default</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={shadcn.colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="color-palette-outline"
              size={22}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.rowText}>Theme</Text>
          </View>
          <Text style={styles.valueText}>Dark</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={shadcn.colors.mutedForeground}
          />
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>GOALS</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/add-new-goal")}
        >
          <View style={styles.rowLeft}>
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.rowText}>Add New Goal</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={shadcn.colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/manage-goals")}
        >
          <View style={styles.rowLeft}>
            <Ionicons
              name="list-outline"
              size={22}
              color={shadcn.colors.foreground}
            />
            <Text style={styles.rowText}>Manage Goals</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={shadcn.colors.mutedForeground}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
  },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: shadcn.colors.card,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowText: { color: shadcn.colors.foreground, fontSize: 16 },
  valueText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 14,
    marginRight: 8,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
});
