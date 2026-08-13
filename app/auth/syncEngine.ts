// app/auth/syncEngine.ts
// Intelligent auto-sync between local storage and cloud.
// - Watches local changes (activitiesStore + miscStore) and pushes them to the cloud.
// - Runs a smart two-way reconcile on app start and on foreground.
// - Exposes a live status so the account section can show "everything matched".
import { AppState } from "react-native";
import * as Store from "../activitiesStore";
import { store, subscribeMisc } from "../miscStore";
import {
  collectAllData,
  loadAllData,
  fingerprint,
  syncToCloud,
  syncFromCloud,
} from "./cloudSync";

export type SyncState = "idle" | "syncing" | "synced" | "pending" | "offline" | "error";

export interface SyncStatusInfo {
  state: SyncState;
  lastSyncedAt: string | null;
  message: string;
}

const LAST_FP_KEY = "__sync_last_fp";
const LAST_AT_KEY = "__sync_last_at";
const LOCAL_DIRTY_KEY = "__sync_local_dirty_at";
const SYNC_INTERVAL_KEY = "__sync_interval_min";

export const MIN_SYNC_INTERVAL_MINUTES = 20;
export const DEFAULT_SYNC_INTERVAL_MINUTES = 30;

let token: string | null = null;
let state: SyncState = "idle";
let lastSyncedAt: string | null = store[LAST_AT_KEY] || null;
let localDirtyAt: string | null = store[LOCAL_DIRTY_KEY] || null;
let inFlight = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let periodicTimer: ReturnType<typeof setInterval> | null = null;
let unsubscribeActivities: (() => void) | null = null;
let unsubscribeMisc: (() => void) | null = null;

function readInterval(): number {
  const raw = Number(store[SYNC_INTERVAL_KEY]);
  if (!raw || Number.isNaN(raw)) return DEFAULT_SYNC_INTERVAL_MINUTES;
  return Math.max(MIN_SYNC_INTERVAL_MINUTES, raw);
}

let syncIntervalMin = readInterval();

const listeners: ((info: SyncStatusInfo) => void)[] = [];

function emit() {
  const info: SyncStatusInfo = { state, lastSyncedAt, message: getMessage() };
  listeners.forEach((listener) => listener(info));
}function getMessage(): string {
  switch (state) {
    case "syncing":
      return "Syncing changes...";
    case "synced":
      return "Everything is synced and up to date";
    case "pending":
      return "Changes waiting to be synced";
    case "offline":
      return "Offline — will sync automatically when back online";
    case "error":
      return "Sync failed — will retry automatically";
    default:
      return "";
  }
}

export function subscribeSync(listener: (info: SyncStatusInfo) => void) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function getSyncStatus(): SyncStatusInfo {
  return { state, lastSyncedAt, message: getMessage() };
}

export function getSyncIntervalMinutes(): number {
  return syncIntervalMin;
}

// Min 20 minutes. Persisted across restarts.
export function setSyncIntervalMinutes(minutes: number) {
  const clamped = Math.max(MIN_SYNC_INTERVAL_MINUTES, Math.round(minutes));
  syncIntervalMin = clamped;
  store[SYNC_INTERVAL_KEY] = clamped;
  restartPeriodicSync();
}

function markLocalDirty(key?: string) {
  if (key && key.startsWith("__sync_")) return;
  localDirtyAt = new Date().toISOString();
  if (state === "synced" || state === "idle") {
    state = "pending";
    emit();
  }
  scheduleAutoSync();
}

function scheduleAutoSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runSync().catch(() => {});
  }, 3000);
}

// Merge strategy: the side that changed since the last successful sync wins.
// If both sides changed, the newer timestamp wins. Never discards the only copy.
async function runSync(): Promise<SyncState> {
  if (!token || inFlight) return state;
  inFlight = true;
  state = "syncing";
  emit();

  const lastFp = store[LAST_FP_KEY] as string | undefined;
  const localData = collectAllData();
  const localFp = fingerprint(localData);

  try {
    const cloudResult = await syncFromCloud(token);
    const cloudData = cloudResult.data;
    const cloudEmpty = !cloudData || Object.keys(cloudData).length === 0;
    const cloudFp = cloudEmpty ? null : fingerprint(cloudData);

    // Both sides identical → nothing to do.
    if (cloudFp === localFp) {
      store[LAST_FP_KEY] = localFp;
      store[LAST_AT_KEY] = new Date().toISOString();
      state = "synced";
      lastSyncedAt = store[LAST_AT_KEY];
      emit();
      return state;
    }

    // Cloud empty but local has data → push local (first sync).
    if (cloudEmpty && localData.timestamp) {
      await syncToCloud(token);
      store[LAST_FP_KEY] = localFp;
      store[LAST_AT_KEY] = new Date().toISOString();
      state = "synced";
      lastSyncedAt = store[LAST_AT_KEY];
      emit();
      return state;
    }

    // Local empty but cloud has data → pull cloud.
    const localEmpty = localData.activities?.length === 0 && localData.notes?.length === 0;
    if (localEmpty && !cloudEmpty) {
      loadAllData(cloudData);
      store[LAST_FP_KEY] = cloudFp;
      store[LAST_AT_KEY] = new Date().toISOString();
      state = "synced";
      lastSyncedAt = store[LAST_AT_KEY];
      emit();
      return state;
    }

    const localChanged = lastFp !== undefined && localFp !== lastFp;
    const cloudChanged = lastFp !== undefined && cloudFp !== null && cloudFp !== lastFp;

    if (!localChanged && cloudChanged) {
      // Only cloud changed since last sync → pull cloud.
      loadAllData(cloudData);
      store[LAST_FP_KEY] = cloudFp;
      store[LAST_AT_KEY] = new Date().toISOString();
      state = "synced";
      lastSyncedAt = store[LAST_AT_KEY];
      emit();
      return state;
    }

    if (localChanged && !cloudChanged) {
      // Only local changed since last sync → push local.
      await syncToCloud(token);
      store[LAST_FP_KEY] = localFp;
      store[LAST_AT_KEY] = new Date().toISOString();
      state = "synced";
      lastSyncedAt = store[LAST_AT_KEY];
      emit();
      return state;
    }

    // Both changed (or unknown baseline) → newest timestamp wins.
    const cloudUpdatedAt = cloudResult.updatedAt;
    const localTime = localDirtyAt ? new Date(localDirtyAt).getTime() : 0;
    const cloudTime = cloudUpdatedAt ? new Date(cloudUpdatedAt).getTime() : 0;

    if (cloudTime > localTime && !cloudEmpty) {
      loadAllData(cloudData);
      store[LAST_FP_KEY] = cloudFp;
      store[LAST_AT_KEY] = new Date().toISOString();
    } else {
      await syncToCloud(token);
      store[LAST_FP_KEY] = localFp;
      store[LAST_AT_KEY] = new Date().toISOString();
    }
    state = "synced";
    lastSyncedAt = store[LAST_AT_KEY];
    emit();
    return state;
  } catch {
    state = "offline";
    emit();
    return state;
  } finally {
    inFlight = false;
  }
}

export async function syncNow(): Promise<SyncState> {
  if (!token) return state;
  return runSync();
}

export function setSyncToken(newToken: string | null) {
  token = newToken;
  if (newToken) {
    startAutoSync();
  } else {
    stopAutoSync();
  }
}

function handleAppState(next: string) {
  if (next === "active" && token) {
    runSync().catch(() => {});
  }
}

export function startAutoSync() {
  if (!unsubscribeActivities) {
    unsubscribeActivities = Store.subscribe(markLocalDirty);
  }
  if (!unsubscribeMisc) {
    unsubscribeMisc = subscribeMisc(markLocalDirty);
  }
  AppState.addEventListener("change", handleAppState);
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      if (state === "offline" || state === "pending" || state === "error") {
        runSync().catch(() => {});
      }
    }, 30000);
  }
  startPeriodicSync();
  runSync().catch(() => {});
}

function startPeriodicSync() {
  if (periodicTimer) clearInterval(periodicTimer);
  periodicTimer = setInterval(() => {
    runSync().catch(() => {});
  }, syncIntervalMin * 60 * 1000);
}

function restartPeriodicSync() {
  if (periodicTimer) {
    startPeriodicSync();
  }
}

export function stopAutoSync() {
  if (unsubscribeActivities) {
    unsubscribeActivities();
    unsubscribeActivities = null;
  }
  if (unsubscribeMisc) {
    unsubscribeMisc();
    unsubscribeMisc = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
  state = "idle";
  emit();
}
