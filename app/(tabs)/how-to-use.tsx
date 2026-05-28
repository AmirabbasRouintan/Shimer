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
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How to Use Shimer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="rocket-outline" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Welcome to Shimer</Text>
          <Text style={styles.heroText}>
            Your all-in-one time tracking, productivity, and personal organization app
          </Text>
        </View>

        <View style={styles.sectionGroup}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(250,250,250,0.12)" }]}>
                <Ionicons name="timer-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>Live Timer</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Tap on any activity from the Activities tab to start tracking your time</Text>
            <Text style={styles.paragraph}>• The main screen shows a live clock with countdown and stopwatch modes</Text>
            <Text style={styles.paragraph}>• Use the "+" button to add 5 minutes to your current timer</Text>
            <Text style={styles.paragraph}>• Tap the "i" button to invert the timer (counts up instead of down)</Text>
            <Text style={styles.paragraph}>• Long-press the clock to access customization options</Text>
            <Text style={styles.paragraph}>• Tap the clock to start a 5-minute break when timer is running</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(150,206,180,0.15)" }]}>
                <Ionicons name="layers-outline" size={20} color="#96CEB4" />
              </View>
              <Text style={styles.sectionTitle}>Activities</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Create, edit, and delete activities with custom names, icons, and colors</Text>
            <Text style={styles.paragraph}>• Drag and drop to reorder your activities list</Text>
            <Text style={styles.paragraph}>• Each activity can have its own Pomodoro timer duration</Text>
            <Text style={styles.paragraph}>• Link checklists to activities for task management</Text>
            <Text style={styles.paragraph}>• Link goals to activities to track progress</Text>
            <Text style={styles.paragraph}>• Set "Keep Screen On" option for specific activities</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(255,234,167,0.15)" }]}>
                <Ionicons name="flag-outline" size={20} color="#FFEAA7" />
              </View>
              <Text style={styles.sectionTitle}>Goals</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Create goals with custom titles, colors, and completion emojis</Text>
            <Text style={styles.paragraph}>• Set repeat schedules (Daily, Weekly, or specific days)</Text>
            <Text style={styles.paragraph}>• Choose duration for each goal (30 min, 1h, 2h, 3h, 4h, or Custom)</Text>
            <Text style={styles.paragraph}>• Track progress with visual progress bars (up to 100%)</Text>
            <Text style={styles.paragraph}>• Add extra time (+1m) when a goal timer reaches zero</Text>
            <Text style={styles.paragraph}>• Long-press the +1m button to add 1 hour instead</Text>
            <Text style={styles.paragraph}>• Link checklists to goals for task tracking</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(221,160,221,0.15)" }]}>
                <Ionicons name="checkbox-outline" size={20} color="#DDA0DD" />
              </View>
              <Text style={styles.sectionTitle}>Checklists</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Create reusable checklists with custom icons</Text>
            <Text style={styles.paragraph}>• Add, remove, and reorder checklist items</Text>
            <Text style={styles.paragraph}>• Mark items as completed by tapping the checkbox</Text>
            <Text style={styles.paragraph}>• Link checklists to activities or goals</Text>
            <Text style={styles.paragraph}>• Choose which checklist appears on your home screen</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(69,183,209,0.15)" }]}>
                <Ionicons name="stats-chart-outline" size={20} color="#45B7D1" />
              </View>
              <Text style={styles.sectionTitle}>Summary & Statistics</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• View your time distribution with an interactive donut chart</Text>
            <Text style={styles.paragraph}>• Tap on any donut slice to see detailed activity info</Text>
            <Text style={styles.paragraph}>• Filter data by Today, Yesterday, 7 days, or 30 days</Text>
            <Text style={styles.paragraph}>• See percentage change compared to previous period</Text>
            <Text style={styles.paragraph}>• Activity breakdown with progress bars and percentages</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(247,183,49,0.15)" }]}>
                <Ionicons name="time-outline" size={20} color="#F7B731" />
              </View>
              <Text style={styles.sectionTitle}>History</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• View your daily activity timeline with visual bars</Text>
            <Text style={styles.paragraph}>• Tap on any entry to edit the activity type or duration</Text>
            <Text style={styles.paragraph}>• Long-press or use the edit modal to delete entries</Text>
            <Text style={styles.paragraph}>• Manually add new entries with custom start times</Text>
            <Text style={styles.paragraph}>• Navigate between dates using the calendar picker</Text>
            <Text style={styles.paragraph}>• See currently running timer at the bottom of the list</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(255,159,74,0.15)" }]}>
                <Ionicons name="folder-outline" size={20} color="#FF9F4A" />
              </View>
              <Text style={styles.sectionTitle}>Tasks & Folders</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Organize tasks into custom folders (Today, Tomorrow, etc.)</Text>
            <Text style={styles.paragraph}>• Add tasks with descriptions, activities, and optional timers</Text>
            <Text style={styles.paragraph}>• Tap a task to instantly start a timer for that activity</Text>
            <Text style={styles.paragraph}>• Tasks automatically move from Tomorrow to Today at midnight</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(232,99,94,0.15)" }]}>
                <Ionicons name="calendar-outline" size={20} color="#E8635E" />
              </View>
              <Text style={styles.sectionTitle}>Calendar & JSON Planner</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• View your monthly calendar with event indicators</Text>
            <Text style={styles.paragraph}>• Add time-based events to any day</Text>
            <Text style={styles.paragraph}>• Create JSON-based daily plans with schedules and checklists</Text>
            <Text style={styles.paragraph}>• Save and restore plans for any date</Text>
            <Text style={styles.paragraph}>• View all your saved plans in the "All Plans" section</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(108,92,231,0.15)" }]}>
                <Ionicons name="mic-outline" size={20} color="#6C5CE7" />
              </View>
              <Text style={styles.sectionTitle}>Voice Notes</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Record and save voice notes with automatic naming</Text>
            <Text style={styles.paragraph}>• Swipe left on any note to delete it</Text>
            <Text style={styles.paragraph}>• Tap to play back your recordings</Text>
            <Text style={styles.paragraph}>• Visual audio meter while recording</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(152,216,200,0.15)" }]}>
                <Ionicons name="document-text-outline" size={20} color="#98D8C8" />
              </View>
              <Text style={styles.sectionTitle}>Rich Text Notes</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Create formatted notes with headings, bold, italic, and underline</Text>
            <Text style={styles.paragraph}>• Add images from gallery or camera</Text>
            <Text style={styles.paragraph}>• Insert links and code blocks</Text>
            <Text style={styles.paragraph}>• Categorize notes and link to other notes</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(136,136,136,0.15)" }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#888888" />
              </View>
              <Text style={styles.sectionTitle}>Secure File Vault</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Protect sensitive files with PIN, Pattern, or Fingerprint lock</Text>
            <Text style={styles.paragraph}>• Store documents, images, and other files securely</Text>
            <Text style={styles.paragraph}>• Files are encrypted and stored locally on your device</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(78,205,196,0.15)" }]}>
                <Ionicons name="cloud-upload-outline" size={20} color="#4ECDC4" />
              </View>
              <Text style={styles.sectionTitle}>Backup & Restore</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Create full backups of all your app data (activities, history, notes, etc.)</Text>
            <Text style={styles.paragraph}>• Save backups to phone storage or share via email/cloud</Text>
            <Text style={styles.paragraph}>• Restore from previously saved backup files</Text>
            <Text style={styles.paragraph}>• Set automatic backup frequency (Daily, Weekly, Monthly)</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.iconBadge, { backgroundColor: "rgba(168,230,207,0.15)" }]}>
                <Ionicons name="home-outline" size={20} color="#A8E6CF" />
              </View>
              <Text style={styles.sectionTitle}>Home Screen Customization</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.paragraph}>• Choose which checklist appears on your home screen</Text>
            <Text style={styles.paragraph}>• Toggle checklist visibility on/off</Text>
            <Text style={styles.paragraph}>• Drag and drop to reorder goals on your home screen</Text>
            <Text style={styles.paragraph}>• Create and manage goals directly from the home screen</Text>
          </View>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.iconBadge, { backgroundColor: "rgba(250,250,250,0.12)" }]}>
              <Ionicons name="bulb-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Tips & Tricks</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.tipText}>💡 Long-press on any history entry to quickly delete it</Text>
          <Text style={styles.tipText}>💡 Swipe left on voice notes or planned dates to delete</Text>
          <Text style={styles.tipText}>💡 Drag the handle (⋮⋮) on activities and goals to reorder</Text>
          <Text style={styles.tipText}>💡 Tap the clock during a timer to start a 5-minute break</Text>
          <Text style={styles.tipText}>💡 Use the "Auto Backup" feature to never lose your data</Text>
          <Text style={styles.tipText}>💡 Link checklists to activities for better task management</Text>
          <Text style={styles.tipText}>💡 Create goals with repeat schedules to build habits</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for better productivity</Text>
          <Text style={styles.versionText}>Shimer v2026.1.0</Text>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#000",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Hero
  heroSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroText: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },

  // Section group (iOS grouped list style)
  sectionGroup: {
    gap: 2,
    marginBottom: 4,
  },

  sectionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  divider: {
    height: 0.5,
    backgroundColor: "#1a1a1a",
    marginVertical: 12,
    marginHorizontal: -4,
  },
  paragraph: {
    color: "#a0a0a0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    marginLeft: 2,
  },

  // Tips
  tipsCard: {
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "rgba(250,250,250,0.08)",
  },
  tipText: {
    color: "#a0a0a0",
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 6,
    marginLeft: 2,
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 20,
  },
  footerText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  versionText: {
    color: "#444",
    fontSize: 11,
    fontWeight: "500",
  },
});
