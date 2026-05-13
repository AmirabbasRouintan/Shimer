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
        <Text style={styles.headerTitle}>What's New</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.versionBadge}>
          <Ionicons name="sparkles" size={48} color="#d028ed" />
          <Text style={styles.versionTitle}>v2026.1.0</Text>
          <Text style={styles.versionSubtitle}>First Version</Text>
        </View>

        <Text style={styles.description}>
          This is the very first version of Shimer! Everything you see is brand
          new. We've built this app from the ground up to help you track your
          time, manage tasks, and stay productive.
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name="sparkles-outline"
            size={22}
            color={shadcn.colors.brand}
          />
          <Text style={styles.sectionTitle}>What's Included</Text>
        </View>

        {[
          {
            icon: "time-outline",
            name: "Live Time Tracking",
            desc: "Track your activities with a beautiful live clock",
          },
          {
            icon: "checkbox-outline",
            name: "Checklists",
            desc: "Create and manage checklists for any activity",
          },
          {
            icon: "stats-chart-outline",
            name: "Summary & History",
            desc: "Visualize your time with donut charts and detailed history",
          },
          {
            icon: "notifications-outline",
            name: "Smart Reminders",
            desc: "Set break reminders and timer notifications",
          },
        ].map((item, idx) =>
          <View key={idx} style={styles.featureRow}>
            <Ionicons
              name={item.icon as any}
              size={24}
              color={shadcn.colors.brand}
            />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>
                {item.name}
              </Text>
              <Text style={styles.featureDesc}>
                {item.desc}
              </Text>
            </View>
          </View>,
        )}

        <View style={styles.footer}>
          <Ionicons
            name="rocket-outline"
            size={18}
            color={shadcn.colors.mutedForeground}
          />
          <Text style={styles.footerText}>
            Thank you for being an early user!
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
    borderBottomWidth: 1,
    borderBottomColor: shadcn.colors.border,
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
  },
  content: { flex: 1, paddingHorizontal: 16 },
  versionBadge: {
    alignItems: "center",
    marginVertical: 30,
    backgroundColor: shadcn.colors.card,
    padding: 24,
    borderRadius: 24,
  },
  versionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
  },
  versionSubtitle: {
    color: shadcn.colors.mutedForeground,
    fontSize: 14,
    marginTop: 4,
  },
  description: {
    color: shadcn.colors.mutedForeground,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: shadcn.colors.foreground,
    fontSize: 18,
    fontWeight: "600",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
    backgroundColor: shadcn.colors.card,
    padding: 14,
    borderRadius: 12,
  },
  featureText: { flex: 1 },
  featureTitle: {
    color: shadcn.colors.foreground,
    fontSize: 15,
    fontWeight: "600",
  },
  featureDesc: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 30,
  },
  footerText: {
    color: shadcn.colors.mutedForeground,
    fontSize: 14,
    textAlign: "center",
  },
});
