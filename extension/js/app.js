import { DEFAULT_SETTINGS } from "./utils/constants.js";
import { buildSearchUrl, createId, moveItem, normalizeUrl } from "./utils/helpers.js";
import {
  loadDashboardState,
  loadRecentlyClosed,
  mergeSettings,
  saveBookmarks,
  saveSettings,
  subscribeToStorageChanges
} from "./state/storage.js";
import { createBookmarkDialog } from "./ui/bookmarkDialog.js";
import { createBookmarkGrid } from "./ui/bookmarkGrid.js";
import { createSearchBar } from "./ui/searchBar.js";
import { createSettingsModal } from "./ui/settingsModal.js";
import { createSidebar } from "./ui/sidebar.js";

const elements = {
  appShell: document.querySelector("#app-shell"),
  bookmarkGrid: document.querySelector("#bookmark-grid"),
  searchBar: document.querySelector("#search-bar"),
  sidebar: document.querySelector("#sidebar"),
  stage: document.querySelector("#dashboard-stage"),
  settingsButton: document.querySelector("#settings-button"),
  addBookmarkButton: document.querySelector("#add-bookmark-button"),
  sidebarToggle: document.querySelector("#sidebar-toggle")
};

const overlay = document.createElement("div");
overlay.className = "fixed inset-0 z-20 hidden bg-slate-950/30 backdrop-blur-sm lg:hidden";
document.body.append(overlay);

const modalRoot = document.querySelector("#modal-root");
const settingsHost = document.createElement("div");
const bookmarkDialogHost = document.createElement("div");
modalRoot.append(settingsHost, bookmarkDialogHost);

const state = {
  bookmarks: [],
  settings: { ...DEFAULT_SETTINGS },
  recentlyClosed: [],
  activeSidebarPanel: "bookmarks",
  sidebarOpen: false
};

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

const grid = createBookmarkGrid(elements.bookmarkGrid, handleAction);
const sidebar = createSidebar(elements.sidebar, handleAction);
const searchBar = createSearchBar(elements.searchBar, handleAction);
const settingsModal = createSettingsModal(settingsHost, async (partialSettings) => {
  state.settings = { ...state.settings, ...partialSettings };
  applyPreferences();
  searchBar.render(state);
  grid.render(state);
  await saveSettings(state.settings);
});
const bookmarkDialog = createBookmarkDialog(bookmarkDialogHost, saveBookmarkFromDialog);

elements.settingsButton.addEventListener("click", () => settingsModal.open(state.settings));
elements.addBookmarkButton.addEventListener("click", () => bookmarkDialog.open());
elements.sidebarToggle.addEventListener("click", () => {
  state.sidebarOpen = !state.sidebarOpen;
  syncSidebarVisibility();
});
overlay.addEventListener("click", () => {
  state.sidebarOpen = false;
  syncSidebarVisibility();
});
mediaQuery.addEventListener("change", () => applyTheme(state.settings.theme));
window.addEventListener("resize", syncSidebarVisibility);

init().catch((error) => {
  console.error("Failed to initialize dashboard:", error);
});

async function init() {
  const loaded = await loadDashboardState();
  state.bookmarks = loaded.bookmarks;
  state.settings = loaded.settings;
  state.recentlyClosed = await safeLoadRecentlyClosed();

  renderApp();
  applyPreferences();

  if (chrome.sessions?.onChanged) {
    chrome.sessions.onChanged.addListener(async () => {
      state.recentlyClosed = await safeLoadRecentlyClosed();
      sidebar.render(state);
    });
  }

  subscribeToStorageChanges((changes) => {
    let shouldRenderBookmarks = false;
    let shouldApplyPreferences = false;

    if (changes.dashboardBookmarks?.newValue) {
      state.bookmarks = changes.dashboardBookmarks.newValue;
      shouldRenderBookmarks = true;
    }

    if (changes.dashboardSettings?.newValue) {
      state.settings = mergeSettings(changes.dashboardSettings.newValue);
      shouldApplyPreferences = true;
    }

    if (shouldRenderBookmarks) {
      grid.render(state);
      sidebar.render(state);
    }

    if (shouldApplyPreferences) {
      applyPreferences();
      searchBar.render(state);
      grid.render(state);
    }
  });
}

async function safeLoadRecentlyClosed() {
  try {
    return await loadRecentlyClosed(8);
  } catch (error) {
    console.warn("Unable to load recently closed tabs:", error);
    return [];
  }
}

function renderApp() {
  searchBar.render(state);
  sidebar.render(state);
  grid.render(state);
  syncSidebarVisibility();
}

function applyPreferences() {
  applyTheme(state.settings.theme);

  document.documentElement.style.setProperty("--dashboard-gap", `${state.settings.cardGap}px`);
  document.documentElement.style.setProperty("--card-width", `${state.settings.cardWidth}px`);

  elements.stage.classList.toggle("justify-center", Boolean(state.settings.centerContent));
  elements.stage.classList.toggle("py-3", !state.settings.centerContent);
}

function applyTheme(theme) {
  const prefersDark = mediaQuery.matches;
  const useDark = theme === "dark" || (theme === "auto" && prefersDark);
  document.documentElement.classList.toggle("dark", useDark);
}

async function handleAction(action) {
  switch (action.type) {
    case "open-bookmark": {
      const bookmark = findBookmark(action.id);
      if (bookmark) {
        openUrl(bookmark.url);
      }
      break;
    }
    case "add-bookmark":
      bookmarkDialog.open();
      break;
    case "edit-bookmark": {
      const bookmark = findBookmark(action.id);
      if (bookmark) {
        bookmarkDialog.open(bookmark);
      }
      break;
    }
    case "delete-bookmark": {
      const bookmark = findBookmark(action.id);
      if (!bookmark) {
        return;
      }

      if (window.confirm(`Remove "${bookmark.title}" from your dashboard?`)) {
        state.bookmarks = state.bookmarks.filter((item) => item.id !== action.id);
        await persistBookmarksAndRender();
      }
      break;
    }
    case "reorder-bookmark": {
      const fromIndex = state.bookmarks.findIndex((item) => item.id === action.fromId);
      const toIndex = state.bookmarks.findIndex((item) => item.id === action.toId);
      if (fromIndex === -1 || toIndex === -1) {
        return;
      }

      state.bookmarks = moveItem(state.bookmarks, fromIndex, toIndex);
      await persistBookmarksAndRender();
      break;
    }
    case "move-up":
    case "move-down": {
      const index = state.bookmarks.findIndex((item) => item.id === action.id);
      if (index === -1) {
        return;
      }

      const direction = action.type === "move-up" ? -1 : 1;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= state.bookmarks.length) {
        return;
      }

      state.bookmarks = moveItem(state.bookmarks, index, targetIndex);
      await persistBookmarksAndRender();
      break;
    }
    case "switch-sidebar-panel":
      state.activeSidebarPanel = action.panel;
      sidebar.render(state);
      break;
    case "restore-session":
      chrome.sessions.restore(action.sessionId);
      break;
    case "close-sidebar":
      state.sidebarOpen = false;
      syncSidebarVisibility();
      break;
    case "search":
      openUrl(buildSearchUrl(state.settings.searchEngine, action.query));
      break;
    case "change-search-engine":
      state.settings = { ...state.settings, searchEngine: action.value };
      await saveSettings(state.settings);
      searchBar.render(state);
      break;
    default:
      break;
  }
}

async function saveBookmarkFromDialog(payload) {
  const title = payload.title.trim();
  const url = normalizeUrl(payload.url);
  const description = payload.description.trim();

  if (!title) {
    throw new Error("A bookmark title is required.");
  }

  const bookmark = {
    id: payload.id || createId(),
    title,
    url,
    description
  };

  if (payload.id) {
    state.bookmarks = state.bookmarks.map((item) => (item.id === payload.id ? bookmark : item));
  } else {
    state.bookmarks = [bookmark, ...state.bookmarks];
  }

  await persistBookmarksAndRender();
}

async function persistBookmarksAndRender() {
  await saveBookmarks(state.bookmarks);
  grid.render(state);
  sidebar.render(state);
}

function findBookmark(id) {
  return state.bookmarks.find((bookmark) => bookmark.id === id);
}

function openUrl(url) {
  if (state.settings.openInNewTab) {
    chrome.tabs.create({ url });
    return;
  }

  window.location.assign(url);
}

function syncSidebarVisibility() {
  const mobile = window.innerWidth < 1024;
  const visible = !mobile || state.sidebarOpen;

  elements.sidebar.classList.toggle("hidden", !visible);
  elements.sidebar.classList.toggle("flex", visible);
  overlay.classList.toggle("hidden", !mobile || !state.sidebarOpen);
  elements.sidebarToggle.setAttribute("aria-expanded", String(state.sidebarOpen));
}
