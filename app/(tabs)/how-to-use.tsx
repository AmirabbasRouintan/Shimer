import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { shadcn } from "../../constants/components-theme";

export default function HowToUseScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>How to Use the App</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: 16 }}
      >
        <Text style={styles.sectionTitle}>Welcome to Shimer</Text>
        <Text style={styles.paragraph}>
          Track your time, manage activities, and stay productive with
          checklists and timers.
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name="timer-outline"
            size={22}
            color={shadcn.colors.brand}
          />
          <Text style={styles.sectionTitle}>Live Timer</Text>
        </View>
        <Text style={styles.paragraph}>
          The main screen shows a live clock. Tap on any activity to start
          tracking your time. Long-press the clock to open detailed view.
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name="clipboard-outline"
            size={22}
            color={shadcn.colors.brand}
          />
          <Text style={styles.sectionTitle}>Activities</Text>
        </View>
        <Text style={styles.paragraph}>
          Create and manage activities like Work, Study, Hobby, etc. Each
          activity can have Pomodoro timers, goals, checklists, and shortcuts.
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name="stats-chart-outline"
            size={22}
            color={shadcn.colors.brand}
          />
          <Text style={styles.sectionTitle}>Summary & History</Text>
        </View>
        <Text style={styles.paragraph}>
          View your time distribution with donut charts and progress bars. Check
          your daily history to see exactly when you switched activities.
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name="checkbox-outline"
            size={22}
            color={shadcn.colors.brand}
          />
          <Text style={styles.sectionTitle}>Checklists</Text>
        </View>
        <Text style={styles.paragraph}>
          Create to-do lists for any activity. Perfect for breaking down tasks
          like “University” or “Work” into smaller items.
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name="settings-outline"
            size={22}
            color={shadcn.colors.brand}
          />
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <Text style={styles.paragraph}>
          Customize your experience: backups, notifications, day start time, and
          more.
        </Text>
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
  },
  paragraph: {
    color: shadcn.colors.mutedForeground,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
});
