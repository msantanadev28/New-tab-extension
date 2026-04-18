import { DEFAULT_BOOKMARKS, DEFAULT_SETTINGS, STORAGE_KEYS } from "../utils/constants.js";
import { clamp } from "../utils/helpers.js";

const storageArea = chrome.storage?.sync ?? chrome.storage?.local;

function getFromStorage(keys) {
  return new Promise((resolve, reject) => {
    storageArea.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve(result);
    });
  });
}

function setInStorage(payload) {
  return new Promise((resolve, reject) => {
    storageArea.set(payload, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve();
    });
  });
}

export function mergeSettings(storedSettings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...storedSettings,
    cardWidth: clamp(Number(storedSettings.cardWidth ?? DEFAULT_SETTINGS.cardWidth), 136, 260),
    cardGap: clamp(Number(storedSettings.cardGap ?? DEFAULT_SETTINGS.cardGap), 12, 36)
  };
}

export async function loadDashboardState() {
  const stored = await getFromStorage([STORAGE_KEYS.bookmarks, STORAGE_KEYS.settings]);
  return {
    bookmarks: Array.isArray(stored[STORAGE_KEYS.bookmarks]) ? stored[STORAGE_KEYS.bookmarks] : DEFAULT_BOOKMARKS,
    settings: mergeSettings(stored[STORAGE_KEYS.settings])
  };
}

export function subscribeToStorageChanges(callback) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" && areaName !== "local") {
      return;
    }

    callback(changes);
  });
}

export async function saveBookmarks(bookmarks) {
  await setInStorage({ [STORAGE_KEYS.bookmarks]: bookmarks });
}

export async function saveSettings(settings) {
  await setInStorage({ [STORAGE_KEYS.settings]: mergeSettings(settings) });
}

export async function loadRecentlyClosed(maxResults = 8) {
  return new Promise((resolve, reject) => {
    chrome.sessions.getRecentlyClosed({ maxResults }, (sessions) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      const normalized = sessions
        .map((entry) => {
          if (entry.tab?.sessionId && entry.tab?.url) {
            return {
              sessionId: entry.tab.sessionId,
              title: entry.tab.title || "Closed tab",
              url: entry.tab.url,
              type: "tab"
            };
          }

          if (entry.window?.sessionId && Array.isArray(entry.window.tabs) && entry.window.tabs.length) {
            return {
              sessionId: entry.window.sessionId,
              title: `Window with ${entry.window.tabs.length} tabs`,
              url: entry.window.tabs[0].url || "",
              type: "window"
            };
          }

          return null;
        })
        .filter(Boolean);

      resolve(normalized);
    });
  });
}
