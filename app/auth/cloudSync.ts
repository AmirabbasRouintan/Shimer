import { AUTH_CONFIG } from "../../constants/auth";
import * as Store from "../activitiesStore";
import { store } from "../miscStore";

export interface SyncStatus {
  state: "idle" | "syncing" | "synced" | "pending" | "offline" | "error";
  lastSyncedAt: string | null;
  message: string;
}

export interface AllAppData {
  activities: any[];
  checklists: any[];
  goals: any[];
  folders: any[];
  historyLogs: any[];
  calendarEvents: Record<string, any[]>;
  dayStart: string;
  selectedChecklistIndex: number;
  showChecklistOnHome: boolean;
  maxPausedActivities: number;
  dailyPlan: any;
  planCompletedItems: Record<string, boolean>;
  activeTimer: any;
  suspendedGoal: any;
  suspendedActivities: any[];
  home_screen_settings?: any;
  tasks_today?: any[];
  tasks_tomorrow?: any[];
  home_tasks?: any[];
  notes?: any[];
  vault_files?: any[];
  vault_lock_type?: string;
  vault_password?: string;
  vault_pattern?: string;
  vault_failed_attempts?: number;
  backup_frequency?: string;
  last_backup?: string;
  version?: string;
  timestamp?: string;
}

function parseMisc(key: string, fallback: any): any {
  const value = store[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

export function collectAllData(): AllAppData {
  return {
    activities: Store.getActivities(),
    checklists: Store.getChecklists(),
    goals: Store.getGoals(),
    folders: Store.getFolders(),
    historyLogs: Store.getHistoryLogs(),
    calendarEvents: Store.getCalendarEvents(),
    dayStart: Store.getDayStart(),
    selectedChecklistIndex: Store.getSelectedChecklistIndex(),
    showChecklistOnHome: Store.getShowChecklistOnHome(),
    maxPausedActivities: Store.getMaxPausedActivities(),
    dailyPlan: Store.getDailyPlan(),
    planCompletedItems: Store.getAllPlanCompletedItems(),
    activeTimer: Store.getActiveTimer(),
    suspendedGoal: Store.getSuspendedGoal(),
    suspendedActivities: Store.getSuspendedActivities(),
    home_screen_settings: parseMisc("home_screen_settings", undefined),
    tasks_today: parseMisc("tasks_today", undefined),
    tasks_tomorrow: parseMisc("tasks_tomorrow", undefined),
    home_tasks: parseMisc("home_tasks", undefined),
    notes: parseMisc("notes", undefined),
    vault_files: parseMisc("vault_files", undefined),
    vault_lock_type: parseMisc("vault_lock_type", undefined),
    vault_password: parseMisc("vault_password", undefined),
    vault_pattern: parseMisc("vault_pattern", undefined),
    vault_failed_attempts: parseMisc("vault_failed_attempts", undefined),
    backup_frequency: parseMisc("backup_frequency", undefined),
    last_backup: parseMisc("last_backup", undefined),
    version: "2026.1.0",
    timestamp: new Date().toISOString(),
  };
}

export function loadAllData(data: AllAppData) {
  if (data.activities) Store.setActivities(data.activities);
  if (data.checklists) Store.setChecklists(data.checklists);
  if (data.goals) Store.setGoals(data.goals);
  if (data.folders) Store.setFolders(data.folders);
  if (data.historyLogs) Store.replaceHistoryLogs(data.historyLogs);
  if (data.calendarEvents) Store.setCalendarEvents(data.calendarEvents);
  if (data.dayStart !== undefined) Store.setDayStart(data.dayStart);
  if (data.selectedChecklistIndex !== undefined) Store.setSelectedChecklistIndex(data.selectedChecklistIndex);
  if (data.showChecklistOnHome !== undefined) Store.setShowChecklistOnHome(data.showChecklistOnHome);
  if (data.maxPausedActivities !== undefined) Store.setMaxPausedActivities(data.maxPausedActivities);
  if (data.dailyPlan !== undefined) Store.setDailyPlan(data.dailyPlan);
  if (data.planCompletedItems) {
    for (const [key, value] of Object.entries(data.planCompletedItems)) {
      Store.setPlanCompletedItem(key, value);
    }
  }
  if (data.activeTimer) Store.setActiveTimer(data.activeTimer);
  if (data.suspendedGoal !== undefined) Store.setSuspendedGoal(data.suspendedGoal);
  if (data.suspendedActivities) Store.setSuspendedActivities(data.suspendedActivities);

  const miscKeys: [string, any][] = [
    ["home_screen_settings", data.home_screen_settings],
    ["tasks_today", data.tasks_today],
    ["tasks_tomorrow", data.tasks_tomorrow],
    ["home_tasks", data.home_tasks],
    ["notes", data.notes],
    ["vault_files", data.vault_files],
    ["vault_lock_type", data.vault_lock_type],
    ["vault_password", data.vault_password],
    ["vault_pattern", data.vault_pattern],
    ["vault_failed_attempts", data.vault_failed_attempts],
    ["backup_frequency", data.backup_frequency],
    ["last_backup", data.last_backup],
  ];
  for (const [key, value] of miscKeys) {
    if (value !== undefined) store[key] = value;
  }
}

// Stable string representation of the data for change detection.
export function fingerprint(data: AllAppData): string {
  const copy: Record<string, any> = { ...data };
  delete copy.timestamp;
  return JSON.stringify(copy);
}

export async function syncToCloud(token: string): Promise<void> {
  const data = collectAllData();
  const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/data`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error("Failed to sync data to cloud");
}

export async function syncFromCloud(token: string): Promise<{ data: AllAppData; updatedAt: string | null }> {
  const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/data`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch cloud data");
  return res.json();
}

export async function fetchCloudFingerprint(token: string): Promise<string | null> {
  try {
    const result = await syncFromCloud(token);
    if (!result.data || Object.keys(result.data).length === 0) return null;
    return fingerprint(result.data);
  } catch {
    return null;
  }
}

export async function checkCloudData(token: string): Promise<boolean> {
  try {
    const result = await syncFromCloud(token);
    const data = result.data;
    return data !== null && Array.isArray(data.activities) && data.activities.length > 0;
  } catch {
    return false;
  }
}
