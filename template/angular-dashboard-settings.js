import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 overflow-hidden relative font-sans">
      <!-- Decorative background blobs -->
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse delay-700"></div>

      <!-- Main Glass Dialog -->
      <div class="relative w-full max-w-2xl min-h-[600px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between p-8 pb-4">
          <h1 class="text-2xl font-semibold text-white tracking-tight">Dashboard Settings</h1>
          <button class="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Tab Navigation -->
        <div class="px-8 flex space-x-8 border-b border-white/5">
          @for (tab of tabs; track tab.name) {
            <button
              (click)="activeTab.set(tab.name)"
              [class]="'flex items-center space-x-2 py-4 px-1 relative transition-all duration-300 ' +
                        (activeTab() === tab.name ? 'text-white font-medium' : 'text-white/40 hover:text-white/60')"
            >
              <span [innerHTML]="tab.icon"></span>
              <span class="text-sm uppercase tracking-wider">{{ tab.name }}</span>
              @if (activeTab() === tab.name) {
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
              }
            </button>
          }
        </div>

        <!-- Content Area -->
        <div class="flex-1 p-8 space-y-10 overflow-y-auto no-scrollbar">

          <!-- Theme Selector -->
          <section class="space-y-4">
            <h3 class="text-sm font-semibold text-white/50 uppercase tracking-widest">Appearance Theme</h3>
            <div class="flex p-1.5 bg-black/40 backdrop-blur-md rounded-2xl w-full max-w-md border border-white/5">
              <button
                (click)="theme.set('light')"
                [class]="'flex-1 flex items-center justify-center space-x-3 py-3 rounded-xl transition-all duration-500 ' +
                         (theme() === 'light' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white')"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>
                <span class="font-medium">Light</span>
              </button>
              <button
                (click)="theme.set('dark')"
                [class]="'flex-1 flex items-center justify-center space-x-3 py-3 rounded-xl transition-all duration-500 ' +
                         (theme() === 'dark' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white')"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                <span class="font-medium">Dark</span>
              </button>
            </div>
          </section>

          <!-- Settings Toggles -->
          <section class="space-y-6">
            @for (toggle of toggles; track toggle.key) {
              <div class="flex items-center justify-between group">
                <div class="flex items-center space-x-4">
                  <div class="p-3 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                    <span class="text-white/70" [innerHTML]="toggle.icon"></span>
                  </div>
                  <div>
                    <p class="text-white font-medium">{{ toggle.label }}</p>
                    <p class="text-xs text-white/40">{{ toggle.desc }}</p>
                  </div>
                </div>
                <button
                  (click)="toggleSwitch(toggle.key)"
                  [class]="'w-12 h-6 rounded-full p-1 transition-all duration-300 ' +
                           (switches()[toggle.key] ? 'bg-blue-500' : 'bg-white/10')"
                >
                  <div [class]="'w-4 h-4 rounded-full bg-white transition-transform duration-300 ' +
                                (switches()[toggle.key] ? 'translate-x-6' : 'translate-x-0')"></div>
                </button>
              </div>
            }
          </section>

          <!-- Slider -->
          <section class="space-y-4 pt-4">
            <div class="flex justify-between items-end">
              <h3 class="text-sm font-semibold text-white/50 uppercase tracking-widest">Grid Columns</h3>
              <span class="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                {{ gridColumns() }} Columns
              </span>
            </div>
            <div class="relative pt-6 pb-2">
              <input
                type="range"
                min="3"
                max="12"
                [value]="gridColumns()"
                (input)="updateColumns($event)"
                class="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                [style.background]="sliderBackground()"
              />
              <div class="flex justify-between mt-2 text-[10px] text-white/30 font-bold px-1">
                <span>3 COL</span>
                <span>12 COL</span>
              </div>
            </div>
          </section>

        </div>

        <!-- Footer Actions -->
        <div class="p-8 pt-0 flex justify-end items-center space-x-4">
          <button class="px-6 py-2.5 rounded-xl text-white/60 hover:text-white transition-colors text-sm font-medium">
            Reset Defaults
          </button>
          <button class="px-8 py-2.5 bg-white text-black hover:bg-white/90 transition-all rounded-xl text-sm font-bold shadow-xl flex items-center group">
            Save Changes
            <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      background: #ffffff;
      border: 4px solid #3b82f6;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      transition: all 0.2s ease-in-out;
    }

    input[type='range']::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  // State using Signals
  activeTab = signal('General');
  theme = signal<'light' | 'dark'>('dark');
  gridColumns = signal(7);
  switches = signal<Record<string, boolean>>({
    compactGrid: false,
    openInNewTab: false,
    showFavicons: true
  });

  // Computed properties
  sliderBackground = computed(() => {
    const val = ((this.gridColumns() - 3) / 9) * 100;
    return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${val}%, rgba(255,255,255,0.1) ${val}%, rgba(255,255,255,0.1) 100%)`;
  });

  // Static Data
  tabs = [
    { name: 'General', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>` },
    { name: 'Dial Settings', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>` },
    { name: 'Bg Settings', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>` }
  ];

  toggles = [
    {
      key: 'compactGrid',
      label: 'Compact Grid',
      desc: 'Reduce spacing between dashboard items',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path></svg>`
    },
    {
      key: 'openInNewTab',
      label: 'Open in New Tab',
      desc: 'Force links to open in a separate window',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"></path></svg>`
    },
    {
      key: 'showFavicons',
      label: 'Show Favicons',
      desc: 'Display site icons next to shortcuts',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
    }
  ];

  // Actions
  toggleSwitch(key: string) {
    this.switches.update(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }

  updateColumns(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.gridColumns.set(parseInt(val, 10));
  }
}
