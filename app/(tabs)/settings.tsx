// app/settings.tsx
import { Ionicons } from "@expo/vector-icons";
import { getChecklists, subscribe, Checklist, getFolders, getDayStart, getDailyPlan, getActivities, getGoals, getHistoryLogs, getMaxPausedActivities, getActiveTimer, getSuspendedGoal, getSuspendedActivities, getAllPlanCompletedItems } from "../activitiesStore";

import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { File, Directory, Paths } from 'expo-file-system';
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { shadcn } from "../../constants/components-theme";
import CustomAlert from "../components/CustomAlert";
import { useAuth } from "../auth/AuthContext";

interface AppData {
  version: string;
  timestamp: string;
  activities: any[];
  checklists: any[];
  goals: any[];
  folders: any[];
  historyLogs: any[];
  calendar_events: Record<string, any>;
  notes: any[];
  vault_files: any[];
  vault_lock_type?: string;
  vault_password?: string;
  vault_pattern?: string;
  vault_failed_attempts?: number;
  day_start: string;
  backup_frequency: string;
  last_backup: string;
  selectedChecklistIndex: number;
  showChecklistOnHome: boolean;
  maxPausedActivities: number;
  dailyPlan: any;
  planCompletedItems: Record<string, boolean>;
  home_screen_settings: {
    showClock: boolean;
    showTasks: boolean;
    showSummary: boolean;
    showHistory: boolean;
  };
  tasks_today: any[];
  tasks_tomorrow: any[];
  home_tasks: any[];
  activeTimer: any;
  suspendedGoal: any;
  suspendedActivities: any[];
}

const store: Record<string, any> = {};

const lightHaptic = () => {
  if (Platform.OS !== "web") Vibration.vibrate(10);
};


export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showBackupAlert, setShowBackupAlert] = useState(false);
  const [showAutoBackupModal, setShowAutoBackupModal] = useState(false);

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [foldersCount, setFoldersCount] = useState(0);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState("manual");
  const [lastBackup, setLastBackup] = useState("Never");
  const [dayStart, setDayStart] = useState("00:00");
  const [homeScreenSummary, setHomeScreenSummary] = useState("Clock, Tasks");
  const [lastPlannedDate, setLastPlannedDate] = useState<{ date: string; plan: any } | null>(null);
  const [plannedDatesCount, setPlannedDatesCount] = useState(0);
  const [showNotesUnavailableAlert, setShowNotesUnavailableAlert] = useState(false);
  const [showSecureFilesUnavailableAlert, setShowSecureFilesUnavailableAlert] = useState(false);
  const [showShortcutUnavailableAlert, setShowShortcutUnavailableAlert] = useState(false);

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

  // Load last planned date
  useEffect(() => {
    const loadLastPlannedDate = () => {
      const allPlans = getDailyPlan() || {};
      const dates = Object.keys(allPlans)
        .filter(key => allPlans[key] !== null)
        .sort((a, b) => b.localeCompare(a));

      setPlannedDatesCount(dates.length);

      if (dates.length > 0) {
        const latestDate = dates[0];
        setLastPlannedDate({
          date: latestDate,
          plan: allPlans[latestDate]
        });
      } else {
        setLastPlannedDate(null);
      }
    };

    loadLastPlannedDate();
    const unsubscribe = subscribe(loadLastPlannedDate);
    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const savedDayStart = getDayStart();
      if (savedDayStart) {
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
      activities: require("../activitiesStore").getActivities(),
      checklists: getChecklists(),
      goals: require("../activitiesStore").getGoals(),
      folders: getFolders(),
      historyLogs: require("../activitiesStore").getHistoryLogs(),
      calendar_events: require("../activitiesStore").getCalendarEvents(),
      notes: store["notes"] ? JSON.parse(store["notes"]) : [],
      vault_files: store["vault_files"] ? JSON.parse(store["vault_files"]) : [],
      vault_lock_type: store["vault_lock_type"] || undefined,
      vault_password: store["vault_password"] || undefined,
      vault_pattern: store["vault_pattern"] || undefined,
      vault_failed_attempts: store["vault_failed_attempts"] || 0,
      day_start: require("../activitiesStore").getDayStart(),
      backup_frequency: store["backup_frequency"] || "manual",
      last_backup: store["last_backup"] || "Never",
      selectedChecklistIndex: require("../activitiesStore").getSelectedChecklistIndex(),
      showChecklistOnHome: require("../activitiesStore").getShowChecklistOnHome(),
      maxPausedActivities: getMaxPausedActivities(),
      dailyPlan: getDailyPlan(),
      planCompletedItems: getAllPlanCompletedItems(),
      home_screen_settings: store["home_screen_settings"] || {
        showClock: true,
        showTasks: true,
        showSummary: false,
        showHistory: false
      },
      tasks_today: store["tasks_today"] ? JSON.parse(store["tasks_today"]) : [],
      tasks_tomorrow: store["tasks_tomorrow"] ? JSON.parse(store["tasks_tomorrow"]) : [],
      home_tasks: store["home_tasks"] ? JSON.parse(store["home_tasks"]) : [],
      activeTimer: getActiveTimer(),
      suspendedGoal: getSuspendedGoal(),
      suspendedActivities: getSuspendedActivities(),
    };
  };

  const saveToPhoneStorage = async (fileUri: string, fileName: string) => {
    try {
      const directory = await Directory.pickDirectoryAsync();
      const content = await new File(fileUri).text();
      const newFile = directory.createFile(fileName.replace('.json', ''), "application/json");
      await newFile.write(content);
      Alert.alert("Success", "Backup saved successfully!");
    } catch (error: any) {
      if (error?.message?.includes('cancel') || error?.message?.includes('Cancel')) return;
      console.error("Save to storage error:", error);
      Alert.alert("Error", "Could not save file. Please try again.");
    }
  };

  const handleCreateBackup = async (action: 'save' | 'share') => {
    setIsCreatingBackup(true);

    try {
      const data = collectAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `shimer_backup_${new Date().toISOString().split("T")[0]}.json`;

      const cacheDir = new Directory(Paths.cache);
      const tempFile = new File(cacheDir, fileName);
      tempFile.create({ intermediates: true, overwrite: true });
      tempFile.write(jsonString);

      const now = new Date();
      const dateStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      setLastBackup(dateStr);
      store["last_backup"] = dateStr;

      if (action === 'share') {
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(tempFile.uri, {
            mimeType: "application/json",
            dialogTitle: "Share Shimer Backup",
            UTI: "public.json",
          });
          Alert.alert("Success", "Backup shared successfully!");
        } else {
          Alert.alert("Error", "Sharing is not available on this device.");
        }
      } else if (action === 'save') {
        await saveToPhoneStorage(tempFile.uri, fileName);
      }

      setTimeout(async () => {
        try {
          await tempFile.delete();
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 5000);

    } catch (error) {
      console.error("Backup error:", error);
      Alert.alert("Error", "Failed to create backup. Please try again.");
    } finally {
      setIsCreatingBackup(false);
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
        const selectedFile = new File(fileUri);
        const jsonString = await selectedFile.text();
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
              style: "destructive",
              onPress: async () => {
                try {
                  const { setActivities, setChecklists, setGoals, setFolders, replaceHistoryLogs, setCalendarEvents, setSelectedChecklistIndex, setShowChecklistOnHome, setDayStart, setDailyPlan, setPlanCompletedItem, setMaxPausedActivities, setActiveTimer, setSuspendedGoal, setSuspendedActivities } = require("../activitiesStore");

                  if (data.activities) setActivities(data.activities);
                  if (data.checklists) setChecklists(data.checklists);
                  if (data.goals) setGoals(data.goals);
                  if (data.folders) setFolders(data.folders);
                  if (data.historyLogs) replaceHistoryLogs(data.historyLogs);
                  if (data.calendar_events) setCalendarEvents(data.calendar_events);
                  if (data.tasks_today) store["tasks_today"] = JSON.stringify(data.tasks_today);
                  if (data.tasks_tomorrow) store["tasks_tomorrow"] = JSON.stringify(data.tasks_tomorrow);
                  if (data.home_tasks) store["home_tasks"] = JSON.stringify(data.home_tasks);
                  if (data.notes) store["notes"] = JSON.stringify(data.notes);
                  if (data.vault_files) store["vault_files"] = JSON.stringify(data.vault_files);
                  if (data.vault_lock_type !== undefined) store["vault_lock_type"] = data.vault_lock_type;
                  if (data.vault_password !== undefined) store["vault_password"] = data.vault_password;
                  if (data.vault_pattern !== undefined) store["vault_pattern"] = data.vault_pattern;
                  if (data.vault_failed_attempts !== undefined) store["vault_failed_attempts"] = data.vault_failed_attempts;
                  if (data.day_start) setDayStart(data.day_start);
                  if (data.backup_frequency) store["backup_frequency"] = data.backup_frequency;
                  if (data.home_screen_settings) store["home_screen_settings"] = data.home_screen_settings;
                  if (data.selectedChecklistIndex !== undefined) setSelectedChecklistIndex(data.selectedChecklistIndex);
                  if (data.showChecklistOnHome !== undefined) setShowChecklistOnHome(data.showChecklistOnHome);
                  if (data.maxPausedActivities !== undefined) setMaxPausedActivities(data.maxPausedActivities);
                  if (data.dailyPlan !== undefined) setDailyPlan(data.dailyPlan);
                  if (data.planCompletedItems) {
                    for (const [key, value] of Object.entries(data.planCompletedItems)) {
                      setPlanCompletedItem(key, value);
                    }
                  }
                  if (data.activeTimer) setActiveTimer(data.activeTimer);
                  if (data.suspendedGoal !== undefined) setSuspendedGoal(data.suspendedGoal);
                  if (data.suspendedActivities) setSuspendedActivities(data.suspendedActivities);

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
                } catch (restoreError) {
                  console.error("Restore error:", restoreError);
                  Alert.alert("Error", "Failed to restore backup. The file may be corrupted.");
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Restore backup error:", error);
      Alert.alert("Error", "Failed to restore backup.");
    }
  };

  const handleBackupNow = () => setShowBackupAlert(true);

  const selectFrequency = (freq: string) => {
    setBackupFrequency(freq);
    store["backup_frequency"] = freq;
  };

  const openNotificationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const formatDisplayDate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View style={styles.sectionHeaderContainer}>
      <Ionicons name={icon as any} size={16} color="#fff" />
      <Text style={styles.sectionHeader}>{title}</Text>
    </View>
  );

  const { user, token, isLoading: authLoading, isSyncing, signInWithGoogle, signOut, syncLocalToCloud, syncCloudToLocal } = useAuth();

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
        {/* ACCOUNT */}
        <SectionHeader icon="person-outline" title="ACCOUNT" />
        {user ? (
          <>
            <View style={styles.userInfoRow}>
              {user.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={22} color="#fff" />
                </View>
              )}
              <View style={styles.userInfoText}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={syncLocalToCloud}
              disabled={isSyncing}
            >
              <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
              <Text style={styles.rowText}>
                {isSyncing ? "Syncing..." : "Sync Local → Cloud"}
              </Text>
              {isSyncing ? (
                <ActivityIndicator size="small" color={shadcn.colors.mutedForeground} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={syncCloudToLocal}
              disabled={isSyncing}
            >
              <Ionicons name="cloud-download-outline" size={22} color="#fff" />
              <Text style={styles.rowText}>
                {isSyncing ? "Syncing..." : "Sync Cloud → Local"}
              </Text>
              {isSyncing ? (
                <ActivityIndicator size="small" color={shadcn.colors.mutedForeground} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={signOut}>
              <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
              <Text style={[styles.rowText, { color: "#ff3b30" }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
            </TouchableOpacity>
          </>
        ) : authLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={shadcn.colors.mutedForeground} />
          </View>
        ) : (
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={signInWithGoogle}>
            <Ionicons name="logo-google" size={22} color="#fff" />
            <Text style={styles.rowText}>Sign in with Google</Text>
            <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
          </TouchableOpacity>
        )}

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

        {/* VOICE NOTES */}
        <SectionHeader icon="mic-outline" title="VOICE NOTES" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/voice-notes"); }}>
          <Ionicons name="mic-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Voice Notes</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* CHECKLISTS */}
        <SectionHeader icon="list-outline" title="CHECKLISTS" />
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
            <Ionicons name={list.icon as any} size={22} color="#fff" />
            <Text style={styles.rowText}>{list.title}</Text>
            <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/new-checklist"); }}>
          <Ionicons name="add-circle-outline" size={22} color={shadcn.colors.mutedForeground} />
          <Text style={[styles.rowText, { color: shadcn.colors.mutedForeground }]}>New Checklist</Text>
        </TouchableOpacity>

        {/* SHORTCUTS */}
        <SectionHeader icon="flash-outline" title="SHORTCUTS" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); setShowShortcutUnavailableAlert(true); }}>
          <Ionicons name="add-circle-outline" size={22} color={shadcn.colors.mutedForeground} />
          <Text style={[styles.rowText, { color: shadcn.colors.mutedForeground }]}>New Shortcut</Text>
        </TouchableOpacity>

        {/* NOTES */}
        <SectionHeader icon="document-text-outline" title="NOTES" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); setShowNotesUnavailableAlert(true); }}>
          <Ionicons name="folder-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Notes</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* JSON PLANNER */}
        <SectionHeader icon="code-slash" title="JSON PLANNER" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/calendar"); }}>
          <Ionicons name="code-slash" size={22} color="#fff" />
          <Text style={styles.rowText}>Calendar Planner</Text>
          <Text style={styles.valueText}>Create new plan</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/planned-dates"); }}>
          <Ionicons name="list-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>All Plans</Text>
          <Text style={styles.valueText}>{plannedDatesCount} {plannedDatesCount === 1 ? 'plan' : 'plans'}</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {lastPlannedDate && (
          <TouchableOpacity
            style={styles.lastPlanRow}
            activeOpacity={0.7}
            onPress={() => {
              const [year, month, day] = lastPlannedDate.date.split('-');
              router.push({
                pathname: '/calendar',
                params: {
                  openPlanner: 'true',
                  selectedYear: year,
                  selectedMonth: month,
                  selectedDay: day,
                }
              });
            }}
          >
            <Ionicons name="calendar-outline" size={22} color="#fff" />
            <View style={styles.lastPlanInfo}>
              <Text style={styles.rowText}>Last Plan</Text>
              <Text style={styles.lastPlanDate}>{formatDisplayDate(lastPlannedDate.date)}</Text>
              {lastPlannedDate.plan.name && (
                <Text style={styles.lastPlanName} numberOfLines={1}>{lastPlannedDate.plan.name}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* SETTINGS */}
        <SectionHeader icon="settings-outline" title="SETTINGS" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/folders"); }}>
          <Ionicons name="folder-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Folders</Text>
          <Text style={styles.valueText}>{foldersCount}</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/day-start"); }}>
          <Ionicons name="time-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Day Start</Text>
          <Text style={styles.valueText}>{dayStart}</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/home-screen-settings"); }}>
          <Ionicons name="home-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Home Screen</Text>
          <Text style={styles.valueText}>{homeScreenSummary}</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* BACKUPS */}
        <SectionHeader icon="cloud-outline" title="BACKUPS" />
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={handleBackupNow}
          disabled={isCreatingBackup}
        >
          {isCreatingBackup ? (
            <ActivityIndicator size="small" color={shadcn.colors.mutedForeground} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
          )}
          <Text style={styles.rowText}>
            {isCreatingBackup ? "Creating Backup..." : "Create Backup"}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleRestoreBackup}>
          <Ionicons name="cloud-download-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Restore Backup</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setShowAutoBackupModal(true)}>
          <Ionicons name="sync-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Auto Backup</Text>
          <Text style={styles.valueText}>
            {backupFrequency === "manual" ? "Manual" : backupFrequency === "daily" ? "Daily" : backupFrequency === "weekly" ? "Weekly" : "Monthly"}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* NOTIFICATIONS */}
        <SectionHeader icon="notifications-outline" title="NOTIFICATIONS" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openNotificationSettings}>
          <Ionicons name="alarm-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Time to Break</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openNotificationSettings}>
          <Ionicons name="timer-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Timer Overdue</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openNotificationSettings}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Persistent Notification</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* SECURE FILE */}
        <SectionHeader icon="lock-closed-outline" title="SECURE FILE" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); setShowSecureFilesUnavailableAlert(true); }}>
          <Ionicons name="lock-closed-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Secure File Vault</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        {/* ABOUT */}
        <SectionHeader icon="information-circle-outline" title="ABOUT" />
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/ask-question"); }}>
          <Ionicons name="help-circle-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Ask a Question</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/open-source"); }}>
          <Ionicons name="code-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Open Source</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => { lightHaptic(); router.push("/privacy"); }}>
          <Ionicons name="shield-outline" size={22} color="#fff" />
          <Text style={styles.rowText}>Privacy</Text>
          <Ionicons name="chevron-forward" size={18} color={shadcn.colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Shimer</Text>
          <Text style={styles.versionText}>v2026.1.0</Text>
        </View>
      </ScrollView>

      {/* Backup Options - Apple Style Alert */}
      <CustomAlert
        visible={showBackupAlert}
        title="Backup"
        message="Choose how to save your backup"
        confirmText="Storage"
        cancelText="Cancel"
        thirdButtonText="Share"
        onThirdButton={() => { setShowBackupAlert(false); handleCreateBackup('share'); }}
        onConfirm={() => { setShowBackupAlert(false); handleCreateBackup('save'); }}
        onCancel={() => setShowBackupAlert(false)}
      />

      {/* Auto Backup Modal */}
      <Modal visible={showAutoBackupModal} transparent animationType="fade">
        <View style={styles.autoBackupOverlay}>
          <View style={styles.autoBackupModal}>
            <Text style={styles.autoBackupTitle}>Auto Backup</Text>
            <Text style={styles.autoBackupSubtitle}>Choose backup frequency</Text>
            <View style={styles.autoBackupDivider} />
            {["manual", "daily", "weekly", "monthly"].map((freq) => {
              const label = freq.charAt(0).toUpperCase() + freq.slice(1);
              const selected = backupFrequency === freq;
              return (
                <TouchableOpacity
                  key={freq}
                  style={styles.autoBackupOption}
                  activeOpacity={0.7}
                  onPress={() => { selectFrequency(freq); setShowAutoBackupModal(false); }}
                >
                  <Text style={[styles.autoBackupOptionText, selected && styles.autoBackupOptionTextSelected]}>
                    {label}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={20} color="#007aff" />}
                </TouchableOpacity>
              );
            })}
            <View style={styles.autoBackupDivider} />
            <TouchableOpacity
              style={styles.autoBackupCancelButton}
              activeOpacity={0.7}
              onPress={() => setShowAutoBackupModal(false)}
            >
              <Text style={styles.autoBackupCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={showNotesUnavailableAlert}
        title="Coming Soon"
        message="This feature is not available in this version. The developer will release it in a future update."
        onConfirm={() => setShowNotesUnavailableAlert(false)}
        confirmText="OK"
        singleButton
      />
      <CustomAlert
        visible={showSecureFilesUnavailableAlert}
        title="Coming Soon"
        message="This feature is not available in this version. The developer will release it in a future update."
        onConfirm={() => setShowSecureFilesUnavailableAlert(false)}
        confirmText="OK"
        singleButton
      />
      <CustomAlert
        visible={showShortcutUnavailableAlert}
        title="Coming Soon"
        message="This feature is not available in this version. The developer will release it in a future update."
        onConfirm={() => setShowShortcutUnavailableAlert(false)}
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
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: shadcn.colors.card,
    paddingVertical: shadcn.spacing.md,
    paddingHorizontal: shadcn.spacing.md,
    borderRadius: shadcn.radius.lg,
    marginBottom: shadcn.spacing.xs,
    gap: shadcn.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    color: shadcn.colors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    color: shadcn.colors.mutedForeground,
    fontSize: 13,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: shadcn.colors.card,
    paddingVertical: shadcn.spacing.lg,
    borderRadius: shadcn.radius.lg,
    marginBottom: shadcn.spacing.xs,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: shadcn.spacing.lg, paddingBottom: 40 },
  sectionHeaderContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: shadcn.spacing.xxl, marginBottom: shadcn.spacing.sm, marginLeft: shadcn.spacing.sm },
  sectionHeader: { ...shadcn.typography.sectionHeader, color: shadcn.colors.mutedForeground },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: shadcn.colors.card, paddingVertical: shadcn.spacing.md, paddingHorizontal: shadcn.spacing.md, borderRadius: shadcn.radius.lg, marginBottom: shadcn.spacing.xs, gap: shadcn.spacing.md },
  rowText: { ...shadcn.typography.body, color: shadcn.colors.foreground, flex: 1 },
  badge: { ...shadcn.typography.caption, color: "#fff", marginRight: shadcn.spacing.sm },
  valueText: { ...shadcn.typography.caption, color: "#fff", marginRight: shadcn.spacing.sm },
  lastPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: shadcn.colors.card,
    paddingVertical: shadcn.spacing.md,
    paddingHorizontal: shadcn.spacing.md,
    borderRadius: shadcn.radius.lg,
    marginBottom: shadcn.spacing.xs,
    gap: shadcn.spacing.md,
  },
  lastPlanInfo: {
    flex: 1,
  },
  lastPlanDate: {
    color: shadcn.colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  lastPlanName: {
    color: shadcn.colors.foreground,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  versionContainer: { marginTop: 40, marginBottom: 20, alignItems: "center" },
  versionText: { ...shadcn.typography.caption, color: shadcn.colors.mutedForeground, marginTop: shadcn.spacing.xs },
  emptyText: { ...shadcn.typography.bodySmall, color: shadcn.colors.mutedForeground, textAlign: "center", marginVertical: shadcn.spacing.md },

  // Auto Backup Modal Styles
  autoBackupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  autoBackupModal: {
    backgroundColor: '#0f0f11',
    borderRadius: 14,
    width: '85%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  autoBackupTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 20,
  },
  autoBackupSubtitle: {
    color: '#8e8e93',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  autoBackupDivider: {
    height: 0.5,
    backgroundColor: '#38383a',
  },
  autoBackupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  autoBackupOptionText: {
    color: '#007aff',
    fontSize: 17,
  },
  autoBackupOptionTextSelected: {
    color: '#007aff',
    fontWeight: '600',
  },
  autoBackupCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  autoBackupCancelText: {
    color: '#ff3b30',
    fontSize: 17,
    fontWeight: '500',
  },
});
