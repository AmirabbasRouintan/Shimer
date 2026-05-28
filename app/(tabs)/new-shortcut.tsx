import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import CustomAlert from "../components/CustomAlert";

const suggestedApps = [
  { name: "Spotify", icon: "musical-notes", color: "#1DB954" },
  { name: "YouTube", icon: "logo-youtube", color: "#FF0000" },
  { name: "Instagram", icon: "logo-instagram", color: "#E4405F" },
  { name: "Twitter", icon: "logo-twitter", color: "#1DA1F2" },
  { name: "WhatsApp", icon: "logo-whatsapp", color: "#25D366" },
  { name: "Telegram", icon: "paper-plane", color: "#0088cc" },
  { name: "Chrome", icon: "globe", color: "#4285F4" },
  { name: "Gmail", icon: "mail", color: "#EA4335" },
  { name: "Maps", icon: "map", color: "#34A853" },
  { name: "Camera", icon: "camera", color: "#FBBC04" },
  { name: "Gallery", icon: "images", color: "#FF6B6B" },
  { name: "Calendar", icon: "calendar", color: "#4285F4" },
  { name: "Clock", icon: "alarm", color: "#9C27B0" },
  { name: "Calculator", icon: "calculator", color: "#607D8B" },
  { name: "Notes", icon: "document-text", color: "#FFC107" },
];

export default function NewShortcutScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [showUnavailableAlert, setShowUnavailableAlert] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setShowUnavailableAlert(true);
    }, [])
  );

  const filteredApps = suggestedApps.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Shortcut</Text>
        <TouchableOpacity
          style={styles.addButtonContainer}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color={shadcn.colors.mutedForeground}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor={shadcn.colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionHeader}>SUGGESTED APPS</Text>
        {filteredApps.map((app, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.appRow,
              selectedApp === app.name && styles.appRowSelected,
            ]}
            onPress={() => setSelectedApp(app.name)}
          >
            <View style={[styles.appIcon, { backgroundColor: app.color }]}>
              <Ionicons name={app.icon as any} size={22} color="#fff" />
            </View>
            <Text style={styles.appName}>{app.name}</Text>
            {selectedApp === app.name && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={shadcn.colors.brand}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CustomAlert
        visible={showUnavailableAlert}
        title="Coming Soon"
        message="This feature is not available in this version. The developer will release it in a future update."
        onConfirm={() => router.replace("/settings")}
        confirmText="OK"
        singleButton
      />

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
  },
  cancelText: { color: shadcn.colors.foreground, fontSize: 16 },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  addButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: shadcn.colors.card,
    marginHorizontal: 16,
    borderRadius: shadcn.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: { flex: 1, color: shadcn.colors.foreground, fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 14,
    borderRadius: shadcn.radius.md,
    marginBottom: 2,
  },
  appRowSelected: { backgroundColor: shadcn.colors.secondary }, // Changed from card to secondary
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: shadcn.radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: { color: shadcn.colors.foreground, fontSize: 16, flex: 1 },
  note: {
    color: shadcn.colors.mutedForeground,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
});
