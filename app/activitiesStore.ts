// app/activitiesStore.ts
import * as FileSystem from 'expo-file-system';

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
}

export interface Folder {
  name: string;
  items: string[]; // Array of activity IDs or names
}

// Default activities
const defaultActivities: Activity[] = [
  { id: "5", name: "Work", icon: "briefcase-outline", color: "#96CEB4", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [] },
  { id: "6", name: "Hobby", icon: "heart-outline", color: "#4ECDC4", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [] },
  { id: "7", name: "Personal development", icon: "star-outline", color: "#FFEAA7", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [] },
  { id: "8", name: "Exercises/Health", icon: "fitness-outline", color: "#FF6B6B", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [] },
  { id: "9", name: "Walk", icon: "walk-outline", color: "#F7B731", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [] },
  { id: "10", name: "Getting ready", icon: "bed-outline", color: "#FF9F4A", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [] },
  { id: "11", name: "Sleep/Rest", icon: "bed-outline", color: "#E8635E", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [] },
  { id: "12", name: "Other", icon: "folder-outline", color: "#6C5CE7", keepScreenOn: false, pomodoro: 25, goals: "", timerHints: "", checklists: [], shortcuts: [] }
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
  id: index,
  title,
  progress: index === 0 ? 75 : index === 1 ? 45 : index === 2 ? 90 : index === 3 ? 30 : index === 4 ? 60 : 0,
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

// ========== Goal Functions ==========
export function getGoals(): Goal[] {
  return globalGoals.map(g => ({ ...g }));
}

export function setGoals(newGoals: Goal[]) {
  globalGoals = newGoals.map(g => ({ ...g }));
  notifyAndSave();
}

export function addGoal(goal: Goal) {
  globalGoals = [...globalGoals, { ...goal }];
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

export function setActiveTimer(data: { activityName: string; activityColor: string; durationSeconds: number } | null) {
  activeTimerData = data ? { ...data, startTime: Date.now() } : null;
  notifyAndSave();
}

export default {};
loadFromFile();
