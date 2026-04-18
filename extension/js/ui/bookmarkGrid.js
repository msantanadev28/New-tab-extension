import { escapeHtml, getDisplayHost, getFaviconUrl, isCompact } from "../utils/helpers.js";

export function createBookmarkGrid(container, onAction) {
  let dragId = null;

  container.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const { action, id } = actionTarget.dataset;
    if (action === "open-bookmark" || action === "edit-bookmark" || action === "delete-bookmark") {
      onAction({ type: action, id });
    }
  });

  container.addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-bookmark-id]");
    if (!card) {
      return;
    }

    dragId = card.dataset.bookmarkId;
    card.classList.add("opacity-70");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragId);
  });

  container.addEventListener("dragend", (event) => {
    event.target.closest("[data-bookmark-id]")?.classList.remove("opacity-70");
    container.querySelectorAll("[data-drop-target='true']").forEach((item) => {
      item.dataset.dropTarget = "false";
    });
    dragId = null;
  });

  container.addEventListener("dragover", (event) => {
    const card = event.target.closest("[data-bookmark-id]");
    if (!card || !dragId) {
      return;
    }

    event.preventDefault();
    card.dataset.dropTarget = "true";
  });

  container.addEventListener("dragleave", (event) => {
    const card = event.target.closest("[data-bookmark-id]");
    if (card) {
      card.dataset.dropTarget = "false";
    }
  });

  container.addEventListener("drop", (event) => {
    const card = event.target.closest("[data-bookmark-id]");
    if (!card || !dragId) {
      return;
    }

    event.preventDefault();
    card.dataset.dropTarget = "false";
    const toId = card.dataset.bookmarkId;
    if (dragId !== toId) {
      onAction({ type: "reorder-bookmark", fromId: dragId, toId });
    }
  });

  function renderCard(bookmark, settings) {
    const compact = isCompact(settings);
    const densityClass = compact ? "p-3 rounded-[1.4rem]" : "p-4 rounded-[1.8rem]";
    return `
      <article
        class="group control-surface relative flex min-h-[9.5rem] cursor-grab flex-col overflow-hidden ${densityClass}"
        data-bookmark-id="${escapeHtml(bookmark.id)}"
        draggable="true"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-sky-100/60 opacity-90 transition duration-300 ease-smooth dark:from-white/5 dark:to-sky-500/10"></div>
        <div class="relative flex items-start justify-between gap-2">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-black/5 dark:bg-slate-800/80 dark:ring-white/10">
            <img
              alt=""
              class="h-7 w-7 rounded-xl object-contain"
              loading="lazy"
              src="${escapeHtml(getFaviconUrl(bookmark.url))}"
            />
          </div>
          <div class="flex items-center gap-1 opacity-100 transition duration-200 ease-smooth sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button class="icon-button h-9 w-9 rounded-xl" data-action="edit-bookmark" data-id="${escapeHtml(bookmark.id)}" type="button" title="Edit bookmark">
              <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M4 20h4l10-10-4-4L4 16v4Z" stroke-linejoin="round"></path>
                <path d="m12 6 4 4" stroke-linecap="round"></path>
              </svg>
            </button>
            <button class="icon-button h-9 w-9 rounded-xl" data-action="delete-bookmark" data-id="${escapeHtml(bookmark.id)}" type="button" title="Remove bookmark">
              <svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M6 7h12M9 7V5h6v2m-7 3v7m4-7v7m4-7v7M8 20h8a1 1 0 0 0 1-1V7H7v12a1 1 0 0 0 1 1Z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
          </div>
        </div>

        <button
          class="relative mt-4 flex flex-1 flex-col items-start text-left outline-none"
          data-action="open-bookmark"
          data-id="${escapeHtml(bookmark.id)}"
          type="button"
        >
          <span class="text-base font-semibold tracking-tight text-slate-900 transition duration-200 ease-smooth group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300">${escapeHtml(bookmark.title)}</span>
          <span class="mt-1 text-sm text-slate-500 dark:text-slate-400">${escapeHtml(getDisplayHost(bookmark.url))}</span>
          ${
            bookmark.description
              ? `<span class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">${escapeHtml(bookmark.description)}</span>`
              : ""
          }
        </button>
        <div class="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-transparent transition duration-200 ease-smooth group-focus-within:ring-sky-300 data-[drop-target='true']:ring-sky-400"></div>
      </article>
    `;
  }

  return {
    render({ bookmarks, settings }) {
      if (!bookmarks.length) {
        container.innerHTML = `
          <div class="glass-panel flex min-h-[22rem] items-center justify-center p-8">
            <div class="max-w-md text-center">
              <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                <svg aria-hidden="true" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round"></path>
                </svg>
              </div>
              <h2 class="text-xl font-semibold">Add your first bookmark</h2>
              <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Build a focused launch pad for the sites you open the most.</p>
              <button class="mt-5 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300" data-action="add-bookmark-empty" type="button">
                Add bookmark
              </button>
            </div>
          </div>
        `;
        container.querySelector("[data-action='add-bookmark-empty']")?.addEventListener("click", () => {
          onAction({ type: "add-bookmark" });
        });
        return;
      }

      container.innerHTML = `
        <div class="glass-panel h-full overflow-hidden p-4 sm:p-5">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <p class="field-label">Launcher</p>
              <h2 class="mt-1 text-lg font-semibold tracking-tight">Bookmarks</h2>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400">${bookmarks.length} saved</p>
          </div>
          <div class="dashboard-grid">${bookmarks.map((bookmark) => renderCard(bookmark, settings)).join("")}</div>
        </div>
      `;
    }
  };
}
