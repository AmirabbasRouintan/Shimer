// app/activitiesStore.ts
import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system';

export interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  keepScreenOn: boolean;
  pomodoro: number;
  goals: string;
  timerHints: string;
  checklists: string[];
  shortcuts: string[];
  linkedGoalIds?: number[];
  linkedChecklistIndex?: number | null;
}

export interface ChecklistItem {
  text: string;
  completed: boolean;
}

export interface Checklist {
  title: string;
  icon: string;
  items: ChecklistItem[];
}

export interface Goal {
  id: number;
  title: string;
  progress: number;
  color: string;
  emoji: string;
  isActive: boolean;
  isCompleted: boolean;
  widthPercent: number;
  remainingSeconds: number | null;
  totalSeconds?: number | null;
  selectedDays?: string[];
  duration?: string;
  trackEntireActivity?: boolean;
  checklist?: { title: string; icon: string; index: number } | null;
  shortcuts?: string;
}

export interface Folder {
  name: string;
  items: string[];
}

export interface HistoryLog {
  id: string;
  type: 'activity' | 'goal' | 'break';
  title: string;
  color: string;
  durationSeconds: number;
  durationMinutes: number;
  durationFormatted: string;
  timestamp: number;
  date: string;
}

export interface ActiveTimerData {
  activityName: string;
  activityColor: string;
  durationSeconds: number;
  startTime: number;
  userSelectedDuration?: number;
}

export interface SuspendedGoalData {
  id: number;
  remainingSeconds: number;
  color: string;
  title: string;
  totalSeconds?: number;
  userDuration?: number;
}

export interface SuspendedActivityData {
  name: string;
  color: string;
  remainingSeconds: number;
  userDuration?: number;
}

// Default activities
const defaultActivities: Activity[] = [
  { id: "5", name: "Work", icon: "briefcase-outline", color: "#96CEB4", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [], linkedGoalIds: [], linkedChecklistIndex: null },
  { id: "6", name: "Hobby", icon: "heart-outline", color: "#4ECDC4", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [], linkedGoalIds: [], linkedChecklistIndex: null },
  { id: "7", name: "Personal development", icon: "star-outline", color: "#FFEAA7", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [], linkedGoalIds: [], linkedChecklistIndex: null },
  { id: "8", name: "Exercises/Health", icon: "fitness-outline", color: "#FF6B6B", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [], linkedGoalIds: [], linkedChecklistIndex: null },
  { id: "9", name: "Walk", icon: "walk-outline", color: "#F7B731", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [], linkedGoalIds: [], linkedChecklistIndex: null },
  { id: "10", name: "Getting ready", icon: "bed-outline", color: "#FF9F4A", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [], linkedGoalIds: [], linkedChecklistIndex: null },
  { id: "11", name: "Sleep/Rest", icon: "bed-outline", color: "#E8635E", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [], linkedGoalIds: [], linkedChecklistIndex: null },
  { id: "12", name: "Other", icon: "folder-outline", color: "#6C5CE7", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [], linkedGoalIds: [], linkedChecklistIndex: null }
];

const defaultFolders: Folder[] = [
  { name: "Today", items: [] },
  { name: "Tomorrow", items: [] }
];

const GOAL_TITLES = ["Morning Routine", "Work Focus", "Study Session"];
const GOAL_COLORS = ['#4ECDC4', '#FF6B6B', '#FFEAA7', '#DDA0DD', '#45B7D1', '#96CEB4', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7'];
const COMPLETION_EMOJIS = ['🎉', '✅', '🏆', '⭐', '💪', '🔥', '👏', '✨', '🎯', '💯'];

const defaultGoals: Goal[] = GOAL_TITLES.map((title, index) => ({
  id: index + 1,
  title,
  progress: index === 0 ? 75 : index === 1 ? 45 : index === 2 ? 90 : 0,
  color: GOAL_COLORS[index % GOAL_COLORS.length],
  emoji: COMPLETION_EMOJIS[index % COMPLETION_EMOJIS.length],
  isActive: false,
  isCompleted: index === 2,
  widthPercent: 100,
  remainingSeconds: null,
}));

let globalActivities: Activity[] = [...defaultActivities];
let globalChecklists: Checklist[] = [];
let globalGoals: Goal[] = [...defaultGoals];
let globalFolders: Folder[] = [...defaultFolders];
let selectedChecklistIndex: number = 0;
let showChecklistOnHome: boolean = false;
let maxPausedActivities: number = 3;
let globalDayStart: string = "00:00";
let globalDailyPlan: any = null;
let globalPlanCompletedItems: Record<string, boolean> = {};
let globalCalendarEvents: Record<string, any[]> = {};
let globalHistoryLogs: HistoryLog[] = [];

type Listener = () => void;
const listeners: Listener[] = [];

const STORAGE_FILE = documentDirectory + 'shimer_data.json';

async function loadFromFile() {
  try {
    const fileInfo = await getInfoAsync(STORAGE_FILE);
    if (fileInfo.exists) {
      const content = await readAsStringAsync(STORAGE_FILE);
      const data = JSON.parse(content);
      if (data.activities) globalActivities = data.activities;
      if (data.checklists) globalChecklists = data.checklists;
      if (data.goals) globalGoals = data.goals;
      if (data.folders) globalFolders = data.folders;
      if (data.selectedChecklistIndex !== undefined) selectedChecklistIndex = data.selectedChecklistIndex;
      if (data.showChecklistOnHome !== undefined) showChecklistOnHome = data.showChecklistOnHome;
      if (data.maxPausedActivities !== undefined) maxPausedActivities = data.maxPausedActivities;
      if (data.dayStart !== undefined) globalDayStart = data.dayStart;
      if (data.dailyPlan !== undefined) globalDailyPlan = data.dailyPlan;
      if (data.planCompletedItems !== undefined) globalPlanCompletedItems = data.planCompletedItems;
      if (data.calendarEvents !== undefined) globalCalendarEvents = data.calendarEvents;
      if (data.historyLogs !== undefined) globalHistoryLogs = data.historyLogs;
      if (data.activeTimer) {
        activeTimerData = data.activeTimer;
      }
      if (data.suspendedGoal !== undefined) globalSuspendedGoal = data.suspendedGoal;
      if (data.suspendedActivities !== undefined) globalSuspendedActivities = data.suspendedActivities;
    }
  } catch (error) {
    console.warn('Failed to load data from file', error);
  }
  listeners.forEach(listener => listener());
}

async function saveToFile() {
  try {
    const data = {
      activities: globalActivities,
      checklists: globalChecklists,
      goals: globalGoals,
      folders: globalFolders,
      selectedChecklistIndex,
      showChecklistOnHome,
      maxPausedActivities,
      dayStart: globalDayStart,
      dailyPlan: globalDailyPlan,
      planCompletedItems: globalPlanCompletedItems,
      calendarEvents: globalCalendarEvents,
      historyLogs: globalHistoryLogs,
      activeTimer: activeTimerData,
      suspendedGoal: globalSuspendedGoal,
      suspendedActivities: globalSuspendedActivities,
    };
    await writeAsStringAsync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('Failed to save data to file', error);
  }
}

function notifyAndSave() {
  listeners.forEach(listener => listener());
  saveToFile();
}

// ========== Activity Functions ==========
export function getActivities(): Activity[] {
  return globalActivities;
}

export function setActivities(newActivities: Activity[]) {
  globalActivities = newActivities;
  notifyAndSave();
}

// ========== History Functions ==========
let isAddingHistory = false;

export function getHistoryLogs(): HistoryLog[] {
  return globalHistoryLogs;
}

export function addHistoryLog(log: Omit<HistoryLog, 'id'>) {
  if (isAddingHistory) return;

  isAddingHistory = true;
  const newLog: HistoryLog = {
    ...log,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
  };
  globalHistoryLogs = [newLog, ...globalHistoryLogs];
  if (globalHistoryLogs.length > 1000) {
    globalHistoryLogs = globalHistoryLogs.slice(0, 1000);
  }
  saveToFile();
  isAddingHistory = false;
}

// Helper function for formatting duration in store
function formatDurationForStore(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${hours}h`;
    }
  } else if (minutes > 0) {
    if (remainingSeconds > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${minutes}m`;
    }
  } else {
    return `${seconds}s`;
  }
}

// Add history log with overlap removal - SPLITS overlapping logs instead of deleting them
export function addHistoryLogWithOverlapRemoval(
  log: Omit<HistoryLog, 'id'>,
  startTimestamp: number,
  endTimestamp: number
) {
  if (isAddingHistory) return;

  isAddingHistory = true;

  const newLog: HistoryLog = {
    ...log,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
  };

  const resultLogs: HistoryLog[] = [];

  for (const existingLog of globalHistoryLogs) {
    const existingStart = existingLog.timestamp;
    const existingEnd = existingLog.timestamp + (existingLog.durationSeconds * 1000);

    // No overlap - keep the log as is
    if (existingEnd <= startTimestamp || existingStart >= endTimestamp) {
      resultLogs.push(existingLog);
      continue;
    }

    // Case 1: Existing log starts BEFORE and ends AFTER the new log 
    if (existingStart < startTimestamp && existingEnd > endTimestamp) {
      // Left part (before the new log)
      const leftDuration = (startTimestamp - existingStart) / 1000;
      if (leftDuration > 0) {
        resultLogs.push({
          ...existingLog,
          durationSeconds: leftDuration,
          durationMinutes: Math.floor(leftDuration / 60),
          durationFormatted: formatDurationForStore(leftDuration),
        });
      }

      // Right part (after the new log)
      const rightDuration = (existingEnd - endTimestamp) / 1000;
      if (rightDuration > 0) {
        resultLogs.push({
          ...existingLog,
          durationSeconds: rightDuration,
          durationMinutes: Math.floor(rightDuration / 60),
          durationFormatted: formatDurationForStore(rightDuration),
          timestamp: endTimestamp,
        });
      }
      continue;
    }

    // Case 2: Existing log starts BEFORE and overlaps at the END
    if (existingStart < startTimestamp && existingEnd > startTimestamp && existingEnd <= endTimestamp) {
      const leftDuration = (startTimestamp - existingStart) / 1000;
      if (leftDuration > 0) {
        resultLogs.push({
          ...existingLog,
          durationSeconds: leftDuration,
          durationMinutes: Math.floor(leftDuration / 60),
          durationFormatted: formatDurationForStore(leftDuration),
        });
      }
      continue;
    }

    // Case 3: Existing log starts INSIDE and ends AFTER the new log
    if (existingStart >= startTimestamp && existingStart < endTimestamp && existingEnd > endTimestamp) {
      const rightDuration = (existingEnd - endTimestamp) / 1000;
      if (rightDuration > 0) {
        resultLogs.push({
          ...existingLog,
          durationSeconds: rightDuration,
          durationMinutes: Math.floor(rightDuration / 60),
          durationFormatted: formatDurationForStore(rightDuration),
          timestamp: endTimestamp,
        });
      }
      continue;
    }

    // Case 4: Existing log is completely inside the new log - skip it (removed)
  }

  // Add the new log
  resultLogs.push(newLog);

  // Sort by timestamp (newest first for display)
  resultLogs.sort((a, b) => b.timestamp - a.timestamp);

  globalHistoryLogs = resultLogs;

  // Keep only last 1000 entries
  if (globalHistoryLogs.length > 1000) {
    globalHistoryLogs = globalHistoryLogs.slice(0, 1000);
  }

  saveToFile();
  isAddingHistory = false;
}

export function updateHistoryLog(id: string, updatedLog: HistoryLog) {
  const index = globalHistoryLogs.findIndex(log => log.id === id);
  if (index !== -1) {
    globalHistoryLogs[index] = { ...updatedLog, id };
    notifyAndSave();
  }
}

export function deleteHistoryLog(id: string) {
  globalHistoryLogs = globalHistoryLogs.filter(log => log.id !== id);
  notifyAndSave();
}

export function clearHistoryLogs() {
  globalHistoryLogs = [];
  notifyAndSave();
}

export function replaceHistoryLogs(logs: HistoryLog[]) {
  globalHistoryLogs = logs.map(l => ({ ...l }));
  notifyAndSave();
}

export function getHistoryForDate(date: Date): HistoryLog[] {
  const dateStr = date.toDateString();
  return globalHistoryLogs.filter(log => new Date(log.timestamp).toDateString() === dateStr);
}

// ========== Checklist Functions ==========
export function getChecklists(): Checklist[] {
  return globalChecklists.map(c => ({ ...c, items: c.items.map(i => ({ ...i })) }));
}

export function setChecklists(newChecklists: Checklist[]) {
  globalChecklists = newChecklists.map(c => ({ ...c, items: c.items.map(i => ({ ...i })) }));
  notifyAndSave();
}

export function addChecklist(checklist: Checklist) {
  const newChecklist = { ...checklist, items: checklist.items.map(i => ({ ...i })) };
  globalChecklists = [...globalChecklists, newChecklist];
  notifyAndSave();
}

export function updateChecklist(index: number, checklist: Checklist) {
  const updated = [...globalChecklists];
  updated[index] = { ...checklist, items: checklist.items.map(i => ({ ...i })) };
  globalChecklists = updated;
  notifyAndSave();
}

export function deleteChecklist(index: number) {
  globalChecklists = globalChecklists.filter((_, i) => i !== index);
  notifyAndSave();
}

// ========== Activity-Checklist Linking ==========
export function getChecklistForActivity(activityId: string): { title: string; icon: string; index: number } | null {
  const activity = globalActivities.find(a => a.id === activityId);
  if (!activity || activity.linkedChecklistIndex === undefined || activity.linkedChecklistIndex === null) {
    return null;
  }
  const checklist = globalChecklists[activity.linkedChecklistIndex];
  if (checklist) {
    return {
      title: checklist.title,
      icon: checklist.icon,
      index: activity.linkedChecklistIndex
    };
  }
  return null;
}

export function linkActivityToChecklist(activityId: string, checklistIndex: number) {
  const activityIndex = globalActivities.findIndex(a => a.id === activityId);
  if (activityIndex !== -1) {
    globalActivities[activityIndex].linkedChecklistIndex = checklistIndex;
    notifyAndSave();
  }
}

export function unlinkActivityFromChecklist(activityId: string) {
  const activityIndex = globalActivities.findIndex(a => a.id === activityId);
  if (activityIndex !== -1) {
    globalActivities[activityIndex].linkedChecklistIndex = null;
    notifyAndSave();
  }
}

// ========== Goal Functions ==========
export function getGoals(): Goal[] {
  return globalGoals.map(g => ({ ...g }));
}

export function setGoals(newGoals: Goal[]) {
  globalGoals = newGoals.map(g => ({ ...g }));
  notifyAndSave();
}

export function addGoal(goal: Goal) {
  const newGoal = { ...goal, id: Date.now() };
  globalGoals = [...globalGoals, newGoal];
  notifyAndSave();
}

export function updateGoal(id: number, goal: Goal) {
  globalGoals = globalGoals.map(g => g.id === id ? { ...goal } : g);
  notifyAndSave();
}

export function deleteGoal(id: number) {
  globalGoals = globalGoals.filter(g => g.id !== id);
  notifyAndSave();
}

// ========== Activity-Goal Linking ==========
export function getGoalsForActivity(activityId: string): Goal[] {
  const activity = globalActivities.find(a => a.id === activityId);
  if (!activity || !activity.linkedGoalIds) return [];
  return globalGoals.filter(goal => activity.linkedGoalIds?.includes(goal.id));
}

export function linkGoalToActivity(activityId: string, goalId: number) {
  const activityIndex = globalActivities.findIndex(a => a.id === activityId);
  if (activityIndex !== -1) {
    if (!globalActivities[activityIndex].linkedGoalIds) {
      globalActivities[activityIndex].linkedGoalIds = [];
    }
    if (!globalActivities[activityIndex].linkedGoalIds?.includes(goalId)) {
      globalActivities[activityIndex].linkedGoalIds?.push(goalId);
      notifyAndSave();
    }
  }
}

export function unlinkGoalFromActivity(activityId: string, goalId: number) {
  const activityIndex = globalActivities.findIndex(a => a.id === activityId);
  if (activityIndex !== -1 && globalActivities[activityIndex].linkedGoalIds) {
    globalActivities[activityIndex].linkedGoalIds = globalActivities[activityIndex].linkedGoalIds?.filter(id => id !== goalId);
    notifyAndSave();
  }
}

// ========== Folder Functions ==========
export function getFolders(): Folder[] {
  return globalFolders.map(f => ({ ...f, items: [...f.items] }));
}

export function setFolders(newFolders: Folder[]) {
  globalFolders = newFolders.map(f => ({ ...f, items: [...f.items] }));
  notifyAndSave();
}

export function addFolder(folder: Folder) {
  globalFolders = [...globalFolders, { ...folder, items: [...folder.items] }];
  notifyAndSave();
}

export function updateFolder(index: number, folder: Folder) {
  const updated = [...globalFolders];
  updated[index] = { ...folder, items: [...folder.items] };
  globalFolders = updated;
  notifyAndSave();
}

export function deleteFolder(index: number) {
  globalFolders = globalFolders.filter((_, i) => i !== index);
  notifyAndSave();
}

// ========== Checklist Selection ==========
export function getSelectedChecklistIndex(): number {
  return selectedChecklistIndex;
}

export function setSelectedChecklistIndex(idx: number) {
  selectedChecklistIndex = idx;
  notifyAndSave();
}

// ========== Home Screen Settings ==========
export function getShowChecklistOnHome(): boolean {
  return showChecklistOnHome;
}

export function setShowChecklistOnHome(value: boolean) {
  showChecklistOnHome = value;
  notifyAndSave();
}

// ========== Max Paused Activities ==========
export function getMaxPausedActivities(): number {
  return maxPausedActivities;
}

export function setMaxPausedActivities(value: number) {
  maxPausedActivities = Math.max(1, Math.min(10, value));
  notifyAndSave();
}

// ========== Day Start Settings ==========
export function getDayStart(): string {
  return globalDayStart;
}

export function setDayStart(time: string) {
  globalDayStart = time;
  notifyAndSave();
}

// ========== Daily Plan Functions ==========
export function getDailyPlan(): any {
  return globalDailyPlan;
}

export function setDailyPlan(plan: any) {
  globalDailyPlan = plan;
  notifyAndSave();
}

export function getPlanCompletedItem(key: string): boolean {
  return globalPlanCompletedItems[key] || false;
}

export function getAllPlanCompletedItems(): Record<string, boolean> {
  return { ...globalPlanCompletedItems };
}

export function setPlanCompletedItem(key: string, value: boolean) {
  globalPlanCompletedItems[key] = value;
  notifyAndSave();
}

export function clearAllPlanCompletedItems() {
  globalPlanCompletedItems = {};
  notifyAndSave();
}

// ========== Subscription ==========
export function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

// ========== Timer State ==========
let activeTimerData: ActiveTimerData | null = null;

export function getActiveTimer(): ActiveTimerData | null {
  return activeTimerData;
}

export function setActiveTimer(data: { activityName: string; activityColor: string; durationSeconds: number; startTime?: number; userSelectedDuration?: number } | null) {
  if (data) {
    activeTimerData = {
      ...data,
      startTime: data.startTime || Date.now(),
      userSelectedDuration: data.userSelectedDuration || data.durationSeconds
    };
  } else {
    activeTimerData = null;
  }
  notifyAndSave();
}

// ========== Pending Pause (for "Pause & Start New" in things.tsx) ==========
let pendingPauseActivity: { name: string; color: string; remainingSeconds: number; userDuration?: number } | null = null;

export function setPendingPauseActivity(data: { name: string; color: string; remainingSeconds: number; userDuration?: number } | null) {
  pendingPauseActivity = data;
}

export function getPendingPauseActivity() {
  return pendingPauseActivity;
}

export function clearPendingPauseActivity() {
  pendingPauseActivity = null;
}

// Pre-break timer data (saved before break interval overwrites activeTimerData)
let preBreakTimerData: { name: string; color: string; remainingSeconds: number; userDuration?: number } | null = null;

// Suspended / Paused items (persisted so main.tsx can access them)
let globalSuspendedGoal: SuspendedGoalData | null = null;
let globalSuspendedActivities: SuspendedActivityData[] = [];

export function setPreBreakTimerData(data: { name: string; color: string; remainingSeconds: number; userDuration?: number } | null) {
  preBreakTimerData = data;
}

export function getPreBreakTimerData() {
  return preBreakTimerData;
}

export function clearPreBreakTimerData() {
  preBreakTimerData = null;
}

// ========== Suspended/Paused Items (persisted for main.tsx) ==========
export function getSuspendedGoal(): SuspendedGoalData | null {
  return globalSuspendedGoal;
}

export function setSuspendedGoal(data: SuspendedGoalData | null) {
  globalSuspendedGoal = data;
  notifyAndSave();
}

export function getSuspendedActivities(): SuspendedActivityData[] {
  return [...globalSuspendedActivities];
}

export function setSuspendedActivities(data: SuspendedActivityData[]) {
  globalSuspendedActivities = [...data];
  notifyAndSave();
}

export function addSuspendedActivity(data: SuspendedActivityData) {
  globalSuspendedActivities = [...globalSuspendedActivities, data];
  notifyAndSave();
}

export function removeSuspendedActivity(index: number) {
  globalSuspendedActivities = globalSuspendedActivities.filter((_, i) => i !== index);
  notifyAndSave();
}

// ========== Calendar Events ==========
export function getCalendarEvents(): Record<string, any[]> {
  return globalCalendarEvents;
}

export function setCalendarEvents(events: Record<string, any[]>) {
  globalCalendarEvents = events;
  notifyAndSave();
}

export function addCalendarEvent(dateKey: string, event: { title: string; time: string }) {
  if (!globalCalendarEvents[dateKey]) {
    globalCalendarEvents[dateKey] = [];
  }
  globalCalendarEvents[dateKey].push(event);
  globalCalendarEvents[dateKey].sort((a, b) => a.time.localeCompare(b.time));
  notifyAndSave();
}

export function deleteCalendarEvent(dateKey: string, index: number) {
  if (globalCalendarEvents[dateKey]) {
    globalCalendarEvents[dateKey].splice(index, 1);
    if (globalCalendarEvents[dateKey].length === 0) {
      delete globalCalendarEvents[dateKey];
    }
    notifyAndSave();
  }
}

loadFromFile();
