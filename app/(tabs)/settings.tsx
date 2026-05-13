// app/settings.tsx
import { Ionicons } from "@expo/vector-icons";
import { getChecklists, subscribe, Checklist, getFolders, getDayStart } from "../activitiesStore";

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";
import { shadcn } from "../../constants/components-theme";

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
  home_screen_settings?: {
    showClock: boolean;
    showTasks: boolean;
    showSummary: boolean;
    showHistory: boolean;
  };
}

const store: Record<string, any> = {};

const lightHaptic = () => {
  if (Platform.OS !== "web") Vibration.vibrate(10);
};

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [foldersCount, setFoldersCount] = useState(0);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState("manual");
  const [lastBackup, setLastBackup] = useState("Never");
  const [dayStart, setDayStart] = useState("00:00");
  const [homeScreenSummary, setHomeScreenSummary] = useState("Clock, Tasks");

  // Subscribe to checklist changes
  useEffect(() => {
    const update = () => setChecklists(getChecklists());
    update();
    const unsubscribe = subscribe(update);
    return unsubscribe;
  }, []);

  // Load folders count
  useEffect(() => {
    const updateFoldersCount = () => {
      const folders = getFolders();
      setFoldersCount(folders.length);
    };
    updateFoldersCount();
    const unsubscribe = subscribe(updateFoldersCount);
    return unsubscribe;
  }, []);

  // day start
  useEffect(() => {
    const updateDayStart = () => {
      const savedDayStart = getDayStart();
      if (savedDayStart) setDayStart(savedDayStart);
      else setDayStart("00:00");
    };

    updateDayStart();
    const unsubscribe = subscribe(updateDayStart);
    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const savedDayStart = getDayStart();
      if (savedDayStart) {
        const hour = parseInt(savedDayStart.split(":")[0]);
        setDayStart(savedDayStart);
      } else {
        setDayStart("00:00");
      }

      const homeSettings = store["home_screen_settings"];
      if (homeSettings) {
        const visible = [];
        if (homeSettings.showClock) visible.push("Clock");
        if (homeSettings.showTasks) visible.push("Tasks");
        if (homeSettings.showSummary) visible.push("Summary");
        if (homeSettings.showHistory) visible.push("History");
        setHomeScreenSummary(visible.length ? visible.join(", ") : "Nothing shown");
      } else {
        setHomeScreenSummary("Clock, Tasks");
      }

      const savedFreq = store["backup_frequency"];
      if (savedFreq) setBackupFrequency(savedFreq);
      const savedLast = store["last_backup"];
      if (savedLast) setLastBackup(savedLast);
    }, [])
  );

  useEffect(() => {
    if (params.newChecklist) {
      const newChecklistParam = Array.isArray(params.newChecklist)
        ? params.newChecklist[0]
        : params.newChecklist;
      try {
        const newList = JSON.parse(newChecklistParam);
        if (newList.title) {
          const { addChecklist } = require("../activitiesStore");
          addChecklist({
            title: newList.title,
            icon: newList.icon,
            items: []
          });
        }
      } catch (e) {
        console.warn("Failed to parse new checklist", e);
      }
    }
  }, [params.newChecklist]);

  const collectAllData = (): AppData => {
    return {
      version: "2026.1.0",
      timestamp: new Date().toISOString(),
      checklists: getChecklists(),
      tasks_today: store["tasks_today"] ? JSON.parse(store["tasks_today"]) : [],
      tasks_tomorrow: store["tasks_tomorrow"] ? JSON.parse(store["tasks_tomorrow"]) : [],
      home_tasks: store["home_tasks"] ? JSON.parse(store["home_tasks"]) : [],
      calendar_events: store["calendar_events"] ? JSON.parse(store["calendar_events"]) : {},
      notes: store["notes"] ? JSON.parse(store["notes"]) : [],
      vault_files: store["vault_files"] ? JSON.parse(store["vault_files"]) : [],
      day_start: store["day_start"] || "00:00",
      backup_frequency: store["backup_frequency"] || "manual",
      home_screen_settings: store["home_screen_settings"] || {
        showClock: true,
        showTasks: true,
        showSummary: false,
        showHistory: false
      }
    };
  };

  const handleCreateBackup = async () => {
    try {
      const data = collectAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `ixi_backup_${new Date().toISOString().split("T")[0]}.json`;
      const tempPath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(tempPath, jsonString);

      if (Platform.OS === "android") {
        await Sharing.shareAsync(tempPath, {
          mimeType: "application/json",
          dialogTitle: "Save Backup",
          UTI: "public.json"
        });
      }

      const now = new Date();
      const dateStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
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
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const jsonString = await FileSystem.readAsStringAsync(fileUri);
        const data: AppData = JSON.parse(jsonString);

        if (!data.version || !data.timestamp) {
          Alert.alert("Invalid Backup", "This file is not a valid Shimer backup.");
          return;
        }

        Alert.alert(
          "Restore Backup",
          `Restore backup from ${new Date(data.timestamp).toLocaleString()}? This will replace all current data.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Restore",
              onPress: () => {
                if (data.checklists) {
                  const { setChecklists } = require("../activitiesStore");
                  setChecklists(data.checklists);
                }
                if (data.tasks_today) store["tasks_today"] = JSON.stringify(data.tasks_today);
                if (data.tasks_tomorrow) store["tasks_tomorrow"] = JSON.stringify(data.tasks_tomorrow);
                if (data.home_tasks) store["home_tasks"] = JSON.stringify(data.home_tasks);
                if (data.calendar_events) store["calendar_events"] = JSON.stringify(data.calendar_events);
                if (data.notes) store["notes"] = JSON.stringify(data.notes);
                if (data.vault_files) store["vault_files"] = JSON.stringify(data.vault_files);
                if (data.day_start) store["day_start"] = data.day_start;
                if (data.backup_frequency) store["backup_frequency"] = data.backup_frequency;
                if (data.home_screen_settings) store["home_screen_settings"] = data.home_screen_settings;

                setBackupFrequency(data.backup_frequency || "manual");
                setDayStart(data.day_start || "00:00");
                const homeSettings = data.home_screen_settings || {
                  showClock: true, showTasks: true, showSummary: false, showHistory: false
                };
                const visible = [];
                if (homeSettings.showClock) visible.push("Clock");
                if (homeSettings.showTasks) visible.push("Tasks");
                if (homeSettings.showSummary) visible.push("Summary");
                if (homeSettings.showHistory) visible.push("History");
                setHomeScreenSummary(visible.length ? visible.join(", ") : "Nothing shown");

                Alert.alert("Restored", "All data has been restored successfully.");
                setShowBackupModal(false);
              }
            }
          ]
        );
      }
    } catch {
      Alert.alert("Error", "Failed to restore backup.");
    }
  };

  const handleBackupNow = () => handleCreateBackup();
  const selectFrequency = (freq: string) => {
    setBackupFrequency(freq);
    store["backup_frequency"] = freq;
  };

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View style={styles.sectionHeaderContainer}>
      <Ionicons name={icon as any} size={16} color="#fff" />
      <Text style={styles.sectionHeader}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with back arrow */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={shadcn.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* How to Use & What's New */}
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/how-to-use"); }}>
          <Ionicons name="information-circle-outline" size={22} color={shadcn.colors.mutedForeground} />
          <Text style={styles.rowText}>How to Use the App</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/whats-new"); }}>
          <Ionicons name="sparkles-outline" size={22} color={shadcn.colors.mutedForeground} />
          <Text style={styles.rowText}>What&apos;s New</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* CHECKLISTS */}
        <SectionHeader icon="" title="CHECKLISTS" />
        {checklists.map((list, index) => (
          <TouchableOpacity
            key={index}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              lightHaptic();
              router.push({ pathname: "/edit-checklist", params: { checklistIndex: index.toString() } });
            }}
          >
            <Ionicons name={list.icon as any} size={22} color={shadcn.colors.foreground} />
            <Text style={styles.rowText}>{list.title}</Text>
            <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/new-checklist"); }}>
          <Ionicons name="add-circle-outline" size={22} color={shadcn.colors.mutedForeground} />
          <Text style={[styles.rowText, { color: shadcn.colors.mutedForeground }]}>New Checklist</Text>
        </TouchableOpacity>

        {/* SHORTCUTS */}
        <SectionHeader icon="" title="SHORTCUTS" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/new-shortcut"); }}>
          <Ionicons name="add-circle-outline" size={22} color={shadcn.colors.mutedForeground} />
          <Text style={[styles.rowText, { color: shadcn.colors.mutedForeground }]}>New Shortcut</Text>
        </TouchableOpacity>

        {/* NOTES */}
        <SectionHeader icon="" title="NOTES" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/new-note"); }}>
          <Ionicons name="add-circle-outline" size={22} color={shadcn.colors.mutedForeground} />
          <Text style={[styles.rowText, { color: shadcn.colors.mutedForeground }]}>New Note</Text>
        </TouchableOpacity>

        {/* SETTINGS */}
        <SectionHeader icon="" title="SETTINGS" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/folders"); }}>
          <Ionicons name="folder-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Folders</Text>
          <Text style={styles.valueText}>{foldersCount}</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/day-start"); }}>
          <Ionicons name="time-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Day Start</Text>
          <Text style={styles.valueText}>{dayStart}</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/home-screen-settings"); }}>
          <Ionicons name="home-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Home Screen</Text>
          <Text style={styles.valueText}>{homeScreenSummary}</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* BACKUPS */}
        <SectionHeader icon="" title="BACKUPS" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); handleCreateBackup(); }}>
          <Ionicons name="cloud-upload-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Create Backup</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); handleRestoreBackup(); }}>
          <Ionicons name="cloud-download-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Restore Backup</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); setShowBackupModal(true); }}>
          <Ionicons name="sync-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Auto Backup</Text>
          <Text style={styles.valueText}>
            {backupFrequency === "manual" ? "Manual" : backupFrequency === "daily" ? "Daily" : backupFrequency === "weekly" ? "Weekly" : "Monthly"}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* NOTIFICATIONS */}
        <SectionHeader icon="" title="NOTIFICATIONS" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <Ionicons name="alarm-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Time to Break</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <Ionicons name="timer-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Timer Overdue</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Persistent Notification</Text>
          <Text style={styles.valueText}>Not Granted</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* SECURE FILE */}
        <SectionHeader icon="" title="SECURE FILE" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/secure-files"); }}>
          <Ionicons name="lock-closed-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Secure File Vault</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* ABOUT */}
        <SectionHeader icon="" title="ABOUT" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/ask-question"); }}>
          <Ionicons name="help-circle-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Ask a Question</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/open-source"); }}>
          <Ionicons name="code-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Open Source</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/privacy"); }}>
          <Ionicons name="shield-outline" size={22} color={shadcn.colors.foreground} />
          <Text style={styles.rowText}>Privacy</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Shimer</Text>
          <Text style={styles.versionText}>v2026.1.0</Text>
        </View>
      </ScrollView>

      {/* Backup Modal */}
      <Modal visible={showBackupModal} transparent animationType="slide" onRequestClose={() => setShowBackupModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowBackupModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Backup Settings</Text>
              <TouchableOpacity onPress={() => setShowBackupModal(false)}>
                <Ionicons name="close" size={24} color={shadcn.colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionHeader}>FREQUENCY</Text>
            {["manual", "daily", "weekly", "monthly"].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[styles.modalOption, backupFrequency === freq && styles.modalOptionSelected]}
                activeOpacity={0.7}
                onPress={() => selectFrequency(freq)}
              >
                <Ionicons
                  name={freq === "manual" ? "hand-left-outline" : freq === "daily" ? "today-outline" : freq === "weekly" ? "calendar-outline" : "calendar-number-outline"}
                  size={22}
                  color={backupFrequency === freq ? "#fff" : shadcn.colors.foreground}
                />
                <Text style={[styles.modalOptionText, backupFrequency === freq && styles.modalOptionTextSelected]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
                {backupFrequency === freq && <Ionicons name="checkmark" size={20} color="#fff" />}
              </TouchableOpacity>
            ))}

            <Text style={[styles.modalSectionHeader, { marginTop: 24 }]}>LAST BACKUP</Text>
            <Text style={styles.lastBackupText}>{lastBackup}</Text>

            <TouchableOpacity style={styles.backupNowButton} activeOpacity={0.8} onPress={handleBackupNow}>
              <Ionicons name="cloud-upload" size={22} color="#000" />
              <Text style={styles.backupNowText}>Create Backup Now</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: shadcn.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomColor: shadcn.colors.border,
    marginBottom: shadcn.spacing.lg,
  },
  headerLeft: {
    position: 'absolute',
    left: 16,
    top: 60,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    top: 60,
  },
  headerTitle: {
    color: shadcn.colors.foreground,
    fontSize: 20,
    fontWeight: "600",
    textAlign: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: shadcn.spacing.lg, paddingBottom: 40 },
  sectionHeaderContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: shadcn.spacing.xxl, marginBottom: shadcn.spacing.sm, marginLeft: shadcn.spacing.sm },
  sectionHeader: { ...shadcn.typography.sectionHeader, color: shadcn.colors.mutedForeground },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: shadcn.colors.card, paddingVertical: shadcn.spacing.md, paddingHorizontal: shadcn.spacing.md, borderRadius: shadcn.radius.lg, marginBottom: shadcn.spacing.xs, gap: shadcn.spacing.md },
  rowText: { ...shadcn.typography.body, color: shadcn.colors.foreground, flex: 1 },
  badge: { ...shadcn.typography.caption, color: "#fff", marginRight: shadcn.spacing.sm },
  valueText: { ...shadcn.typography.caption, color: "#fff", marginRight: shadcn.spacing.sm },
  versionContainer: { marginTop: 40, marginBottom: 20, alignItems: "center" },
  versionText: { ...shadcn.typography.caption, color: shadcn.colors.mutedForeground, marginTop: shadcn.spacing.xs },
  emptyText: { ...shadcn.typography.bodySmall, color: shadcn.colors.mutedForeground, textAlign: "center", marginVertical: shadcn.spacing.md },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: shadcn.colors.popover, borderTopLeftRadius: shadcn.radius.xl, borderTopRightRadius: shadcn.radius.xl, padding: shadcn.spacing.xxl, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: shadcn.spacing.lg },
  modalTitle: { ...shadcn.typography.body, fontWeight: "600", color: shadcn.colors.popoverForeground },
  modalSectionHeader: { ...shadcn.typography.sectionHeader, color: shadcn.colors.mutedForeground, marginBottom: shadcn.spacing.sm },
  modalOption: { flexDirection: "row", alignItems: "center", backgroundColor: shadcn.colors.secondary, paddingVertical: shadcn.spacing.md + 4, paddingHorizontal: shadcn.spacing.md, borderRadius: shadcn.radius.lg, marginBottom: shadcn.spacing.sm, gap: shadcn.spacing.md },
  modalOptionSelected: { backgroundColor: shadcn.colors.accent, borderWidth: 1, borderColor: "#fff" },
  modalOptionText: { ...shadcn.typography.body, color: shadcn.colors.foreground, flex: 1 },
  modalOptionTextSelected: { color: "#fff", fontWeight: "600" },
  lastBackupText: { ...shadcn.typography.bodySmall, color: shadcn.colors.mutedForeground, marginBottom: shadcn.spacing.xl },
  backupNowButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", paddingVertical: shadcn.spacing.md + 4, borderRadius: shadcn.radius.lg, gap: shadcn.spacing.sm, marginBottom: shadcn.spacing.md },
  backupNowText: { ...shadcn.typography.body, fontWeight: "700", color: "#000" }
});
