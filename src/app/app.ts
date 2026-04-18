import { Component, signal, computed, effect, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { createIcons, icons } from 'lucide';
import speedDialExportJson from '../../template/speed-dial-2-export-2026-04-18.json';
import { SpeedDialExport, SpeedDialExportModel, type SpeedDialThemeMode } from './speed-dial.model';

declare var chrome: any;

interface AppBookmark {
  id: string;
  title: string;
  url: string;
  icon: string;
  backgroundImage?: string;
  showIcon?: boolean;
}

interface AppSettings {
  theme: SpeedDialThemeMode;
  centerVertically: boolean;
  compactLayout: boolean;
  openInNewTab: boolean;
  columns: number;
  gap: number;
  showSearch: boolean;
  showIcons: boolean;
  backgroundImage?: string;
}

interface AppRecentlyClosedTab {
  title: string;
  url?: string;
  icon?: string;
}

interface StoredAppState {
  bookmarks?: AppBookmark[];
  settings?: Partial<AppSettings>;
}

interface ChromeTabSession {
  title?: string;
  url?: string;
  favIconUrl?: string;
}

interface ChromeRecentlyClosedSession {
  tab?: ChromeTabSession;
}

type ToggleSettingKey = 'centerVertically' | 'compactLayout' | 'openInNewTab' | 'showIcons';

const INITIAL_SPEED_DIAL_EXPORT = SpeedDialExportModel.fromJson(speedDialExportJson as SpeedDialExport);

function buildFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
  }
}

function mapSpeedDialBookmarks(data: SpeedDialExportModel): AppBookmark[] {
  return [...data.dials]
    .sort((left, right) => left.position - right.position)
    .map((dial) => ({
      id: String(dial.id),
      title: dial.title,
      url: dial.url,
      icon: buildFaviconUrl(dial.url),
      backgroundImage: dial.thumbnail || undefined,
      showIcon: true,
    }));
}

function mapSpeedDialSettings(data: SpeedDialExportModel): AppSettings {
  const { preferences } = data;
  const defaultTheme: SpeedDialThemeMode = 'dark';
  const activeTheme = preferences.theme[defaultTheme];

  return {
    theme: defaultTheme,
    centerVertically: preferences.centeredLayout,
    compactLayout: false,
    openInNewTab: preferences.openInNewTab,
    columns: preferences.columns,
    gap: preferences.spacing,
    showSearch: true,
    showIcons: true,
    backgroundImage: activeTheme.backgroundImage || undefined,
  };
}

const INITIAL_BOOKMARKS = mapSpeedDialBookmarks(INITIAL_SPEED_DIAL_EXPORT);
const INITIAL_SETTINGS = mapSpeedDialSettings(INITIAL_SPEED_DIAL_EXPORT);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass()">

      <!-- Dynamic Background -->
      <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        @if (settings().backgroundImage) {
          <img [src]="settings().backgroundImage" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" alt="" />
          <div class="absolute inset-0 backdrop-blur-sm transition-all"
               [class.bg-black/40]="settings().theme === 'dark'" 
               [class.bg-white/40]="settings().theme === 'light'"></div>
        } @else {
          <div class="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-[120px] opacity-20 transition-all"
               [class.bg-blue-600]="settings().theme === 'dark'" [class.bg-blue-400]="settings().theme === 'light'"></div>
          <div class="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-[120px] opacity-20 transition-all"
               [class.bg-purple-600]="settings().theme === 'dark'" [class.bg-purple-400]="settings().theme === 'light'"></div>
        }
      </div>

      <!-- Main Header -->
      <header class="p-6 flex justify-between items-center relative z-10">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl" [class]="glassEffect()">
            <i class="w-5 h-5 opacity-80" data-lucide="layout"></i>
          </div>
          <h1 class="text-lg font-medium tracking-tight opacity-80">Dashboard</h1>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="isSettingsOpen.set(true)" [class]="headerBtnClass()">
             <i class="w-5 h-5" data-lucide="settings"></i>
          </button>
        </div>
      </header>

      <!-- Main Grid Content -->
      <main class="flex-1 flex flex-col px-6 pb-12 transition-all duration-500"
            [class.justify-center]="settings().centerVertically" [class.pt-20]="!settings().centerVertically">

        <!-- Search Bar -->
        @if (settings().showSearch) {
          <div class="w-full max-w-2xl mx-auto mb-16 relative">
            <div class="flex items-center gap-4 px-6 py-4 rounded-2xl focus-within:ring-2 ring-blue-500/50 transition-all"
                 [class]="glassEffect()">
              <i class="w-5 h-5 opacity-40" data-lucide="search"></i>
              <input
                type="text"
                placeholder="Search Google or type a URL"
                class="bg-transparent outline-none w-full text-lg placeholder:opacity-30"
                #searchInput
                (keydown.enter)="handleSearch(searchInput.value)"
              />
            </div>
          </div>
        }

        <!-- Bookmark Grid -->
        <div
          class="mx-auto w-full max-w-6xl animate-in slide-in-from-bottom-8 duration-700"
          [style.display]="'grid'"
          [style.grid-template-columns]="gridColumns()"
          [style.gap.px]="settings().gap"
        >
          @for (bookmark of bookmarks(); track bookmark.id) {
            <div class="group relative">
              <a
                [href]="bookmark.url"
                [target]="settings().openInNewTab ? '_blank' : '_self'"
                (contextmenu)="onContextMenu($event, bookmark)"
                class="flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                [class]="glassEffect() + ' ' + itemHover()"
              >
                <!-- Bookmark Background Image -->
                @if (bookmark.backgroundImage) {
                  <div class="absolute inset-0 z-0">
                    <img [src]="bookmark.backgroundImage" class="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  </div>
                }

                <!-- Icon Area (Stabilized for height/width) -->
                @if (settings().showIcons) {
                  <div class="w-16 h-16 rounded-2xl flex items-center justify-center p-3 transition-all relative z-10"
                       [class.bg-white/5]="bookmark.showIcon !== false" [class.shadow-inner]="bookmark.showIcon !== false">
                    @if (bookmark.showIcon !== false) {
                      <img [src]="bookmark.icon" alt="" class="w-full h-full object-contain filter drop-shadow-md" />
                    }
                  </div>
                }

                <span class="text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity truncate w-full text-center relative z-10">
                  {{ bookmark.title }}
                </span>
              </a>
            </div>
          }

          <button
            (click)="openAddModal()"
            class="flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] border-2 border-dashed transition-all hover:scale-105"
            [class.border-white-10]="settings().theme === 'dark'"
            [class.hover:border-white-30]="settings().theme === 'dark'"
            [class.border-black-10]="settings().theme === 'light'"
            [class.hover:border-black-20]="settings().theme === 'light'"
            style="border-color: rgba(255,255,255,0.1)"
          >
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 text-current opacity-40">
              <i class="w-8 h-8" data-lucide="plus"></i>
            </div>
            <span class="text-sm font-medium opacity-40">Add Site</span>
          </button>
        </div>
      </main>

      <!-- Sidebar Trigger -->
      <div class="fixed top-0 right-0 w-4 h-screen z-40" (mouseenter)="isSidebarHovered.set(true)"></div>

      <!-- Hidden Sidebar -->
      <aside
        class="fixed top-4 right-4 bottom-4 w-80 z-50 transition-all duration-500 transform rounded-[2.5rem] p-8 flex flex-col"
        [class]="glassEffect()"
        [class.translate-x-0]="isSidebarHovered()"
        [class.translate-x-full]="!isSidebarHovered()"
        [style.transform]="isSidebarHovered() ? 'translateX(0)' : 'translateX(calc(100% + 24px))'"
        (mouseleave)="isSidebarHovered.set(false)"
      >
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2">
            <i class="w-4 h-4 text-blue-500" data-lucide="bookmark"></i>
            <h3 class="font-semibold text-lg">Quick Access</h3>
          </div>
          <button (click)="isSidebarHovered.set(false)" class="opacity-40 hover:opacity-100">
            <i class="w-5 h-5" data-lucide="chevron-right"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <section class="mb-10">
            <h4 class="text-xs font-bold uppercase tracking-wider opacity-40 mb-4 px-2">Bookmarks</h4>
            <div class="space-y-1">
              @for (b of bookmarks(); track b.id) {
                <a [href]="b.url" class="flex items-center gap-3 p-3 rounded-2xl" [class]="itemHover()">
                  <img [src]="b.icon" class="w-5 h-5" alt="" />
                  <span class="text-sm truncate flex-1">{{ b.title }}</span>
                </a>
              }
            </div>
          </section>

          @if (recentlyClosed().length > 0) {
            <section>
              <h4 class="text-xs font-bold uppercase tracking-wider opacity-40 mb-4 px-2 flex items-center gap-2">
                <i class="w-3 h-3" data-lucide="history"></i> Recently Closed
              </h4>
              <div class="space-y-1">
                @for (tab of recentlyClosed(); track $index) {
                  <a [href]="tab.url" class="flex items-center gap-3 p-3 rounded-2xl" [class]="itemHover()">
                    @if (tab.icon) {
                       <img [src]="tab.icon" class="w-5 h-5" alt="" />
                    } @else {
                       <i class="w-4 h-4 opacity-30" data-lucide="external-link"></i>
                    }
                    <span class="text-sm truncate flex-1">{{ tab.title }}</span>
                  </a>
                }
              </div>
            </section>
          }
        </div>
      </aside>

      <!-- Modals -->
      @if (isSettingsOpen() || isAddModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div class="w-full max-w-md rounded-3xl p-8 transform animate-in zoom-in-95 duration-200" [class]="glassEffect()">

            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold">{{ isSettingsOpen() ? 'Dashboard Settings' : (editingBookmark() ? 'Edit Bookmark' : 'Add New Bookmark') }}</h2>
              <button (click)="closeModals()" class="p-2 rounded-full hover:bg-white/10 transition-colors">
                <i class="w-5 h-5" data-lucide="x"></i>
              </button>
            </div>

            <!-- Settings View -->
            @if (isSettingsOpen()) {
              <div class="space-y-8">
                <div class="space-y-4">
                  <label class="text-sm font-medium opacity-60">Appearance Theme</label>
                  <div class="flex gap-2 p-1 rounded-2xl bg-black/10">
                    <button (click)="updateSetting('theme', 'light')"
                      class="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all"
                      [class.bg-white]="settings().theme === 'light'" [class.text-black]="settings().theme === 'light'" [class.opacity-50]="settings().theme !== 'light'">
                      <i class="w-4 h-4" data-lucide="sun"></i> Light
                    </button>
                    <button (click)="updateSetting('theme', 'dark')"
                      class="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all"
                      [class.bg-white]="settings().theme === 'dark'" [class.text-black]="settings().theme === 'dark'" [class.opacity-50]="settings().theme !== 'dark'">
                      <i class="w-4 h-4" data-lucide="moon"></i> Dark
                    </button>
                  </div>
                </div>

                <div class="space-y-4">
                  @for (item of toggleItems; track item.key) {
                    <div class="flex items-center justify-between">
                      <label class="text-sm font-medium opacity-80">{{ item.label }}</label>
                      <button (click)="updateSetting(item.key, !settings()[item.key])"
                        class="w-12 h-6 rounded-full transition-all relative"
                        [style.background-color]="settings()[item.key] ? '#3b82f6' : 'rgba(156, 163, 175, 0.3)'">
                        <div class="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                             [style.left]="settings()[item.key] ? '1.75rem' : '0.25rem'"></div>
                      </button>
                    </div>
                  }
                </div>

                <div class="space-y-4">
                  <label class="text-sm font-medium opacity-60">Grid Columns ({{settings().columns}})</label>
                  <input type="range" min="3" max="8" [value]="settings().columns"
                         (input)="onColumnChange($event)" class="w-full accent-blue-500" />
                </div>

                <div class="space-y-4">
                  <label class="text-sm font-medium opacity-60">Dashboard Background URL</label>
                  <input type="text" [value]="settings().backgroundImage || ''"
                         (input)="onBackgroundChange($event)"
                         class="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50 text-sm"
                         placeholder="https://images.unsplash.com/..." />
                </div>
              </div>
            }

            <!-- Add/Edit Bookmark Form -->
            @if (isAddModalOpen()) {
              <form (submit)="handleBookmarkSubmit($event)" class="space-y-6">
                <div class="space-y-2">
                  <label class="text-sm font-medium opacity-60">Site Name</label>
                  <input name="title" [value]="editingBookmark()?.title || ''" required
                         class="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50" placeholder="e.g. GitHub" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium opacity-60">URL</label>
                  <input name="url" [value]="editingBookmark()?.url || ''" required type="url"
                         class="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50" placeholder="https://..." />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium opacity-60">Background Image URL (Optional)</label>
                  <input name="backgroundImage" [value]="editingBookmark()?.backgroundImage || ''"
                         class="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50" placeholder="https://images.unsplash.com/..." />
                </div>

                <div class="space-y-4 pt-2">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium opacity-80">Show Icon on Dashboard</label>
                    <button type="button" (click)="tempShowIcon.set(!tempShowIcon())"
                      class="w-12 h-6 rounded-full transition-all relative"
                      [style.background-color]="tempShowIcon() ? '#3b82f6' : 'rgba(156, 163, 175, 0.3)'">
                      <div class="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                           [style.left]="tempShowIcon() ? '1.75rem' : '0.25rem'"></div>
                    </button>
                    <input type="hidden" name="showIcon" [value]="tempShowIcon()" />
                  </div>
                </div>

                <button type="submit" class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/30">
                  {{ editingBookmark() ? 'Save Changes' : 'Add to Dashboard' }}
                </button>
              </form>
            }
          </div>
        </div>
      }

      <!-- Context Menu -->
      @if (contextMenu(); as menu) {
        <div class="fixed z-[100] w-48 rounded-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
             [class]="glassEffect()"
             [style.left.px]="menu.x"
             [style.top.px]="menu.y"
             (click)="$event.stopPropagation()">
          <button (click)="openEditModal(menu.bookmark); closeContextMenu()"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
            [class]="itemHover()">
            <i class="w-4 h-4" data-lucide="edit-2"></i> Edit Bookmark
          </button>
          <button (click)="removeBookmark(menu.bookmark.id); closeContextMenu()"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-red-500 hover:bg-red-500/10"
            [class]="itemHover()">
            <i class="w-4 h-4" data-lucide="trash-2"></i> Remove
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; width: 100vw; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
  `]
})
export class App implements OnInit {
  // --- Signals (State) ---
  bookmarks = signal<AppBookmark[]>(INITIAL_BOOKMARKS);
  recentlyClosed = signal<AppRecentlyClosedTab[]>([]);
  settings = signal<AppSettings>(INITIAL_SETTINGS);
  storageHydrated = signal(false);

  isSettingsOpen = signal(false);
  isAddModalOpen = signal(false);
  editingBookmark = signal<AppBookmark | null>(null);
  tempShowIcon = signal(true);
  isSidebarHovered = signal(false);
  contextMenu = signal<{x: number, y: number, bookmark: AppBookmark} | null>(null);

  // Helper for settings UI
  toggleItems: { label: string, key: ToggleSettingKey }[] = [
    { label: 'Center Content', key: 'centerVertically' },
    { label: 'Compact Grid', key: 'compactLayout' },
    { label: 'Open in New Tab', key: 'openInNewTab' },
    { label: 'Show Favicons', key: 'showIcons' }
  ];

  // --- Computed Classes ---
  containerClass = computed(() => {
    const base = "min-h-screen w-full flex flex-col transition-colors duration-500 overflow-hidden";
    return this.settings().theme === 'dark'
      ? `${base} bg-[#0a0a0a] text-white`
      : `${base} bg-gray-50 text-gray-900`;
  });

  glassEffect = computed(() => {
    return this.settings().theme === 'dark'
      ? 'bg-black/20 backdrop-blur-xl border border-white/10 text-white shadow-2xl'
      : 'bg-white/40 backdrop-blur-xl border border-white/20 text-gray-800 shadow-xl';
  });

  headerBtnClass = computed(() => {
    return `p-3 rounded-full ${this.glassEffect()} ${this.itemHover()}`;
  });

  itemHover = computed(() => {
    return this.settings().theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5';
  });

  gridColumns = computed(() => {
    const count = this.settings().compactLayout
      ? Math.min(this.settings().columns + 2, 8)
      : this.settings().columns;
    return `repeat(${count}, minmax(0, 1fr))`;
  });

  constructor() {
    const platformId = inject(PLATFORM_ID);

    // Load data from Chrome storage on init
    if (isPlatformBrowser(platformId)) {
      this.initData();
    }

    // Effect to persist changes automatically
    effect(() => {
      if (!this.storageHydrated()) {
        return;
      }

      const state = { bookmarks: this.bookmarks(), settings: this.settings() };
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(state);
      }
    });

    // Effect for Lucide icons refreshing
    effect(() => {
      // Trigger update on visibility changes
      this.isSettingsOpen();
      this.isAddModalOpen();
      this.isSidebarHovered();
      this.contextMenu();
      setTimeout(() => createIcons({ icons }), 50);
    });

    // Global listener to close context menu
    if (isPlatformBrowser(platformId)) {
      window.addEventListener('click', () => this.closeContextMenu());
      window.addEventListener('contextmenu', (e) => {
        if (!(e.target as HTMLElement).closest('a')) {
          this.closeContextMenu();
        }
      });
    }
  }

  ngOnInit() {
    // Initial icon render
    setTimeout(() => createIcons({ icons }), 100);
  }

  private initData() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      this.storageHydrated.set(true);
      return;
    }

    chrome.storage.local.get(['bookmarks', 'settings'], (result: StoredAppState) => {
      if (result.bookmarks) {
        this.bookmarks.set(result.bookmarks);
      }

      if (result.settings) {
        this.settings.set({ ...this.settings(), ...result.settings });
      }

      this.storageHydrated.set(true);
    });

    if (chrome.sessions) {
      chrome.sessions.getRecentlyClosed({ maxResults: 10 }, (sessions: ChromeRecentlyClosedSession[]) => {
        const closed = sessions
          .filter((session) => session.tab?.url)
          .map((session) => ({
            title: session.tab?.title ?? 'Untitled tab',
            url: session.tab?.url,
            icon: session.tab?.favIconUrl,
          }));
        this.recentlyClosed.set(closed);
      });
    }
  }

  // --- Actions ---
  handleSearch(query: string) {
    if (!query) return;
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  // --- Context Menu Actions ---
  onContextMenu(e: MouseEvent, bookmark: AppBookmark) {
    e.preventDefault();
    e.stopPropagation();
    
    // Adjust position so it doesn't go off-screen
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 192; // w-48
    const menuHeight = 100;
    
    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;

    this.contextMenu.set({ x, y, bookmark });
    setTimeout(() => createIcons({ icons }), 10);
  }

  closeContextMenu() {
    this.contextMenu.set(null);
  }

  removeBookmark(id: string) {
    this.bookmarks.update(prev => prev.filter(b => b.id !== id));
  }

  openAddModal() {
    this.editingBookmark.set(null);
    this.tempShowIcon.set(true);
    this.isAddModalOpen.set(true);
  }

  openEditModal(bookmark: AppBookmark) {
    this.editingBookmark.set(bookmark);
    this.tempShowIcon.set(bookmark.showIcon !== false);
    this.isAddModalOpen.set(true);
  }

  closeModals() {
    this.isSettingsOpen.set(false);
    this.isAddModalOpen.set(false);
    this.editingBookmark.set(null);
  }

  updateSetting<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) {
    this.settings.update((currentSettings) => ({ ...currentSettings, [key]: value }));
  }

  onColumnChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.updateSetting('columns', Number.parseInt(val, 10));
  }

  onBackgroundChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.updateSetting('backgroundImage', val);
  }

  handleBookmarkSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    const backgroundImage = formData.get('backgroundImage') as string;
    const showIcon = formData.get('showIcon') === 'true';

    const icon = buildFaviconUrl(url);

    const editItem = this.editingBookmark();
    if (editItem) {
      this.bookmarks.update(prev => prev.map(b => b.id === editItem.id ? { ...b, title, url, icon, backgroundImage, showIcon } : b));
    } else {
      this.bookmarks.update(prev => [...prev, { id: Date.now().toString(), title, url, icon, backgroundImage, showIcon }]);
    }
    this.closeModals();
  }
}

