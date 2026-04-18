import { escapeHtml } from "../utils/helpers.js";

export function createBookmarkDialog(container, onSubmit) {
  let currentBookmark = null;

  container.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-close-bookmark-dialog]");
    if (closeTarget) {
      close();
    }
  });

  container.addEventListener("submit", async (event) => {
    const form = event.target.closest("form[data-bookmark-form]");
    if (!form) {
      return;
    }

    event.preventDefault();

    const titleField = form.querySelector("[name='title']");
    const urlField = form.querySelector("[name='url']");
    const descriptionField = form.querySelector("[name='description']");
    const errorNode = form.querySelector("[data-bookmark-error]");

    try {
      errorNode.textContent = "";
      await onSubmit({
        id: currentBookmark?.id,
        title: titleField.value.trim(),
        url: urlField.value.trim(),
        description: descriptionField.value.trim()
      });
      close();
    } catch (error) {
      errorNode.textContent = error instanceof Error ? error.message : "Unable to save bookmark.";
    }
  });

  function render(bookmark) {
    currentBookmark = bookmark ?? null;
    container.innerHTML = `
      <div class="fixed inset-0 z-50 transition duration-300 ease-smooth">
        <div class="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" data-close-bookmark-dialog="true"></div>
        <div class="absolute inset-x-4 top-1/2 mx-auto w-full max-w-xl -translate-y-1/2">
          <section aria-labelledby="bookmark-dialog-title" aria-modal="true" class="glass-panel p-6 sm:p-7" role="dialog">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="field-label">${bookmark ? "Edit bookmark" : "New bookmark"}</p>
                <h2 class="mt-1 text-2xl font-semibold tracking-tight" id="bookmark-dialog-title">${bookmark ? "Update shortcut" : "Add shortcut"}</h2>
              </div>
              <button class="icon-button" data-close-bookmark-dialog="true" type="button">
                <span class="sr-only">Close bookmark dialog</span>
                <svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"></path>
                </svg>
              </button>
            </div>

            <form class="mt-6 space-y-4" data-bookmark-form>
              <label class="control-surface block rounded-2xl p-4">
                <span class="field-label">Title</span>
                <input class="mt-3 w-full bg-transparent text-sm outline-none" maxlength="40" name="title" placeholder="GitHub" required type="text" value="${escapeHtml(bookmark?.title || "")}" />
              </label>

              <label class="control-surface block rounded-2xl p-4">
                <span class="field-label">URL</span>
                <input class="mt-3 w-full bg-transparent text-sm outline-none" name="url" placeholder="https://github.com" required type="text" value="${escapeHtml(bookmark?.url || "")}" />
              </label>

              <label class="control-surface block rounded-2xl p-4">
                <span class="field-label">Description</span>
                <input class="mt-3 w-full bg-transparent text-sm outline-none" maxlength="80" name="description" placeholder="Repositories and pull requests" type="text" value="${escapeHtml(bookmark?.description || "")}" />
              </label>

              <p class="min-h-[1.25rem] text-sm font-medium text-rose-500" data-bookmark-error></p>

              <div class="flex flex-wrap justify-end gap-3">
                <button class="rounded-2xl border border-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-600 transition duration-200 ease-smooth hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white" data-close-bookmark-dialog="true" type="button">
                  Cancel
                </button>
                <button class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition duration-200 ease-smooth hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300" type="submit">
                  ${bookmark ? "Save changes" : "Add bookmark"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    `;

    container.querySelector("[name='title']")?.focus();
  }

  function close() {
    currentBookmark = null;
    container.innerHTML = "";
  }

  return {
    open(bookmark) {
      render(bookmark);
    },
    close
  };
}
