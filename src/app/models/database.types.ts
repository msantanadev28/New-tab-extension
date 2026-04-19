export type TableName = 'bookmarks' | 'search_engines' | 'user_settings' | 'users';

export interface Bookmark {
  bookmark_id: string;
  user_id: string | null;
  title: string;
  url: string;
  icon_url: string | null;
  background_image_url: string | null;
  show_icon: boolean | null;
  bg_depth: number | null;
  display_order: number | null;
  created_at: string | null;
}

export interface SearchEngine {
  engine_id: number;
  name: string;
  url_template: string;
  is_default: boolean | null;
}

export interface UserSettings {
  settings_id: number;
  user_id: string | null;
  bg_depth: number | null;
  search_engine_url: string | null;
  theme_mode: string | null;
  custom_background_url: string | null;
  updated_at: string | null;
}

export interface User {
  user_id: string;
  email: string;
  created_at: string | null;
  last_login: string | null;
}
