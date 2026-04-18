import { escapeHtml, getDisplayHost } from "../utils/helpers.js";

export function createSidebar(container, onAction) {
  container.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) {
      return;
    }

    const { action, id, panel, sessionId } = target.dataset;
    switch (action) {
      case "switch-panel":
        onAction({ type: "switch-sidebar-panel", panel });
        break;
      case "add-bookmark":
        onAction({ type: "add-bookmark" });
        break;
      case "edit-bookmark":
      case "delete-bookmark":
        onAction({ type: action, id });
        break;
      case "move-up":
      case "move-down":
        onAction({ type: action, id });
        break;
      case "restore-session":
        onAction({ type: "restore-session", sessionId });
        break;
      case "close-sidebar":
        onAction({ type: "close-sidebar" });
        break;
      default:
        break;
    }
  });

  function renderBookmarksPanel(bookmarks) {
    return `
      <div class="mt-5 space-y-3">
        ${bookmarks
          .map(
            (bookmark, index) => `
          <article class="control-surface rounded-2xl p-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-900 dark:text-white">${escapeHtml(bookmark.title)}</p>
                <p class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">${escapeHtml(getDisplayHost(bookmark.url))}</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="icon-button h-8 w-8 rounded-xl" data-action="move-up" data-id="${escapeHtml(bookmark.id)}" ${index === 0 ? "disabled" : ""} type="button" title="Move up">
                  <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>
                <button class="icon-button h-8 w-8 rounded-xl" data-action="move-down" data-id="${escapeHtml(bookmark.id)}" ${index === bookmarks.length - 1 ? "disabled" : ""} type="button" title="Move down">
                  <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>
                <button class="icon-button h-8 w-8 rounded-xl" data-action="edit-bookmark" data-id="${escapeHtml(bookmark.id)}" type="button" title="Edit bookmark">
                  <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke-linejoin="round"></path><path d="m12 6 4 4" stroke-linecap="round"></path></svg>
                </button>
                <button class="icon-button h-8 w-8 rounded-xl" data-action="delete-bookmark" data-id="${escapeHtml(bookmark.id)}" type="button" title="Remove bookmark">
                  <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M6 7h12M9 7V5h6v2m-7 3v7m4-7v7m4-7v7M8 20h8a1 1 0 0 0 1-1V7H7v12a1 1 0 0 0 1 1Z" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>
              </div>
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    `;
  }

  function renderSessionsPanel(sessions) {
    if (!sessions.length) {
      return `
        <div class="mt-5 rounded-2xl border border-dashed border-slate-300/80 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Recently closed tabs will show up here when available.
        </div>
      `;
    }

    return `
      <div class="mt-5 space-y-3">
        ${sessions
          .map(
            (session) => `
          <button class="control-surface flex w-full items-start gap-3 rounded-2xl p-3 text-left" data-action="restore-session" data-session-id="${escapeHtml(session.sessionId)}" type="button">
            <div class="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 1 0 3-6.708L3 8m0 0h5m-5 0V3" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-900 dark:text-white">${escapeHtml(session.title)}</p>
              <p class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">${escapeHtml(getDisplayHost(session.url || session.type))}</p>
            </div>
          </button>
        `
          )
          .join("")}
      </div>
    `;
  }

  return {
    render({ bookmarks, recentlyClosed, activeSidebarPanel }) {
      const showingBookmarks = activeSidebarPanel !== "recent";
      container.innerHTML = `
        <div class="flex w-full flex-col">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="field-label">Sidebar</p>
              <h2 class="mt-1 text-xl font-semibold tracking-tight">Quick access</h2>
            </div>
            <button class="icon-button lg:hidden" data-action="close-sidebar" type="button">
              <span class="sr-only">Close sidebar</span>
              <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"></path>
              </svg>
            </button>
          </div>

          <button class="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition duration-200 ease-smooth hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300" data-action="add-bookmark" type="button">
            Add bookmark
          </button>

          <div class="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/70 p-1 dark:bg-slate-800/70">
            <button class="rounded-2xl px-3 py-2 text-sm font-medium transition ${showingBookmarks ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}" data-action="switch-panel" data-panel="bookmarks" type="button">
              Bookmarks
            </button>
            <button class="rounded-2xl px-3 py-2 text-sm font-medium transition ${!showingBookmarks ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}" data-action="switch-panel" data-panel="recent" type="button">
              Recently closed
            </button>
          </div>

          ${
            showingBookmarks
              ? renderBookmarksPanel(bookmarks)
              : renderSessionsPanel(recentlyClosed)
          }
        </div>
      `;
    }
  };
}
