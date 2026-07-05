import { AUTH_CONFIG } from "../../constants/auth";
import * as Store from "../activitiesStore";

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

export async function syncFromCloud(token: string): Promise<{ data: AllAppData }> {
  const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/api/data`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch cloud data");
  return res.json();
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
