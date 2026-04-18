import { SEARCH_ENGINES, THEME_OPTIONS } from "../utils/constants.js";
import { escapeHtml } from "../utils/helpers.js";

export function createSettingsModal(container, onSave) {
  let isOpen = false;

  container.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-close-modal]");
    if (closeTarget) {
      hide();
    }
  });

  container.addEventListener("change", (event) => {
    if (!isOpen) {
      return;
    }

    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) {
      return;
    }

    onSave(readFormValues(container));
  });

  container.addEventListener("input", (event) => {
    if (!isOpen) {
      return;
    }

    const field = event.target;
    if (!(field instanceof HTMLInputElement) || field.type !== "range") {
      return;
    }

    const output = container.querySelector(`[data-output-for="${field.name}"]`);
    if (output) {
      output.textContent = `${field.value}px`;
    }

    onSave(readFormValues(container));
  });

  function render(settings) {
    container.innerHTML = `
      <div class="${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} fixed inset-0 z-40 transition duration-300 ease-smooth">
        <div class="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" data-close-modal="true"></div>
        <div class="absolute inset-x-4 top-1/2 mx-auto w-full max-w-2xl -translate-y-1/2">
          <section aria-labelledby="settings-title" aria-modal="true" class="glass-panel max-h-[85vh] overflow-y-auto p-6 sm:p-7" role="dialog">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="field-label">Preferences</p>
                <h2 class="mt-1 text-2xl font-semibold tracking-tight" id="settings-title">Dashboard settings</h2>
                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Tune layout, theme, and search defaults without leaving the page.</p>
              </div>
              <button class="icon-button" data-close-modal="true" type="button">
                <span class="sr-only">Close settings</span>
                <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"></path>
                </svg>
              </button>
            </div>

            <form class="mt-6 space-y-6">
              <div class="grid gap-4 md:grid-cols-2">
                <label class="control-surface block rounded-2xl p-4">
                  <span class="field-label">Theme</span>
                  <select class="mt-3 w-full bg-transparent text-sm font-medium outline-none" name="theme">
                    ${THEME_OPTIONS.map((option) => `<option ${option.value === settings.theme ? "selected" : ""} value="${option.value}">${option.label}</option>`).join("")}
                  </select>
                </label>

                <label class="control-surface block rounded-2xl p-4">
                  <span class="field-label">Search engine</span>
                  <select class="mt-3 w-full bg-transparent text-sm font-medium outline-none" name="searchEngine">
                    ${Object.entries(SEARCH_ENGINES)
                      .map(([value, option]) => `<option ${value === settings.searchEngine ? "selected" : ""} value="${value}">${escapeHtml(option.label)}</option>`)
                      .join("")}
                  </select>
                </label>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <label class="control-surface flex items-center justify-between rounded-2xl p-4">
                  <span>
                    <span class="field-label">Centered content</span>
                    <span class="mt-1 block text-sm text-slate-500 dark:text-slate-400">Balance the layout vertically on larger screens.</span>
                  </span>
                  <input ${settings.centerContent ? "checked" : ""} class="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900" name="centerContent" type="checkbox" />
                </label>

                <label class="control-surface flex items-center justify-between rounded-2xl p-4">
                  <span>
                    <span class="field-label">Compact layout</span>
                    <span class="mt-1 block text-sm text-slate-500 dark:text-slate-400">Reduce card density and overall spacing.</span>
                  </span>
                  <input ${settings.compactLayout ? "checked" : ""} class="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900" name="compactLayout" type="checkbox" />
                </label>

                <label class="control-surface flex items-center justify-between rounded-2xl p-4 md:col-span-2">
                  <span>
                    <span class="field-label">Open links in a new tab</span>
                    <span class="mt-1 block text-sm text-slate-500 dark:text-slate-400">Keep the dashboard available while launching bookmarks or searches.</span>
                  </span>
                  <input ${settings.openInNewTab ? "checked" : ""} class="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900" name="openInNewTab" type="checkbox" />
                </label>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <label class="control-surface block rounded-2xl p-4">
                  <span class="flex items-center justify-between gap-4">
                    <span>
                      <span class="field-label">Card width</span>
                      <span class="mt-1 block text-sm text-slate-500 dark:text-slate-400">Adjust the minimum width for bookmark tiles.</span>
                    </span>
                    <span class="text-sm font-semibold" data-output-for="cardWidth">${settings.cardWidth}px</span>
                  </span>
                  <input class="mt-4 w-full accent-sky-500" max="260" min="136" name="cardWidth" step="4" type="range" value="${settings.cardWidth}" />
                </label>

                <label class="control-surface block rounded-2xl p-4">
                  <span class="flex items-center justify-between gap-4">
                    <span>
                      <span class="field-label">Card spacing</span>
                      <span class="mt-1 block text-sm text-slate-500 dark:text-slate-400">Control the gap between grid items.</span>
                    </span>
                    <span class="text-sm font-semibold" data-output-for="cardGap">${settings.cardGap}px</span>
                  </span>
                  <input class="mt-4 w-full accent-sky-500" max="36" min="12" name="cardGap" step="2" type="range" value="${settings.cardGap}" />
                </label>
              </div>
            </form>
          </section>
        </div>
      </div>
    `;
  }

  function readFormValues(root) {
    const form = root.querySelector("form");
    if (!form) {
      return null;
    }

    const data = new FormData(form);
    return {
      theme: String(data.get("theme") || "auto"),
      searchEngine: String(data.get("searchEngine") || "google"),
      centerContent: root.querySelector("[name='centerContent']")?.checked ?? true,
      compactLayout: root.querySelector("[name='compactLayout']")?.checked ?? false,
      openInNewTab: root.querySelector("[name='openInNewTab']")?.checked ?? true,
      cardWidth: Number(root.querySelector("[name='cardWidth']")?.value || 176),
      cardGap: Number(root.querySelector("[name='cardGap']")?.value || 20)
    };
  }

  function show(settings) {
    isOpen = true;
    render(settings);
  }

  function hide() {
    isOpen = false;
    container.innerHTML = "";
  }

  return {
    open(settings) {
      show(settings);
    },
    close() {
      hide();
    }
  };
}
