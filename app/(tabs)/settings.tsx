// app/(tabs)/settings.tsx
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Checklist {
  title: string;
  icon: string;
  items: any[];
}

interface AppData {
  checklists?: Checklist[];
  tasks_today?: any[];
  tasks_tomorrow?: any[];
  home_tasks?: any[];
  calendar_events?: Record<string, any>;
  notes?: any[];
  vault_files?: any[];
  day_start?: string;
  backup_frequency?: string;
  last_backup?: string;
  version?: string;
  timestamp?: string;
}

const store: Record<string, any> = {};

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState("manual");
  const [lastBackup, setLastBackup] = useState("Never");

  useEffect(() => {
    const stored = store["checklists"];
    if (stored) {
      setChecklists(JSON.parse(stored));
    } else {
      setChecklists([
        { title: "University", icon: "school-outline", items: [] },
      ]);
    }
  }, []);

  useEffect(() => {
    if (params.newChecklist) {
      const newChecklistParam = Array.isArray(params.newChecklist)
        ? params.newChecklist[0]
        : params.newChecklist;
      try {
        const newList: Checklist = JSON.parse(newChecklistParam);
        if (newList.title) {
          setChecklists((prev) => {
            const updated = [...prev, newList];
            store["checklists"] = JSON.stringify(updated);
            return updated;
          });
        }
      } catch (e) {
        console.warn("Failed to parse new checklist", e);
      }
    }
  }, [params.newChecklist]);

  useEffect(() => {
    const saved = store["backup_frequency"];
    if (saved) setBackupFrequency(saved);
    const savedLast = store["last_backup"];
    if (savedLast) setLastBackup(savedLast);
  }, []);

  const collectAllData = (): AppData => {
    return {
      version: "2026.1.0",
      timestamp: new Date().toISOString(),
      checklists: store["checklists"] ? JSON.parse(store["checklists"]) : [],
      tasks_today: store["tasks_today"] ? JSON.parse(store["tasks_today"]) : [],
      tasks_tomorrow: store["tasks_tomorrow"]
        ? JSON.parse(store["tasks_tomorrow"])
        : [],
      home_tasks: store["home_tasks"] ? JSON.parse(store["home_tasks"]) : [],
      calendar_events: store["calendar_events"]
        ? JSON.parse(store["calendar_events"])
        : {},
      notes: store["notes"] ? JSON.parse(store["notes"]) : [],
      vault_files: store["vault_files"] ? JSON.parse(store["vault_files"]) : [],
      day_start: store["day_start"] || "00:00",
      backup_frequency: store["backup_frequency"] || "manual",
    };
  };

  const handleCreateBackup = async () => {
    try {
      const data = collectAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `ixi_backup_${new Date()
        .toISOString()
        .split("T")[0]}.json`;

      const tempPath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(tempPath, jsonString);

      if (Platform.OS === "android") {
        await Sharing.shareAsync(tempPath, {
          mimeType: "application/json",
          dialogTitle: "Save Backup",
          UTI: "public.json",
        });
      }

      const now = new Date();
      const dateStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" }
      )}`;
      setLastBackup(dateStr);
      store["last_backup"] = dateStr;
      setShowBackupModal(false);

      Alert.alert("Backup Created", `File saved as ${fileName}`);
    } catch {
      Alert.alert("Error", "Failed to create backup");
    }
  };

  const handleRestoreBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const jsonString = await FileSystem.readAsStringAsync(fileUri);
        const data: AppData = JSON.parse(jsonString);

        if (!data.version || !data.timestamp) {
          Alert.alert(
            "Invalid Backup",
            "This file is not a valid Shimer backup."
          );
          return;
        }

        Alert.alert(
          "Restore Backup",
          `Restore backup from ${new Date(
            data.timestamp
          ).toLocaleString()}? This will replace all current data.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Restore",
              onPress: () => {
                if (data.checklists)
                  store["checklists"] = JSON.stringify(data.checklists);
                if (data.tasks_today)
                  store["tasks_today"] = JSON.stringify(data.tasks_today);
                if (data.tasks_tomorrow)
                  store["tasks_tomorrow"] = JSON.stringify(data.tasks_tomorrow);
                if (data.home_tasks)
                  store["home_tasks"] = JSON.stringify(data.home_tasks);
                if (data.calendar_events)
                  store["calendar_events"] = JSON.stringify(
                    data.calendar_events
                  );
                if (data.notes) store["notes"] = JSON.stringify(data.notes);
                if (data.vault_files)
                  store["vault_files"] = JSON.stringify(data.vault_files);
                if (data.day_start) store["day_start"] = data.day_start;
                if (data.backup_frequency)
                  store["backup_frequency"] = data.backup_frequency;

                setChecklists(
                  data.checklists || [
                    { title: "University", icon: "school-outline", items: [] },
                  ]
                );
                setBackupFrequency(data.backup_frequency || "manual");

                Alert.alert(
                  "Restored",
                  "All data has been restored successfully."
                );
                setShowBackupModal(false);
              },
            },
          ]
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Failed to restore backup. Make sure the file is a valid JSON backup."
      );
    }
  };

  const handleBackupNow = () => {
    handleCreateBackup();
  };

  const selectFrequency = (freq: string) => {
    setBackupFrequency(freq);
    store["backup_frequency"] = freq;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* How to Use the App */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/how-to-use")}
        >
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>How to Use the App</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* What's New */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/whats-new")}
        >
          <Ionicons name="sparkles-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>What&apos;s New</Text>
          <Text style={styles.badge}>9mo</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* CHECKLISTS Section */}
        <Text style={styles.sectionHeader}>CHECKLISTS</Text>
        {checklists.map((list, index) => (
          <TouchableOpacity
            key={index}
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: "/edit-checklist",
                params: {
                  checklist: JSON.stringify(list),
                  checklistIndex: index,
                },
              })
            }
          >
            <Ionicons name="school-outline" size={24} color="#fff" />
            <Text style={styles.rowText}>{list.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/new-checklist")}
        >
          <Ionicons name="add-circle-outline" size={24} color="#666" />
          <Text style={[styles.rowText, { color: "#666" }]}>New Checklist</Text>
        </TouchableOpacity>

        {/* SHORTCUTS Section */}
        <Text style={styles.sectionHeader}>SHORTCUTS</Text>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="musical-notes-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Music</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/new-shortcut")}
        >
          <Ionicons name="add-circle-outline" size={24} color="#666" />
          <Text style={[styles.rowText, { color: "#666" }]}>New Shortcut</Text>
        </TouchableOpacity>

        {/* NOTES Section */}
        <Text style={styles.sectionHeader}>NOTES</Text>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="videocam-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>📷 Video Idea</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/new-note")}
        >
          <Ionicons name="add-circle-outline" size={24} color="#666" />
          <Text style={[styles.rowText, { color: "#666" }]}>New Note</Text>
        </TouchableOpacity>

        {/* SETTINGS Section */}
        <Text style={styles.sectionHeader}>SETTINGS</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/folders")}
        >
          <Ionicons name="folder-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Folders</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/day-start")}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Day Start</Text>
          <Text style={styles.valueText}>00:00</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/home-screen-settings")}
        >
          <Ionicons name="home-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Home Screen</Text>
          <Text style={styles.valueText}>Today on Home Screen</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* BACKUPS Section */}
        <Text style={styles.sectionHeader}>BACKUPS</Text>
        <TouchableOpacity style={styles.row} onPress={handleCreateBackup}>
          <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Create Backup</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={handleRestoreBackup}>
          <Ionicons name="cloud-download-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Restore Backup</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowBackupModal(true)}
        >
          <Ionicons name="sync-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Auto Backup</Text>
          <Text style={styles.valueText}>
            {backupFrequency === "manual"
              ? "Manual"
              : backupFrequency === "daily"
                ? "Daily"
                : backupFrequency === "weekly"
                  ? "Weekly"
                  : "Monthly"}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* NOTIFICATIONS Section */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="alarm-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Time to Break</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="timer-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Timer Overdue</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Persistent Notification</Text>
          <Text style={styles.valueText}>Not Granted</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* SECURE FILE VAULT */}
        <Text style={styles.sectionHeader}>SECURE FILE</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/secure-files")}
        >
          <Ionicons name="lock-closed-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Secure File Vault</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* About Section */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/ask-question")}
        >
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Ask a Question</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/open-source")}
        >
          <Ionicons name="code-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Open Source</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/privacy")}
        >
          <Ionicons name="shield-outline" size={24} color="#fff" />
          <Text style={styles.rowText}>Privacy</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Shimer for Android</Text>
          <Text style={styles.versionText}>v2026.1.0</Text>
        </View>
        <View style={{ height: 10 }} />
      </ScrollView>

      {/* Backup Modal */}
      <Modal visible={showBackupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Backup Settings</Text>

            <Text style={styles.modalSection}>Frequency</Text>
            <TouchableOpacity
              style={[
                styles.modalOption,
                backupFrequency === "manual" && styles.modalOptionSelected,
              ]}
              onPress={() => selectFrequency("manual")}
            >
              <Ionicons
                name="hand-left-outline"
                size={22}
                color={backupFrequency === "manual" ? "#4ECDC4" : "#fff"}
              />
              <Text
                style={[
                  styles.modalOptionText,
                  backupFrequency === "manual" && styles.modalOptionTextSelected,
                ]}
              >
                Manual
              </Text>
              {backupFrequency === "manual" && (
                <Ionicons name="checkmark" size={20} color="#4ECDC4" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalOption,
                backupFrequency === "daily" && styles.modalOptionSelected,
              ]}
              onPress={() => selectFrequency("daily")}
            >
              <Ionicons
                name="today-outline"
                size={22}
                color={backupFrequency === "daily" ? "#4ECDC4" : "#fff"}
              />
              <Text
                style={[
                  styles.modalOptionText,
                  backupFrequency === "daily" && styles.modalOptionTextSelected,
                ]}
              >
                Daily
              </Text>
              {backupFrequency === "daily" && (
                <Ionicons name="checkmark" size={20} color="#4ECDC4" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalOption,
                backupFrequency === "weekly" && styles.modalOptionSelected,
              ]}
              onPress={() => selectFrequency("weekly")}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={backupFrequency === "weekly" ? "#4ECDC4" : "#fff"}
              />
              <Text
                style={[
                  styles.modalOptionText,
                  backupFrequency === "weekly" && styles.modalOptionTextSelected,
                ]}
              >
                Weekly
              </Text>
              {backupFrequency === "weekly" && (
                <Ionicons name="checkmark" size={20} color="#4ECDC4" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalOption,
                backupFrequency === "monthly" && styles.modalOptionSelected,
              ]}
              onPress={() => selectFrequency("monthly")}
            >
              <Ionicons
                name="calendar-number-outline"
                size={22}
                color={backupFrequency === "monthly" ? "#4ECDC4" : "#fff"}
              />
              <Text
                style={[
                  styles.modalOptionText,
                  backupFrequency === "monthly" &&
                  styles.modalOptionTextSelected,
                ]}
              >
                Monthly
              </Text>
              {backupFrequency === "monthly" && (
                <Ionicons name="checkmark" size={20} color="#4ECDC4" />
              )}
            </TouchableOpacity>

            <Text style={styles.modalSection}>Last Backup</Text>
            <Text style={styles.lastBackupText}>{lastBackup}</Text>

            <TouchableOpacity
              style={styles.backupNowButton}
              onPress={handleBackupNow}
            >
              <Ionicons name="cloud-upload" size={22} color="#000" />
              <Text style={styles.backupNowText}>Create Backup Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowBackupModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginLeft: 8,
  },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  rowText: { color: "#fff", fontSize: 16, flex: 1 },
  badge: { color: "#888", fontSize: 14, marginRight: 8 },
  valueText: { color: "#888", fontSize: 14, marginRight: 8 },
  versionContainer: { marginTop: 30, marginBottom: 40, alignItems: "center" },
  versionText: { color: "#555", fontSize: 13, marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  modalSection: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    gap: 12,
  },
  modalOptionSelected: { backgroundColor: "#1a3a3a" },
  modalOptionText: { color: "#fff", fontSize: 16, flex: 1 },
  modalOptionTextSelected: { color: "#4ECDC4", fontWeight: "600" },
  lastBackupText: { color: "#888", fontSize: 15, marginBottom: 20 },
  backupNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4ECDC4",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  backupNowText: { color: "#000", fontSize: 16, fontWeight: "700" },
  modalClose: { alignItems: "center", paddingVertical: 12 },
  modalCloseText: { color: "#888", fontSize: 16 },
});
