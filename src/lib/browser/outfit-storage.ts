"use client";

import {
  type HistoryEntry,
  type OutfitFormState,
  type RecommendationFeedback,
} from "@/components/outfit/types";

const DB_NAME = "outfit-ai-db";
const DB_VERSION = 1;
const STORE_NAME = "kv";

const STORAGE_KEYS = {
  form: "outfit-ai.form",
  history: "outfit-ai.history",
  lastSubmitted: "outfit-ai.last-submitted",
  feedbacks: "outfit-ai.feedbacks",
} as const;

type PersistedWorkbenchState = {
  form: OutfitFormState | null;
  history: HistoryEntry[];
  lastSubmitted: OutfitFormState | null;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getValue<T>(key: string) {
  const database = await openDatabase();

  return new Promise<T | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function setValue<T>(key: string, value: T) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(value, key);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function removeValue(key: string) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

function readLegacyLocalStorage() {
  try {
    const form = window.localStorage.getItem(STORAGE_KEYS.form);
    const history = window.localStorage.getItem(STORAGE_KEYS.history);
    const lastSubmitted = window.localStorage.getItem(STORAGE_KEYS.lastSubmitted);

    if (!form && !history && !lastSubmitted) {
      return null;
    }

    return {
      form: form ? (JSON.parse(form) as OutfitFormState) : null,
      history: history ? (JSON.parse(history) as HistoryEntry[]) : [],
      lastSubmitted: lastSubmitted
        ? (JSON.parse(lastSubmitted) as OutfitFormState)
        : null,
    } satisfies PersistedWorkbenchState;
  } catch {
    return null;
  }
}

function clearLegacyLocalStorage() {
  window.localStorage.removeItem(STORAGE_KEYS.form);
  window.localStorage.removeItem(STORAGE_KEYS.history);
  window.localStorage.removeItem(STORAGE_KEYS.lastSubmitted);
  window.localStorage.removeItem(STORAGE_KEYS.feedbacks);
}

// 读取工作台持久化数据，并兼容从 localStorage 自动迁移。
export async function loadWorkbenchState(): Promise<PersistedWorkbenchState> {
  const [form, history, lastSubmitted] = await Promise.all([
    getValue<OutfitFormState>(STORAGE_KEYS.form),
    getValue<HistoryEntry[]>(STORAGE_KEYS.history),
    getValue<OutfitFormState>(STORAGE_KEYS.lastSubmitted),
  ]);

  if (form || history || lastSubmitted) {
    return {
      form,
      history: history ?? [],
      lastSubmitted,
    };
  }

  const legacy = readLegacyLocalStorage();

  if (!legacy) {
    return {
      form: null,
      history: [],
      lastSubmitted: null,
    };
  }

  await saveWorkbenchState(legacy);
  clearLegacyLocalStorage();
  return legacy;
}

// 持久化工作台表单、历史和上一次提交条件。
export async function saveWorkbenchState(state: PersistedWorkbenchState) {
  await Promise.all([
    state.form
      ? setValue(STORAGE_KEYS.form, state.form)
      : removeValue(STORAGE_KEYS.form),
    setValue(STORAGE_KEYS.history, state.history),
    state.lastSubmitted
      ? setValue(STORAGE_KEYS.lastSubmitted, state.lastSubmitted)
      : removeValue(STORAGE_KEYS.lastSubmitted),
  ]);
}

// 读取本地反馈记录，并兼容从 localStorage 自动迁移。
export async function loadFeedbackRecords(): Promise<RecommendationFeedback[]> {
  const feedbacks = await getValue<RecommendationFeedback[]>(STORAGE_KEYS.feedbacks);

  if (feedbacks) {
    return feedbacks;
  }

  try {
    const legacy = window.localStorage.getItem(STORAGE_KEYS.feedbacks);

    if (!legacy) {
      return [];
    }

    const parsed = JSON.parse(legacy) as RecommendationFeedback[];
    await saveFeedbackRecords(parsed);
    window.localStorage.removeItem(STORAGE_KEYS.feedbacks);
    return parsed;
  } catch {
    return [];
  }
}

// 持久化推荐反馈记录，用于后续生成时形成偏好闭环。
export async function saveFeedbackRecords(records: RecommendationFeedback[]) {
  await setValue(STORAGE_KEYS.feedbacks, records);
}

// 清空本地保存的表单、历史和上一次提交数据。
export async function clearWorkbenchState() {
  await Promise.all([
    removeValue(STORAGE_KEYS.form),
    removeValue(STORAGE_KEYS.history),
    removeValue(STORAGE_KEYS.lastSubmitted),
  ]);
}

// 清空本地保存的推荐反馈记录。
export async function clearFeedbackRecords() {
  await removeValue(STORAGE_KEYS.feedbacks);
}
