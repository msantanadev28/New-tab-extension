export const STORAGE_KEYS = {
  bookmarks: "dashboardBookmarks",
  settings: "dashboardSettings"
};

export const DEFAULT_BOOKMARKS = [
  { id: "github", title: "GitHub", url: "https://github.com", description: "Repositories and pull requests" },
  { id: "gmail", title: "Gmail", url: "https://mail.google.com", description: "Inbox" },
  { id: "calendar", title: "Calendar", url: "https://calendar.google.com", description: "Schedule and meetings" },
  { id: "notion", title: "Notion", url: "https://www.notion.so", description: "Notes and docs" },
  { id: "youtube", title: "YouTube", url: "https://www.youtube.com", description: "Videos and playlists" },
  { id: "spotify", title: "Spotify", url: "https://open.spotify.com", description: "Music" },
  { id: "figma", title: "Figma", url: "https://www.figma.com", description: "Design workspace" },
  { id: "drive", title: "Drive", url: "https://drive.google.com", description: "Files and collaboration" }
];

export const DEFAULT_SETTINGS = {
  theme: "auto",
  centerContent: true,
  compactLayout: false,
  openInNewTab: true,
  cardWidth: 176,
  cardGap: 20,
  searchEngine: "google"
};

export const SEARCH_ENGINES = {
  google: {
    label: "Google",
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
  },
  duckduckgo: {
    label: "DuckDuckGo",
    buildUrl: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
  },
  bing: {
    label: "Bing",
    buildUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`
  },
  brave: {
    label: "Brave",
    buildUrl: (query) => `https://search.brave.com/search?q=${encodeURIComponent(query)}`
  },
  perplexity: {
    label: "Perplexity",
    buildUrl: (query) => `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`
  }
};

export const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" }
];
