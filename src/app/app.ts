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
  bgDepth?: number;
}

interface AppSettings {
  theme: SpeedDialThemeMode;
  centerVertically: boolean;
  compactLayout: boolean;
  openInNewTab: boolean;
  columns: number;
  gapX: number;
  gapY: number;
  showSearch: boolean;
  showIcons: boolean;
  showTitles: boolean;
  backgroundImage?: string;
  bgBlur: number;
  bgRefraction: number;
  bgDepth: number;
  dialWidth: number;
  dialHeight: number;
  dialRoundness: number;
  containerAlignH: number;
  containerAlignV: number;
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
    gapX: preferences.spacing,
    gapY: preferences.spacing,
    showSearch: true,
    showIcons: true,
    showTitles: true,
    backgroundImage: activeTheme.backgroundImage || undefined,
    bgBlur: 10,
    bgRefraction: 40,
    bgDepth: 80,
    dialWidth: 180,
    dialHeight: 180,
    dialRoundness: 32,
    containerAlignH: 50,
    containerAlignV: 50,
  };
}

const INITIAL_BOOKMARKS = mapSpeedDialBookmarks(INITIAL_SPEED_DIAL_EXPORT);
const INITIAL_SETTINGS = mapSpeedDialSettings(INITIAL_SPEED_DIAL_EXPORT);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass() + ' relative'">

      <!-- Dynamic Background -->
      <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        @if (settings().backgroundImage) {
          <div class="absolute inset-0 transition-all duration-700"
               [style.filter]="'brightness(' + settings().bgDepth + '%)'">
            <img [src]="settings().backgroundImage" class="absolute inset-0 w-full h-full object-cover" alt="" />
          </div>
          <div class="absolute inset-0 transition-all duration-700"
               [style.backdrop-filter]="'blur(' + settings().bgBlur + 'px)'"
               [style.background-color]="settings().theme === 'dark' 
                 ? 'rgba(0,0,0,' + (settings().bgRefraction / 100) + ')' 
                 : 'rgba(255,255,255,' + (settings().bgRefraction / 100) + ')'">
          </div>
        } @else {
          <div class="absolute inset-0 bg-[#0a0a0a]" [class.bg-gray-50]="settings().theme === 'light'"></div>
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
      <main class="flex-1 flex flex-col px-6 pb-12 transition-all duration-500 relative z-10 overflow-y-auto">
        <!-- Vertical Spacer Top -->
        <div [style.flex-grow]="settings().containerAlignV"></div>

        <!-- Search Bar -->
<!--         @if (settings().showSearch) {
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
        } -->

        <!-- Bookmark Grid Wrapper -->
        <div class="w-full flex items-start">
          <!-- Horizontal Spacer Left -->
          <div [style.flex-grow]="settings().containerAlignH"></div>
          
          <div
            class="animate-in slide-in-from-bottom-8 duration-700 w-fit"
            [style.display]="'grid'"
            [style.grid-template-columns]="gridColumns()"
            [style.column-gap.px]="settings().gapX"
            [style.row-gap.px]="settings().gapY"
          >
          @for (bookmark of bookmarks(); track bookmark.id) {
            <div class="group relative flex justify-center">
              <a
                [href]="bookmark.url"
                [target]="settings().openInNewTab ? '_blank' : '_self'"
                (contextmenu)="onContextMenu($event, bookmark)"
                class="flex flex-col items-center justify-center gap-4 p-6 group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                [class]="glassEffect() + ' ' + itemHover()"
                [style.width.px]="settings().dialWidth"
                [style.height.px]="settings().dialHeight"
                [style.border-radius.px]="settings().dialRoundness"
              >
                <!-- Bookmark Background Image -->
                @if (bookmark.backgroundImage) {
                  <div class="absolute inset-0 z-0 transition-all duration-500"
                       [style.filter]="'brightness(' + (bookmark.bgDepth ?? 80) + '%)'">
                    <img [src]="bookmark.backgroundImage" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="" />
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

                @if (settings().showTitles) {
                  <span class="text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity truncate w-full text-center relative z-10">
                    {{ bookmark.title }}
                  </span>
                }
              </a>
            </div>
          }

          <div class="flex justify-center">
            <button
              (click)="openAddModal()"
              class="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed transition-all hover:scale-105"
              [class.border-white-10]="settings().theme === 'dark'"
              [class.hover:border-white-30]="settings().theme === 'dark'"
              [class.border-black-10]="settings().theme === 'light'"
              [class.hover:border-black-20]="settings().theme === 'light'"
              [style.width.px]="settings().dialWidth"
              [style.height.px]="settings().dialHeight"
              [style.border-radius.px]="settings().dialRoundness"
              style="border-color: rgba(255,255,255,0.1)"
            >
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 text-current opacity-40">
                <i class="w-8 h-8" data-lucide="plus"></i>
              </div>
              <span class="text-sm font-medium opacity-40">Add Site</span>
            </button>
          </div>
        </div>
        <!-- Horizontal Spacer Right -->
        <div [style.flex-grow]="100 - settings().containerAlignH"></div>
      </div>

      <!-- Vertical Spacer Bottom -->
      <div [style.flex-grow]="100 - settings().containerAlignV"></div>
    </main>

      <!-- Sidebar Trigger -->
      <div class="fixed top-0 right-0 w-4 h-screen z-40" (mouseenter)="isSidebarHovered.set(true)"></div>

      <!-- Hidden Sidebar -->
      <aside
        class="fixed top-24 right-4 bottom-4 w-72 z-50 transition-all duration-500 transform rounded-[2.5rem] p-6 flex flex-col"
        [class]="glassEffect()"
        [class.translate-x-0]="isSidebarHovered()"
        [class.translate-x-full]="!isSidebarHovered()"
        [style.transform]="isSidebarHovered() ? 'translateX(0)' : 'translateX(calc(100% + 24px))'"
        (mouseleave)="isSidebarHovered.set(false)"
      >
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <i class="w-4 h-4 text-blue-500" data-lucide="bookmark"></i>
            <h3 class="font-semibold text-base">Quick Access</h3>
          </div>
          <button (click)="isSidebarHovered.set(false)" class="opacity-40 hover:opacity-100">
            <i class="w-5 h-5" data-lucide="chevron-right"></i>
          </button>
        </div>

        <!-- Sidebar Search -->
        <div class="relative mb-6">
          <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/10 border border-white/5 focus-within:ring-2 ring-blue-500/50 transition-all">
            <i class="w-4 h-4 opacity-40" data-lucide="search"></i>
            <input
              type="text"
              placeholder="Search..."
              class="bg-transparent outline-none w-full text-xs placeholder:opacity-30"
              [value]="sidebarSearchQuery()"
              (input)="sidebarSearchQuery.set($any($event.target).value)"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          @if (recentlyClosed().length > 0) {
            <section class="mb-10">
              <h4 class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-4 px-2 flex items-center gap-2">
                <i class="w-3 h-3" data-lucide="history"></i> Recently Closed
              </h4>
              <div class="space-y-1">
                @for (tab of filteredRecentlyClosed(); track $index) {
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

          <section class="mb-10">
            <h4 class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-4 px-2">Bookmarks</h4>
            <div class="space-y-1">
              @for (b of filteredBrowserBookmarks(); track $index) {
                <a [href]="b.url" class="flex items-center gap-3 p-3 rounded-2xl" [class]="itemHover()">
                  @if (b.icon) {
                    <img [src]="b.icon" class="w-5 h-5" alt="" />
                  } @else {
                    <i class="w-4 h-4 opacity-30" data-lucide="bookmark"></i>
                  }
                  <span class="text-sm truncate flex-1">{{ b.title }}</span>
                </a>
              }
            </div>
          </section>
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
              <!-- Tabs -->
              <div class="flex gap-6 mb-8 border-b border-white/10">
                <button (click)="settingsTab.set('general')" 
                  class="pb-3 text-sm font-semibold transition-all relative flex items-center gap-2"
                  [class.opacity-40]="settingsTab() !== 'general'">
                  <i class="w-4 h-4" data-lucide="layout"></i>
                  General
                  @if (settingsTab() === 'general') {
                    <div class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  }
                </button>
                <button (click)="settingsTab.set('dials')" 
                  class="pb-3 text-sm font-semibold transition-all relative flex items-center gap-2"
                  [class.opacity-40]="settingsTab() !== 'dials'">
                  <i class="w-4 h-4" data-lucide="grid-3x3"></i>
                  Dial Settings
                  @if (settingsTab() === 'dials') {
                    <div class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  }
                </button>
                <button (click)="settingsTab.set('background')" 
                  class="pb-3 text-sm font-semibold transition-all relative flex items-center gap-2"
                  [class.opacity-40]="settingsTab() !== 'background'">
                  <i class="w-4 h-4" data-lucide="image"></i>
                  Bg Settings
                  @if (settingsTab() === 'background') {
                    <div class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  }
                </button>
                <button (click)="settingsTab.set('backup')" 
                  class="pb-3 text-sm font-semibold transition-all relative flex items-center gap-2"
                  [class.opacity-40]="settingsTab() !== 'backup'">
                  <i class="w-4 h-4" data-lucide="database"></i>
                  Backup
                  @if (settingsTab() === 'backup') {
                    <div class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  }
                </button>
              </div>

              <div class="space-y-8">
                @if (settingsTab() === 'general') {
                  <div class="space-y-6">
                    <div class="space-y-3">
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
                        @if (item.key !== 'centerVertically') {
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
                      }
                    </div>

                    <div class="space-y-3">
                      <label class="text-sm font-medium opacity-60">Grid Columns ({{settings().columns}})</label>
                      <input type="range" min="3" max="8" [value]="settings().columns"
                             (input)="onColumnChange($event)" class="w-full accent-blue-500" />
                    </div>
                  </div>
                }

                @if (settingsTab() === 'dials') {
                  <div class="space-y-6">
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <label class="text-sm font-medium opacity-60">Dial Width</label>
                        <span class="text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-lg">{{settings().dialWidth}}px</span>
                      </div>
                      <input type="range" min="100" max="400" [value]="settings().dialWidth"
                             (input)="updateSetting('dialWidth', +$any($event.target).value)" 
                             class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                    </div>
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <label class="text-sm font-medium opacity-60">Dial Height</label>
                        <span class="text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-lg">{{settings().dialHeight}}px</span>
                      </div>
                      <input type="range" min="80" max="400" [value]="settings().dialHeight"
                             (input)="updateSetting('dialHeight', +$any($event.target).value)" 
                             class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                    </div>
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <label class="text-sm font-medium opacity-60">Dial Roundness</label>
                        <span class="text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-lg">{{settings().dialRoundness}}px</span>
                      </div>
                      <input type="range" min="0" max="100" [value]="settings().dialRoundness"
                             (input)="updateSetting('dialRoundness', +$any($event.target).value)" 
                             class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                    </div>

                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <label class="text-sm font-medium opacity-60">X Spacing (Horizontal)</label>
                        <span class="text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-lg">{{settings().gapX}}px</span>
                      </div>
                      <input type="range" min="0" max="100" [value]="settings().gapX"
                             (input)="updateSetting('gapX', +$any($event.target).value)" 
                             class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                    </div>

                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <label class="text-sm font-medium opacity-60">Y Spacing (Vertical)</label>
                        <span class="text-xs font-mono bg-white/10 px-2.5 py-0.5 rounded-lg">{{settings().gapY}}px</span>
                      </div>
                      <input type="range" min="0" max="100" [value]="settings().gapY"
                             (input)="updateSetting('gapY', +$any($event.target).value)" 
                             class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-white/5">
                      <div class="flex items-center gap-2">
                        <i class="w-4 h-4 opacity-50" data-lucide="type"></i>
                        <label class="text-sm font-medium opacity-80">Show Bookmark Titles</label>
                      </div>
                      <button (click)="updateSetting('showTitles', !settings().showTitles)"
                        class="w-12 h-6 rounded-full transition-all relative"
                        [style.background-color]="settings().showTitles ? '#3b82f6' : 'rgba(156, 163, 175, 0.3)'">
                        <div class="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                             [style.left]="settings().showTitles ? '1.75rem' : '0.25rem'"></div>
                      </button>
                    </div>

                    <div class="space-y-4 pt-4 border-t border-white/5">
                      <div class="flex items-center gap-2 mb-2">
                        <i class="w-4 h-4 opacity-50" data-lucide="layout"></i>
                        <label class="text-xs font-bold uppercase tracking-widest opacity-40">Container Alignment</label>
                      </div>
                      
                      <div class="space-y-4">
                        <!-- Horizontal Alignment Slider -->
                        <div class="space-y-2">
                          <div class="flex justify-between items-center">
                            <span class="text-[10px] font-medium opacity-40 uppercase tracking-wider">Horizontal</span>
                            <span class="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-lg opacity-60">{{settings().containerAlignH}}%</span>
                          </div>
                          <div class="flex items-center gap-3">
                            <i class="w-3.5 h-3.5 opacity-30" data-lucide="align-left"></i>
                            <input type="range" min="0" max="100" [value]="settings().containerAlignH"
                                   (input)="updateSetting('containerAlignH', +$any($event.target).value)" 
                                   class="flex-1 accent-blue-500 h-1 rounded-lg appearance-none bg-white/5 cursor-pointer" />
                            <i class="w-3.5 h-3.5 opacity-30" data-lucide="align-right"></i>
                          </div>
                        </div>

                        <!-- Vertical Alignment Slider -->
                        <div class="space-y-2">
                          <div class="flex justify-between items-center">
                            <span class="text-[10px] font-medium opacity-40 uppercase tracking-wider">Vertical</span>
                            <span class="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-lg opacity-60">{{settings().containerAlignV}}%</span>
                          </div>
                          <div class="flex items-center gap-3">
                            <i class="w-3.5 h-3.5 opacity-30" data-lucide="arrow-up"></i>
                            <input type="range" min="0" max="100" [value]="settings().containerAlignV"
                                   (input)="updateSetting('containerAlignV', +$any($event.target).value)" 
                                   class="flex-1 accent-blue-500 h-1 rounded-lg appearance-none bg-white/5 cursor-pointer" />
                            <i class="w-3.5 h-3.5 opacity-30" data-lucide="arrow-down"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                @if (settingsTab() === 'background') {
                  <div class="space-y-4">
                    <!-- Live Preview Card -->
                    <div class="relative w-full h-32 rounded-3xl overflow-hidden mb-6 group border border-white/10 shadow-2xl bg-black/5">
                      @if (settings().backgroundImage) {
                        <div class="absolute inset-0 transition-all duration-300"
                             [style.filter]="'brightness(' + settings().bgDepth + '%)'">
                          <img [src]="settings().backgroundImage" class="absolute inset-0 w-full h-full object-cover" alt="" />
                        </div>
                        <div class="absolute inset-0 transition-all duration-300"
                             [style.backdrop-filter]="'blur(' + settings().bgBlur + 'px)'"
                             [style.background-color]="settings().theme === 'dark' 
                               ? 'rgba(0,0,0,' + (settings().bgRefraction / 100) + ')' 
                               : 'rgba(255,255,255,' + (settings().bgRefraction / 100) + ')'">
                        </div>
                      } @else {
                        <div class="absolute inset-0 transition-colors" [class.bg-[#0a0a0a]]="settings().theme === 'dark'" [class.bg-gray-100]="settings().theme === 'light'"></div>
                        <div class="absolute inset-0 flex flex-col items-center justify-center opacity-20 gap-2">
                          <i class="w-8 h-8" data-lucide="image"></i>
                          <span class="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                        </div>
                      }
                      <div class="absolute top-3 left-3">
                        <span class="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/10">Preview</span>
                      </div>
                    </div>

                    <div class="space-y-3">
                      <label class="text-sm font-medium opacity-60">Background Image</label>
                      <div class="space-y-3">
                        <div class="flex gap-2">
                          <input type="text" [value]="settings().backgroundImage || ''"
                                 (input)="onBackgroundChange($event)"
                                 (paste)="handleImagePaste($event, (res) => updateSetting('backgroundImage', res))"
                                 class="flex-1 p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50 text-sm"
                                 placeholder="Image URL or paste image..." />
                        </div>
                        
                        <button type="button" (click)="bgFileInput.click()" 
                                class="w-full p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all flex items-center justify-center gap-2 text-blue-500 font-medium group">
                          <i class="w-5 h-5 group-hover:scale-110 transition-transform" data-lucide="upload"></i>
                          Pick from file
                        </button>
                        <input type="file" #bgFileInput accept="image/*" class="hidden" (change)="onBackgroundUpload($event)" />
                      </div>
                    </div>

                    <!-- Blur Value -->
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                          <i class="w-4 h-4 opacity-50" data-lucide="droplets"></i>
                          <label class="text-sm font-semibold opacity-80">Blur Value</label>
                        </div>
                        <span class="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-lg tabular-nums">{{settings().bgBlur}}px</span>
                      </div>
                      <input type="range" min="0" max="40" [value]="settings().bgBlur"
                             (input)="updateSetting('bgBlur', +$any($event.target).value)" 
                             class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                      <div class="flex justify-between text-[10px] opacity-30">
                        <span>None</span><span>Max</span>
                      </div>
                    </div>

                    <!-- Refraction -->
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                          <i class="w-4 h-4 opacity-50" data-lucide="layers"></i>
                          <label class="text-sm font-semibold opacity-80">Refraction</label>
                        </div>
                        <span class="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-lg tabular-nums">{{settings().bgRefraction}}%</span>
                      </div>
                      <input type="range" min="0" max="100" [value]="settings().bgRefraction"
                             (input)="updateSetting('bgRefraction', +$any($event.target).value)" 
                             class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                      <div class="flex justify-between text-[10px] opacity-30">
                        <span>Transparent</span><span>Opaque</span>
                      </div>
                    </div>

                    <!-- Depth -->
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                          <i class="w-4 h-4 opacity-50" data-lucide="sun"></i>
                          <label class="text-sm font-semibold opacity-80">Depth</label>
                        </div>
                        <span class="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-lg tabular-nums">{{settings().bgDepth}}%</span>
                      </div>
                      <input type="range" min="10" max="100" [value]="settings().bgDepth"
                             (input)="updateSetting('bgDepth', +$any($event.target).value)" 
                             class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                      <div class="flex justify-between text-[10px] opacity-30">
                        <span>Dark</span><span>Bright</span>
                      </div>
                    </div>
                  </div>
                }

                @if (settingsTab() === 'backup') {
                  <div class="space-y-8 py-4">
                    <div class="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                      <div class="flex items-center gap-3">
                        <div class="p-2 rounded-xl bg-blue-500/20 text-blue-500">
                          <i class="w-5 h-5" data-lucide="download"></i>
                        </div>
                        <div>
                          <h4 class="font-semibold text-sm">Export Data</h4>
                          <p class="text-xs opacity-50">Save your bookmarks and settings to a JSON file</p>
                        </div>
                      </div>
                      <button (click)="exportSettings()" 
                              class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                        Export Backup
                      </button>
                    </div>

                    <div class="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10 space-y-4">
                      <div class="flex items-center gap-3">
                        <div class="p-2 rounded-xl bg-purple-500/20 text-purple-500">
                          <i class="w-5 h-5" data-lucide="upload"></i>
                        </div>
                        <div>
                          <h4 class="font-semibold text-sm">Import Data</h4>
                          <p class="text-xs opacity-50">Restore from a previous JSON backup file</p>
                        </div>
                      </div>
                      <button (click)="importFileInput.click()" 
                              class="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-2xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                        Import Backup
                      </button>
                      <input type="file" #importFileInput accept=".json" class="hidden" (change)="importSettings($event)" />
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Add/Edit Bookmark Form -->
            @if (isAddModalOpen()) {
              <form (submit)="handleBookmarkSubmit($event)" class="space-y-6">
                <div class="space-y-2">
                  <label class="text-sm font-medium opacity-60">Site Name</label>
                  <input name="title" [value]="editingBookmark()?.title || ''"
                         class="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50" placeholder="e.g. GitHub" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium opacity-60">URL</label>
                  <input name="url" [value]="editingBookmark()?.url || ''" required type="url"
                         class="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50" placeholder="https://..." />
                </div>

                <div class="space-y-3">
                  <label class="text-sm font-medium opacity-60">Custom Icon (Optional)</label>
                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center p-3 bg-black/10 border border-white/5 relative overflow-hidden group/icon-preview">
                      <img [src]="tempBookmarkIcon() || buildFaviconUrl(editingBookmark()?.url || '')" class="w-full h-full object-contain" />
                      @if (tempBookmarkIcon()) {
                        <button type="button" (click)="tempBookmarkIcon.set(null)" 
                                class="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/icon-preview:opacity-100 transition-opacity">
                           <i class="w-5 h-5" data-lucide="trash-2"></i>
                        </button>
                      }
                    </div>
                    <div class="flex-1 space-y-2">
                      <input name="icon" [value]="tempBookmarkIcon() || ''"
                             (input)="tempBookmarkIcon.set($any($event.target).value)"
                             (paste)="handleImagePaste($event, (res) => tempBookmarkIcon.set(res))"
                             class="w-full p-3 rounded-xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50 text-xs" 
                             placeholder="Icon URL or paste image..." />
                      <button type="button" (click)="bookmarkIconFileInput.click()" 
                              class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center gap-2 text-xs font-medium">
                        <i class="w-3.5 h-3.5" data-lucide="upload"></i> Pick Icon File
                      </button>
                      <input type="file" #bookmarkIconFileInput accept="image/*" class="hidden" (change)="onBookmarkIconUpload($event)" />
                    </div>
                  </div>
                </div>
                <div class="space-y-3">
                  <label class="text-sm font-medium opacity-60">Background Image (Optional)</label>
                  <div class="space-y-3">
                    @if (tempBookmarkBg()) {
                      <div class="relative w-full h-32 rounded-2xl overflow-hidden group mb-2 border border-white/10 shadow-inner bg-black/5">
                        <div class="absolute inset-0 transition-all duration-300" 
                             [style.filter]="'brightness(' + tempBookmarkDepth() + '%)'">
                          <img [src]="tempBookmarkBg()" class="w-full h-full object-cover" />
                        </div>
                        <button type="button" (click)="tempBookmarkBg.set(null)" 
                                class="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md z-10">
                           <i class="w-4 h-4" data-lucide="trash-2"></i>
                        </button>
                      </div>
                    }
                    <input name="backgroundImage" [value]="tempBookmarkBg() || ''"
                           (input)="tempBookmarkBg.set($any($event.target).value)"
                           (paste)="handleImagePaste($event, (res) => tempBookmarkBg.set(res))"
                           class="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50 text-sm" 
                           placeholder="Image URL or paste image..." />
                           
                    <button type="button" (click)="bookmarkBgFileInput.click()" 
                            class="w-full p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all flex items-center justify-center gap-2 text-blue-500 font-medium group text-sm">
                      <i class="w-4 h-4 group-hover:scale-110 transition-transform" data-lucide="upload"></i>
                      Pick from file
                    </button>
                    <input type="file" #bookmarkBgFileInput accept="image/*" class="hidden" (change)="onBookmarkBgUpload($event)" />
                  </div>
                </div>

                @if (tempBookmarkBg()) {
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <label class="text-xs font-semibold opacity-60 uppercase tracking-wider">Image Depth</label>
                      <span class="text-xs font-mono bg-white/10 px-2 py-0.5 rounded-lg">{{tempBookmarkDepth()}}%</span>
                    </div>
                    <input type="range" min="10" max="100" [value]="tempBookmarkDepth()"
                           (input)="tempBookmarkDepth.set(+$any($event.target).value)"
                           class="w-full accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer" />
                  </div>
                }

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
  browserBookmarks = signal<AppRecentlyClosedTab[]>([]);
  sidebarSearchQuery = signal('');

  filteredBrowserBookmarks = computed(() => {
    const query = this.sidebarSearchQuery().toLowerCase().trim();
    if (!query) return this.browserBookmarks();
    return this.browserBookmarks().filter(b => 
      b.title.toLowerCase().includes(query) || 
      b.url?.toLowerCase().includes(query)
    );
  });

  filteredRecentlyClosed = computed(() => {
    const query = this.sidebarSearchQuery().toLowerCase().trim();
    if (!query) return this.recentlyClosed();
    return this.recentlyClosed().filter(b => 
      b.title.toLowerCase().includes(query) || 
      b.url?.toLowerCase().includes(query)
    );
  });

  settings = signal<AppSettings>(INITIAL_SETTINGS);
  storageHydrated = signal(false);

  isSettingsOpen = signal(false);
  isAddModalOpen = signal(false);
  editingBookmark = signal<AppBookmark | null>(null);
  tempShowIcon = signal(true);
  isSidebarHovered = signal(false);
  contextMenu = signal<{x: number, y: number, bookmark: AppBookmark} | null>(null);
  settingsTab = signal<'general' | 'background' | 'dials' | 'backup'>('general');
  tempBookmarkBg = signal<string | null>(null);
  tempBookmarkIcon = signal<string | null>(null);
  tempBookmarkDepth = signal<number>(80);
  buildFaviconUrl = buildFaviconUrl;

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
    return `repeat(${count}, ${this.settings().dialWidth}px)`;
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

      const bookmarks = this.bookmarks();
      const settings = this.settings();

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ bookmarks, settings });
      } else {
        // Fallback for regular web preview
        localStorage.setItem('app_bookmarks', JSON.stringify(bookmarks));
        localStorage.setItem('app_settings', JSON.stringify(settings));
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

    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.getRecent(40, (bookmarks: any[]) => {
        const mapped = bookmarks.map(b => ({
          title: b.title,
          url: b.url,
          icon: buildFaviconUrl(b.url || '')
        }));
        this.browserBookmarks.set(mapped);
      });
    }
  }

  ngOnInit() {
    // Initial icon render
    setTimeout(() => createIcons({ icons }), 100);
  }

  private initData() {
    const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

    if (hasChromeStorage) {
      chrome.storage.local.get(['bookmarks', 'settings'], (result: StoredAppState) => {
        if (result.bookmarks) {
          this.bookmarks.set(result.bookmarks);
        }
        if (result.settings) {
          this.settings.set({ ...this.settings(), ...result.settings });
        }
        this.storageHydrated.set(true);
      });
    } else {
      // Fallback for regular web preview
      const savedBookmarks = localStorage.getItem('app_bookmarks');
      const savedSettings = localStorage.getItem('app_settings');

      if (savedBookmarks) {
        try {
          this.bookmarks.set(JSON.parse(savedBookmarks));
        } catch (e) {
          console.error('Failed to parse saved bookmarks', e);
        }
      }
      if (savedSettings) {
        try {
          this.settings.set({ ...this.settings(), ...JSON.parse(savedSettings) });
        } catch (e) {
          console.error('Failed to parse saved settings', e);
        }
      }
      this.storageHydrated.set(true);
    }

    if (chrome.sessions) {
      chrome.sessions.getRecentlyClosed({ maxResults: 5 }, (sessions: ChromeRecentlyClosedSession[]) => {
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
    this.tempBookmarkBg.set(null);
    this.tempBookmarkIcon.set(null);
    this.tempBookmarkDepth.set(80);
    this.isAddModalOpen.set(true);
  }

  openEditModal(bookmark: AppBookmark) {
    this.editingBookmark.set(bookmark);
    this.tempShowIcon.set(bookmark.showIcon !== false);
    this.tempBookmarkBg.set(bookmark.backgroundImage || null);
    this.tempBookmarkIcon.set(bookmark.icon || null);
    this.tempBookmarkDepth.set(bookmark.bgDepth ?? 80);
    this.isAddModalOpen.set(true);
  }

  closeModals() {
    this.isSettingsOpen.set(false);
    this.isAddModalOpen.set(false);
    this.editingBookmark.set(null);
    this.tempBookmarkBg.set(null);
    this.tempBookmarkIcon.set(null);
    this.tempBookmarkDepth.set(80);
    this.settingsTab.set('general');
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

  onBackgroundUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.updateSetting('backgroundImage', result);
      };
      reader.readAsDataURL(file);
    }
  }

  onBookmarkBgUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.tempBookmarkBg.set(result);
      };
      reader.readAsDataURL(file);
    }
  }

  handleImagePaste(event: ClipboardEvent, callback: (result: string) => void) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            callback(result);
          };
          reader.readAsDataURL(file);
          // Prevent the default paste if it's an image
          event.preventDefault();
        }
        break;
      }
    }
  }

  onBookmarkIconUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.tempBookmarkIcon.set(result);
      };
      reader.readAsDataURL(file);
    }
  }

  handleBookmarkSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    const backgroundImage = formData.get('backgroundImage') as string;
    const customIcon = formData.get('icon') as string;
    const showIcon = formData.get('showIcon') === 'true';

    const finalIcon = this.tempBookmarkIcon() || customIcon || buildFaviconUrl(url);
    const finalBg = this.tempBookmarkBg() || backgroundImage;
    const finalDepth = this.tempBookmarkDepth();

    const editItem = this.editingBookmark();

    if (editItem) {
      this.bookmarks.update(prev => prev.map(b => b.id === editItem.id ? { ...b, title, url, icon: finalIcon, backgroundImage: finalBg, showIcon, bgDepth: finalDepth } : b));
    } else {
      this.bookmarks.update(prev => [...prev, { id: Date.now().toString(), title, url, icon: finalIcon, backgroundImage: finalBg, showIcon, bgDepth: finalDepth }]);
    }
    this.closeModals();
  }

  exportSettings() {
    const data: StoredAppState = {
      bookmarks: this.bookmarks(),
      settings: this.settings()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `new-tab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importSettings(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as StoredAppState;
        
        if (data.bookmarks) {
          this.bookmarks.set(data.bookmarks);
        }
        if (data.settings) {
          this.settings.set({ ...this.settings(), ...data.settings });
        }
        
        this.closeModals();
      } catch (err) {
        console.error('Failed to import settings', err);
        alert('Failed to import settings. Please make sure the file is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    // Reset the input value so the same file can be selected again
    (event.target as HTMLInputElement).value = '';
  }
}

