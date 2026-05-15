// app/activitiesStore.ts
import * as FileSystem from 'expo-file-system/legacy';

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
  linkedGoalIds?: number[]; // Array of goal IDs linked to this activity
  linkedChecklistIndex?: number | null; // Index of checklist linked to this activity
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
  items: string[]; // Array of activity IDs or names
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

// Default folders
const defaultFolders: Folder[] = [
  { name: "Today", items: [] },
  { name: "Tomorrow", items: [] }
];

// Default goals
const GOAL_TITLES = [
  "Morning Routine", "Work Focus", "Study Session",
];
const GOAL_COLORS = [
  '#4ECDC4', '#FF6B6B', '#FFEAA7', '#DDA0DD', '#45B7D1',
  '#96CEB4', '#F7B731', '#FF9F4A', '#E8635E', '#6C5CE7',
];
const COMPLETION_EMOJIS = ['🎉', '✅', '🏆', '⭐', '💪', '🔥', '👏', '✨', '🎯', '💯'];

const defaultGoals: Goal[] = GOAL_TITLES.map((title, index) => ({
  id: index + 1, // Start from 1 to avoid 0 which might be falsy
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
let globalDayStart: string = "00:00";
let globalDailyPlan: any = null;
let globalPlanCompletedItems: Record<string, boolean> = {};
let globalCalendarEvents: Record<string, any[]> = {};

type Listener = () => void;
const listeners: Listener[] = [];

const STORAGE_FILE = FileSystem.documentDirectory + 'shimer_data.json';

async function loadFromFile() {
  try {
    const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(STORAGE_FILE);
      const data = JSON.parse(content);
      if (data.activities) globalActivities = data.activities;
      if (data.checklists) globalChecklists = data.checklists;
      if (data.goals) globalGoals = data.goals;
      if (data.folders) globalFolders = data.folders;
      if (data.selectedChecklistIndex !== undefined) selectedChecklistIndex = data.selectedChecklistIndex;
      if (data.showChecklistOnHome !== undefined) showChecklistOnHome = data.showChecklistOnHome;
      if (data.dayStart !== undefined) globalDayStart = data.dayStart;
      if (data.dailyPlan !== undefined) globalDailyPlan = data.dailyPlan;
      if (data.planCompletedItems !== undefined) globalPlanCompletedItems = data.planCompletedItems;
      if (data.calendarEvents !== undefined) globalCalendarEvents = data.calendarEvents;
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
      dayStart: globalDayStart,
      dailyPlan: globalDailyPlan,
      planCompletedItems: globalPlanCompletedItems,
      calendarEvents: globalCalendarEvents,
    };
    await FileSystem.writeAsStringAsync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('Failed to save data to file', error);
  }
}

// Helper to notify and save
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

// ========== Activity-Checklist Linking Functions ==========
export function getChecklistForActivity(activityId: string): { title: string; icon: string; index: number } | null {
  const activity = globalActivities.find(a => a.id === activityId);
  if (!activity || activity.linkedChecklistIndex === undefined || activity.linkedChecklistIndex === null) {
    return null;
  }

  const checklistIndex = activity.linkedChecklistIndex;
  const checklist = globalChecklists[checklistIndex];

  if (checklist) {
    return {
      title: checklist.title,
      icon: checklist.icon,
      index: checklistIndex
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

// ========== Activity-Goal Linking Functions ==========
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
let activeTimerData: {
  activityName: string;
  activityColor: string;
  durationSeconds: number;
  startTime: number;
} | null = null;

export function getActiveTimer() {
  return activeTimerData;
}

export function setActiveTimer(data: { activityName: string; activityColor: string; durationSeconds: number; startTime?: number } | null) {
  if (data) {
    activeTimerData = {
      ...data,
      startTime: data.startTime || Date.now()
    };
  } else {
    activeTimerData = null;
  }
  notifyAndSave();
}

// ========== Calendar Events Functions ==========
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

// Initialize by loading data
loadFromFile();

export default {};
