import { SEARCH_ENGINES } from "../utils/constants.js";
import { escapeHtml } from "../utils/helpers.js";

export function createSearchBar(container, onAction) {
  container.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-search-form]");
    if (!form) {
      return;
    }

    event.preventDefault();

    const input = form.querySelector("[name='query']");
    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }

    onAction({ type: "search", query });
  });

  container.addEventListener("change", (event) => {
    const select = event.target.closest("[name='searchEngine']");
    if (!select) {
      return;
    }

    onAction({ type: "change-search-engine", value: select.value });
  });

  return {
    render({ settings }) {
      container.innerHTML = `
        <form class="grid gap-3 md:grid-cols-[1fr_auto]" data-search-form>
          <label class="control-surface flex items-center gap-3 rounded-[1.4rem] px-4 py-3">
            <svg aria-hidden="true" class="h-5 w-5 flex-none text-slate-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke-linecap="round"></path>
            </svg>
            <input autocomplete="off" class="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" name="query" placeholder="Search the web or launch into your day" type="search" />
          </label>

          <label class="control-surface flex items-center gap-3 rounded-[1.4rem] px-4 py-3">
            <span class="field-label whitespace-nowrap">Engine</span>
            <select class="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none" name="searchEngine">
              ${Object.entries(SEARCH_ENGINES)
                .map(([value, engine]) => `<option ${settings.searchEngine === value ? "selected" : ""} value="${value}">${escapeHtml(engine.label)}</option>`)
                .join("")}
            </select>
          </label>
        </form>
      `;
    }
  };
}
