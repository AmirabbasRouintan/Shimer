// app/miscStore.ts
import { File, Paths } from 'expo-file-system';

const MISC_STORE_FILE = new File(Paths.document, 'shimer_misc.json');
const data: Record<string, any> = {};
let loaded = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

type Listener = (key?: string) => void;
const listeners: Listener[] = [];
let notifying = false;

function notify(key?: string) {
  if (notifying) return;
  notifying = true;
  try {
    listeners.forEach((listener) => listener(key));
  } finally {
    notifying = false;
  }
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      MISC_STORE_FILE.create({ intermediates: true, overwrite: true });
      MISC_STORE_FILE.write(JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('Failed to save misc store', e);
    }
  }, 200);
}

export function subscribeMisc(listener: Listener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function loadMiscStore() {
  if (loaded) return;
  loaded = true;
  try {
    if (MISC_STORE_FILE.exists) {
      const content = await MISC_STORE_FILE.text();
      const parsed = JSON.parse(content);
      Object.assign(data, parsed);
    }
  } catch (e) {
    console.warn('Failed to load misc store', e);
  }
}

export const store: Record<string, any> = new Proxy(data, {
  set(target, prop: string | symbol, value) {
    if (typeof prop === 'string') {
      target[prop] = value;
      persist();
      notify(prop);
    }
    return true;
  },
  get(target, prop: string | symbol) {
    return typeof prop === 'string' ? target[prop] : undefined;
  },
});

loadMiscStore();
