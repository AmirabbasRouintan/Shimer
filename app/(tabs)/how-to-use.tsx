import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function HowToUseScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How to Use the App</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Welcome to Shimer</Text>
        <Text style={styles.paragraph}>
          Track your time, manage activities, and stay productive with
          checklists and timers.
        </Text>

        <Text style={styles.sectionTitle}>🕐 Live Timer</Text>
        <Text style={styles.paragraph}>
          The main screen shows a live clock. Tap on any activity to start
          tracking your time. Long-press the clock to open detailed view.
        </Text>

        <Text style={styles.sectionTitle}>📋 Activities</Text>
        <Text style={styles.paragraph}>
          Create and manage activities like Work, Study, Hobby, etc. Each
          activity can have Pomodoro timers, goals, checklists, and shortcuts.
        </Text>

        <Text style={styles.sectionTitle}>📊 Summary & History</Text>
        <Text style={styles.paragraph}>
          View your time distribution with donut charts and progress bars. Check
          your daily history to see exactly when you switched activities.
        </Text>

        <Text style={styles.sectionTitle}>✅ Checklists</Text>
        <Text style={styles.paragraph}>
          Create to-do lists for any activity. Perfect for breaking down tasks
          like &ldquo;University&rdquo; or &ldquo;Work&rdquo; into smaller
          items.
        </Text>

        <Text style={styles.sectionTitle}>⚙️ Settings</Text>
        <Text style={styles.paragraph}>
          Customize your experience: backups, notifications, day start time, and
          more.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8
  },
  paragraph: { color: "#999", fontSize: 15, lineHeight: 22, marginBottom: 8 }
});
