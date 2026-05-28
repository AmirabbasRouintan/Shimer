/* eslint-disable react/no-unescaped-entities */
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

export default function WhatsNewScreen() {
  const router = useRouter();

  const allFeatures = [
    { icon: "timer-outline", name: "Live Timer", desc: "Countdown and stopwatch modes with overtime support" },
    { icon: "layers-outline", name: "Activities", desc: "Create custom activities with icons and colors" },
    { icon: "flag-outline", name: "Goals", desc: "Set goals with repeat schedules and track progress" },
    { icon: "checkbox-outline", name: "Checklists", desc: "Create and link checklists to activities" },
    { icon: "stats-chart-outline", name: "Summary", desc: "Beautiful donut charts and activity breakdowns" },
    { icon: "time-outline", name: "History", desc: "Timeline view with edit and delete capabilities" },
    { icon: "folder-outline", name: "Tasks & Folders", desc: "Organize tasks with custom folders" },
    { icon: "calendar-outline", name: "Calendar", desc: "Event scheduling and JSON daily planner" },
    { icon: "mic-outline", name: "Voice Notes", desc: "Record and playback voice notes" },
    { icon: "document-text-outline", name: "Rich Text Notes", desc: "Formatted notes with images and links" },
    { icon: "lock-closed-outline", name: "Secure Vault", desc: "PIN, pattern, or fingerprint protected files" },
    { icon: "cloud-upload-outline", name: "Backup & Restore", desc: "Full data backup with auto backup options" },
    { icon: "notifications-outline", name: "Smart Reminders", desc: "Break reminders and timer notifications" },
    { icon: "home-outline", name: "Customizable Home", desc: "Drag to reorder goals and choose checklists" },
    { icon: "stats-chart-outline", name: "Statistics", desc: "Track your time with percentage changes" },
    { icon: "brush-outline", name: "Dark Theme", desc: "Easy on the eyes, always dark mode" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={shadcn.colors.foreground}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What's New</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.versionBadge}>
          <Ionicons name="sparkles" size={56} color={shadcn.colors.brand} />
          <Text style={styles.versionTitle}>v2026.1.0</Text>
          <Text style={styles.versionSubtitle}>The Very First Release 🎉</Text>
        </View>

        <Text style={styles.description}>
          <Text style={styles.boldText}>Literally everything is new.</Text> This is the first version of Shimer!
          We didn't have time to remove anything yet, so here's everything we built from the ground up:
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name="sparkles-outline"
            size={22}
            color={shadcn.colors.brand}
          />
          <Text style={styles.sectionTitle}>Everything That's New</Text>
          <Text style={styles.sectionBadge}>ALL OF IT</Text>
        </View>

        {allFeatures.map((item, idx) => (
          <View key={idx} style={styles.featureRow}>
            <View style={styles.featureIconWrapper}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={shadcn.colors.brand}
              />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>
                {item.name}
              </Text>
              <Text style={styles.featureDesc}>
                {item.desc}
              </Text>
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
        ))}

        {/* Funny section */}
        <View style={styles.jokeCard}>
          <Ionicons name="happy-outline" size={32} color={shadcn.colors.brand} />
          <Text style={styles.jokeTitle}>What's NOT new?</Text>
          <Text style={styles.jokeText}>
            Absolutely nothing. We started from scratch. Every button, every screen,
            every line of code is fresh out of the oven. Well, except maybe the laws of physics.
            Those are pretty old.
          </Text>
        </View>

        <View style={styles.footer}>
          <Ionicons
            name="rocket-outline"
            size={18}
            color={shadcn.colors.mutedForeground}
          />
          <Text style={styles.footerText}>
            Thanks for being an early user! More features coming soon™
          </Text>
        </View>
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
    borderBottomWidth: 0.5,
    borderBottomColor: shadcn.colors.border,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
  },
  content: { flex: 1, paddingHorizontal: 16 },

  versionBadge: {
    alignItems: "center",
    marginVertical: 24,
    backgroundColor: shadcn.colors.card,
    padding: 24,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
  },
  versionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
  },
  versionSubtitle: {
    color: shadcn.colors.brand,
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  description: {
    color: shadcn.colors.mutedForeground,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  boldText: {
    fontWeight: "700",
    color: shadcn.colors.foreground,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  sectionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
  },
  sectionBadge: {
    backgroundColor: shadcn.colors.brand,
    color: shadcn.colors.brandForeground,
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
    backgroundColor: shadcn.colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
  },
  featureIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(78,205,196,0.1)',
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1 },
  featureTitle: {
    color: shadcn.colors.foreground,
    fontSize: 15,
    fontWeight: "600",
  },
  featureDesc: {
    color: shadcn.colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: shadcn.colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: shadcn.colors.brandForeground,
    fontSize: 10,
    fontWeight: "700",
  },
  jokeCard: {
    backgroundColor: shadcn.colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: shadcn.colors.border,
    alignItems: "center",
  },
  jokeTitle: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 8,
  },
  jokeText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 20,
    paddingVertical: 16,
  },
  footerText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    textAlign: "center",
  },
});
