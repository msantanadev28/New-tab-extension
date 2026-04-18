export type SpeedDialThemeMode = 'light' | 'dark';

export interface SpeedDialExport {
  dials: SpeedDialDial[];
  groups: SpeedDialGroup[];
  preferences: SpeedDialPreferences;
}

export interface SpeedDialDial {
  id: number;
  idgroup: number;
  position: number;
  thumbnail: string;
  title: string;
  ts_created: number;
  url: string;
  visits: number;
  visits_afternoon: number;
  visits_evening: number;
  visits_morning: number;
  visits_night: number;
}

export interface SpeedDialGroup {
  id: number;
  title: string;
  position: number;
  color?: string;
}

export interface SpeedDialBookmarkPreferences {
  alignTitle: string;
  borderRadius: string;
  padding: string;
  shadow: string;
  showTitle: boolean;
  showVisits: number;
  thumbnailRatio: number;
}

export interface SpeedDialThemeSettings {
  backgroundColor: string;
  backgroundImage: string;
  backgroundOpacity: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  backgroundSize: string;
  bookmarksBackgroundColor: string;
  bookmarksBorderColor: string;
  bookmarksInnerBackgroundColor: string;
  bookmarksTextColor: string;
  uiBackgroundColor?: string;
  uiTextColor?: string;
  textColor?: string;
}

export interface SpeedDialThemePreferences {
  dark: SpeedDialThemeSettings;
  font: string;
  fontSize: number;
  light: SpeedDialThemeSettings;
  theme: SpeedDialThemeMode;
}

export interface SpeedDialPreferences {
  bookmarks: SpeedDialBookmarkPreferences;
  centeredLayout: boolean;
  columns: number;
  contextMenu: number;
  defaultGroupName: string;
  headerStyle: string;
  keepActiveGroup: boolean;
  maxWidth: number;
  openInNewTab: boolean;
  orderBy: string;
  orderGroupsBy: string;
  showAddButton: boolean;
  sidebar: boolean;
  sidebarBookmarks: boolean;
  sidebarBookmarksOrder: string;
  spacing: number;
  theme: SpeedDialThemePreferences;
  uuid: string;
}

export class SpeedDialDialModel implements SpeedDialDial {
  constructor(
    public readonly id: number,
    public readonly idgroup: number,
    public readonly position: number,
    public readonly thumbnail: string,
    public readonly title: string,
    public readonly ts_created: number,
    public readonly url: string,
    public readonly visits: number,
    public readonly visits_afternoon: number,
    public readonly visits_evening: number,
    public readonly visits_morning: number,
    public readonly visits_night: number,
  ) {}

  static fromJson(dial: SpeedDialDial): SpeedDialDialModel {
    return new SpeedDialDialModel(
      dial.id,
      dial.idgroup,
      dial.position,
      dial.thumbnail,
      dial.title,
      dial.ts_created,
      dial.url,
      dial.visits,
      dial.visits_afternoon,
      dial.visits_evening,
      dial.visits_morning,
      dial.visits_night,
    );
  }
}

export class SpeedDialGroupModel implements SpeedDialGroup {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly position: number,
    public readonly color?: string,
  ) {}

  static fromJson(group: SpeedDialGroup): SpeedDialGroupModel {
    return new SpeedDialGroupModel(group.id, group.title, group.position, group.color);
  }
}

export class SpeedDialBookmarkPreferencesModel implements SpeedDialBookmarkPreferences {
  constructor(
    public readonly alignTitle: string,
    public readonly borderRadius: string,
    public readonly padding: string,
    public readonly shadow: string,
    public readonly showTitle: boolean,
    public readonly showVisits: number,
    public readonly thumbnailRatio: number,
  ) {}

  static fromJson(preferences: SpeedDialBookmarkPreferences): SpeedDialBookmarkPreferencesModel {
    return new SpeedDialBookmarkPreferencesModel(
      preferences.alignTitle,
      preferences.borderRadius,
      preferences.padding,
      preferences.shadow,
      preferences.showTitle,
      preferences.showVisits,
      preferences.thumbnailRatio,
    );
  }
}

export class SpeedDialThemeSettingsModel implements SpeedDialThemeSettings {
  constructor(
    public readonly backgroundColor: string,
    public readonly backgroundImage: string,
    public readonly backgroundOpacity: string,
    public readonly backgroundPosition: string,
    public readonly backgroundRepeat: string,
    public readonly backgroundSize: string,
    public readonly bookmarksBackgroundColor: string,
    public readonly bookmarksBorderColor: string,
    public readonly bookmarksInnerBackgroundColor: string,
    public readonly bookmarksTextColor: string,
    public readonly uiBackgroundColor?: string,
    public readonly uiTextColor?: string,
    public readonly textColor?: string,
  ) {}

  static fromJson(settings: SpeedDialThemeSettings): SpeedDialThemeSettingsModel {
    return new SpeedDialThemeSettingsModel(
      settings.backgroundColor,
      settings.backgroundImage,
      settings.backgroundOpacity,
      settings.backgroundPosition,
      settings.backgroundRepeat,
      settings.backgroundSize,
      settings.bookmarksBackgroundColor,
      settings.bookmarksBorderColor,
      settings.bookmarksInnerBackgroundColor,
      settings.bookmarksTextColor,
      settings.uiBackgroundColor,
      settings.uiTextColor,
      settings.textColor,
    );
  }
}

export class SpeedDialThemePreferencesModel implements SpeedDialThemePreferences {
  constructor(
    public readonly dark: SpeedDialThemeSettingsModel,
    public readonly font: string,
    public readonly fontSize: number,
    public readonly light: SpeedDialThemeSettingsModel,
    public readonly theme: SpeedDialThemeMode,
  ) {}

  static fromJson(preferences: SpeedDialThemePreferences): SpeedDialThemePreferencesModel {
    return new SpeedDialThemePreferencesModel(
      SpeedDialThemeSettingsModel.fromJson(preferences.dark),
      preferences.font,
      preferences.fontSize,
      SpeedDialThemeSettingsModel.fromJson(preferences.light),
      preferences.theme,
    );
  }
}

export class SpeedDialPreferencesModel implements SpeedDialPreferences {
  constructor(
    public readonly bookmarks: SpeedDialBookmarkPreferencesModel,
    public readonly centeredLayout: boolean,
    public readonly columns: number,
    public readonly contextMenu: number,
    public readonly defaultGroupName: string,
    public readonly headerStyle: string,
    public readonly keepActiveGroup: boolean,
    public readonly maxWidth: number,
    public readonly openInNewTab: boolean,
    public readonly orderBy: string,
    public readonly orderGroupsBy: string,
    public readonly showAddButton: boolean,
    public readonly sidebar: boolean,
    public readonly sidebarBookmarks: boolean,
    public readonly sidebarBookmarksOrder: string,
    public readonly spacing: number,
    public readonly theme: SpeedDialThemePreferencesModel,
    public readonly uuid: string,
  ) {}

  static fromJson(preferences: SpeedDialPreferences): SpeedDialPreferencesModel {
    return new SpeedDialPreferencesModel(
      SpeedDialBookmarkPreferencesModel.fromJson(preferences.bookmarks),
      preferences.centeredLayout,
      preferences.columns,
      preferences.contextMenu,
      preferences.defaultGroupName,
      preferences.headerStyle,
      preferences.keepActiveGroup,
      preferences.maxWidth,
      preferences.openInNewTab,
      preferences.orderBy,
      preferences.orderGroupsBy,
      preferences.showAddButton,
      preferences.sidebar,
      preferences.sidebarBookmarks,
      preferences.sidebarBookmarksOrder,
      preferences.spacing,
      SpeedDialThemePreferencesModel.fromJson(preferences.theme),
      preferences.uuid,
    );
  }
}

export class SpeedDialExportModel implements SpeedDialExport {
  constructor(
    public readonly dials: SpeedDialDialModel[],
    public readonly groups: SpeedDialGroupModel[],
    public readonly preferences: SpeedDialPreferencesModel,
  ) {}

  static fromJson(data: SpeedDialExport): SpeedDialExportModel {
    return new SpeedDialExportModel(
      data.dials.map((dial) => SpeedDialDialModel.fromJson(dial)),
      data.groups.map((group) => SpeedDialGroupModel.fromJson(group)),
      SpeedDialPreferencesModel.fromJson(data.preferences),
    );
  }
}
