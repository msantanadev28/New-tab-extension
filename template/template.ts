import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Settings,
  Plus,
  X,
  MoreVertical,
  Search,
  Grid,
  ExternalLink,
  Layout,
  Sun,
  Moon,
  Monitor,
  Trash2,
  Edit2,
  ChevronRight,
  History,
  Bookmark
} from 'lucide-react';

// Mock bookmarks for initial state
const INITIAL_BOOKMARKS = [
  { id: '1', title: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com', icon: 'https://www.youtube.com/favicon.ico' },
  { id: '3', title: 'Gmail', url: 'https://mail.google.com', icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/images/2/favicon.ico' },
  { id: '4', title: 'Twitter', url: 'https://twitter.com', icon: 'https://abs.twimg.com/favicons/twitter.2.ico' },
  { id: '5', title: 'Reddit', url: 'https://reddit.com', icon: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png' },
];

const App = () => {
  // --- State ---
  const [bookmarks, setBookmarks] = useState([]);
  const [recentlyClosed, setRecentlyClosed] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    theme: 'dark', // 'light' | 'dark' | 'auto'
    centerVertically: true,
    compactLayout: false,
    openInNewTab: true,
    columns: 5,
    gap: 24,
    showSearch: true
  });

  // --- Initialization ---
  useEffect(() => {
    // Load data from Chrome Storage if available, otherwise use defaults
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['bookmarks', 'settings'], (result) => {
        if (result.bookmarks) setBookmarks(result.bookmarks);
        else setBookmarks(INITIAL_BOOKMARKS);

        if (result.settings) setSettings(prev => ({ ...prev, ...result.settings }));
      });

      // Fetch recently closed tabs
      if (chrome.sessions) {
        chrome.sessions.getRecentlyClosed({ maxResults: 10 }, (sessions) => {
          const closed = sessions
            .filter(s => s.tab)
            .map(s => ({
              id: s.tab.sessionId,
              title: s.tab.title,
              url: s.tab.url,
              icon: s.tab.favIconUrl
            }));
          setRecentlyClosed(closed);
        });
      }
    } else {
      setBookmarks(INITIAL_BOOKMARKS);
    }
  }, []);

  // Save to storage on changes
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ bookmarks, settings });
    }
  }, [bookmarks, settings]);

  // --- Handlers ---
  const handleAddBookmark = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const url = formData.get('url');
    const icon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

    if (editingBookmark) {
      setBookmarks(bookmarks.map(b => b.id === editingBookmark.id ? { ...b, title, url, icon } : b));
      setEditingBookmark(null);
    } else {
      setBookmarks([...bookmarks, { id: Date.now().toString(), title, url, icon }]);
    }
    setIsAddModalOpen(false);
  };

  const removeBookmark = (id) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const toggleTheme = (theme) => {
    setSettings({ ...settings, theme });
  };

  // --- Derived Styles ---
  const glassEffect = settings.theme === 'dark'
    ? 'bg-black/20 backdrop-blur-xl border border-white/10 text-white shadow-2xl'
    : 'bg-white/40 backdrop-blur-xl border border-white/20 text-gray-800 shadow-xl';

  const itemHover = settings.theme === 'dark'
    ? 'hover:bg-white/10 transition-all duration-300'
    : 'hover:bg-black/5 transition-all duration-300';

  // --- Sub-components ---
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className={`${glassEffect} w-full max-w-md rounded-3xl p-8 transform animate-in zoom-in-95 duration-200`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-500 overflow-hidden ${settings.theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Dynamic Background Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-[120px] opacity-20 ${settings.theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
        <div className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-[120px] opacity-20 ${settings.theme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
      </div>

      {/* Main Header */}
      <header className="p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${glassEffect}`}>
            <Layout size={20} />
          </div>
          <h1 className="text-lg font-medium tracking-tight opacity-80">Dashboard</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`p-3 rounded-full ${glassEffect} ${itemHover}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className={`flex-1 flex flex-col px-6 pb-12 transition-all duration-500 ${settings.centerVertically ? 'justify-center' : 'pt-20'}`}>

        {/* Search Bar */}
        {settings.showSearch && (
          <div className="w-full max-w-2xl mx-auto mb-16 relative">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl ${glassEffect} focus-within:ring-2 ring-blue-500/50 transition-all`}>
              <Search className="opacity-40" size={20} />
              <input
                type="text"
                placeholder="Search Google or type a URL"
                className="bg-transparent outline-none w-full text-lg placeholder:opacity-30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Bookmark Grid */}
        <div
          className="mx-auto w-full max-w-6xl animate-in slide-in-from-bottom-8 duration-700"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${settings.compactLayout ? Math.min(settings.columns + 2, 8) : settings.columns}, minmax(0, 1fr))`,
            gap: `${settings.gap}px`
          }}
        >
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="group relative">
              <a
                href={bookmark.url}
                target={settings.openInNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] ${glassEffect} ${itemHover} group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center p-3 shadow-inner bg-white/5`}>
                  <img src={bookmark.icon} alt="" className="w-full h-full object-contain filter drop-shadow-md" />
                </div>
                <span className="text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity truncate w-full text-center">
                  {bookmark.title}
                </span>
              </a>

              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={(e) => { e.preventDefault(); setEditingBookmark(bookmark); setIsAddModalOpen(true); }}
                  className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); removeBookmark(bookmark.id); }}
                  className="p-1.5 rounded-lg bg-red-500/40 hover:bg-red-500/60 text-white"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => { setEditingBookmark(null); setIsAddModalOpen(true); }}
            className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] border-2 border-dashed ${settings.theme === 'dark' ? 'border-white/10 hover:border-white/30' : 'border-black/10 hover:border-black/20'} transition-all hover:scale-105`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5`}>
              <Plus size={32} className="opacity-40" />
            </div>
            <span className="text-sm font-medium opacity-40">Add Site</span>
          </button>
        </div>
      </main>

      {/* Edge Hover Trigger for Sidebar */}
      <div
        className="fixed top-0 right-0 w-4 h-screen z-40"
        onMouseEnter={() => setIsSidebarHovered(true)}
      ></div>

      {/* Hidden Slide-in Sidebar */}
      <aside
        className={`fixed top-4 right-4 bottom-4 w-80 z-50 transition-all duration-500 transform ${isSidebarHovered ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]'} ${glassEffect} rounded-[2.5rem] p-8 flex flex-col`}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-blue-500" />
            <h3 className="font-semibold text-lg">Quick Access</h3>
          </div>
          <button onClick={() => setIsSidebarHovered(false)} className="opacity-40 hover:opacity-100">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <section className="mb-10">
            <h4 className="text-xs font-bold uppercase tracking-wider opacity-40 mb-4 px-2">Bookmarks</h4>
            <div className="space-y-1">
              {bookmarks.map(b => (
                <a key={b.id} href={b.url} className={`flex items-center gap-3 p-3 rounded-2xl ${itemHover}`}>
                  <img src={b.icon} className="w-5 h-5" alt="" />
                  <span className="text-sm truncate flex-1">{b.title}</span>
                </a>
              ))}
            </div>
          </section>

          {recentlyClosed.length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-40 mb-4 px-2 flex items-center gap-2">
                <History size={12} /> Recently Closed
              </h4>
              <div className="space-y-1">
                {recentlyClosed.map((tab, idx) => (
                  <a key={idx} href={tab.url} className={`flex items-center gap-3 p-3 rounded-2xl ${itemHover}`}>
                    {tab.icon ? <img src={tab.icon} className="w-5 h-5" alt="" /> : <ExternalLink size={16} className="opacity-30" />}
                    <span className="text-sm truncate flex-1">{tab.title}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Dashboard Settings"
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-medium opacity-60">Appearance Theme</label>
            <div className="flex gap-2 p-1 rounded-2xl bg-black/10">
              {['light', 'dark'].map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTheme(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${settings.theme === t ? 'bg-white shadow-md text-black' : 'opacity-50 hover:opacity-100'}`}
                >
                  {t === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                  <span className="capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium opacity-80">Center Content</label>
              <button
                onClick={() => setSettings({...settings, centerVertically: !settings.centerVertically})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.centerVertically ? 'bg-blue-500' : 'bg-gray-400/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.centerVertically ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium opacity-80">Compact Grid</label>
              <button
                onClick={() => setSettings({...settings, compactLayout: !settings.compactLayout})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.compactLayout ? 'bg-blue-500' : 'bg-gray-400/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.compactLayout ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium opacity-80">Open in New Tab</label>
              <button
                onClick={() => setSettings({...settings, openInNewTab: !settings.openInNewTab})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.openInNewTab ? 'bg-blue-500' : 'bg-gray-400/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.openInNewTab ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium opacity-60">Grid Columns ({settings.columns})</label>
            <input
              type="range" min="3" max="8"
              value={settings.columns}
              onChange={(e) => setSettings({...settings, columns: parseInt(e.target.value)})}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </Modal>

      {/* Add/Edit Bookmark Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingBookmark ? "Edit Bookmark" : "Add New Bookmark"}
      >
        <form onSubmit={handleAddBookmark} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium opacity-60">Site Name</label>
            <input
              name="title"
              defaultValue={editingBookmark?.title}
              required
              className="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50"
              placeholder="e.g. GitHub"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium opacity-60">URL</label>
            <input
              name="url"
              defaultValue={editingBookmark?.url}
              required
              type="url"
              className="w-full p-4 rounded-2xl bg-black/10 border-none outline-none focus:ring-2 ring-blue-500/50"
              placeholder="https://..."
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/30"
          >
            {editingBookmark ? "Save Changes" : "Add to Dashboard"}
          </button>
        </form>
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
};

export default App;
