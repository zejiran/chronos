export interface Event {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  recurrenceRule?: string;
  color?: string;
  reminders: number[];
  attendees: Attendee[];
  videoLink?: string;
  status: EventStatus;
  visibility: EventVisibility;
  createdAt: string;
  updatedAt: string;
  remoteId?: string;
  etag?: string;
}

// Extended event interface used by the UI
export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  color?: string;
  reminderMinutes: number | null;
  recurrence: RecurrenceRule | null;
  meetingUrl?: string;
  status: EventStatus;
  iCalUid?: string;
  etag?: string;
  syncStatus: "synced" | "pending" | "error";
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  count?: number;
  until?: string;
  byDay?: string[];
  byMonth?: number[];
  byMonthDay?: number[];
}

export interface Attendee {
  email: string;
  name?: string;
  status: AttendeeStatus;
  isOrganizer: boolean;
}

export type AttendeeStatus = "pending" | "accepted" | "declined" | "tentative";
export type EventStatus = "confirmed" | "tentative" | "cancelled";
export type EventVisibility = "public" | "private" | "default";

export interface Calendar {
  id: string;
  accountId: string;
  name: string;
  color: string;
  isVisible: boolean;
  isPrimary: boolean;
  isReadonly: boolean;
  remoteId?: string;
  syncToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  provider: Provider;
  email: string;
  displayName?: string;
  isEnabled: boolean;
  lastSync?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export type Provider = "google" | "microsoft" | "apple" | "caldav" | "local";
export type SyncStatus = "idle" | "syncing" | "success" | "error";

export type CalendarView = "day" | "week" | "month" | "year" | "agenda";

export interface CreateEventRequest {
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  recurrenceRule?: string;
  color?: string;
  reminders?: number[];
  videoLink?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  recurrenceRule?: string;
  color?: string;
  reminders?: number[];
  videoLink?: string;
  status?: EventStatus;
}

export interface Settings {
  version: string;
  theme: ThemeSettings;
  calendar: CalendarSettings;
  notifications: NotificationSettings;
  sync: SyncSettings;
  shortcuts: ShortcutSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
  advanced: AdvancedSettings;
}

export interface ThemeSettings {
  mode: "light" | "dark" | "auto" | "custom";
  activeTheme: string;
  custom: CustomTheme;
}

export interface CustomTheme {
  name: string;
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: Animations;
  effects: Effects;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryHover: string;
  accent: string;
  accentHover: string;
  muted: string;
  mutedHover: string;
  border: string;
  sidebar: string;
  hover: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  event: EventColors;
}

export interface EventColors {
  work: string;
  personal: string;
  meeting: string;
  focus: string;
  default: string;
}

export interface Typography {
  fontFamily: string;
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface Spacing {
  eventPadding: number;
  eventMargin: number;
  gridGap: number;
  sidebarWidth: number;
  calendarPadding: number;
}

export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface Shadows {
  sm: string;
  md: string;
  lg: string;
}

export interface Animations {
  enabled: boolean;
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: string;
}

export interface Effects {
  blurEnabled: boolean;
  blurAmount: number;
  transparency: number;
}

export interface CalendarSettings {
  startOfWeek: "sunday" | "monday" | "saturday";
  defaultView: CalendarView;
  timeFormat: "12h" | "24h";
  dateFormat: string;
  timeZone: string;
  showWeekNumbers: boolean;
  showDeclinedEvents: boolean;
  defaultEventDuration: number;
  workingHours: WorkingHours;
}

export interface WorkingHours {
  enabled: boolean;
  start: string;
  end: string;
  days: number[];
}

export interface NotificationSettings {
  enabled: boolean;
  defaultReminders: number[];
  soundEnabled: boolean;
  soundName: string;
  silentHours: SilentHours;
  showEventDetails: boolean;
}

export interface SilentHours {
  enabled: boolean;
  start: string;
  end: string;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: "remote_wins" | "local_wins" | "most_recent" | "ask";
  syncOnStartup: boolean;
}

export interface ShortcutSettings {
  shortcuts: Record<string, string>;
}

export interface AppearanceSettings {
  fontSize: number;
  density: "compact" | "comfortable" | "spacious";
  reduceMotion: boolean;
  highContrast: boolean;
  showSidebar: boolean;
}

export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
}

export interface AdvancedSettings {
  developerMode: boolean;
  logLevel: string;
  cacheSize: number;
}

export interface MeetingUrlResult {
  url: string;
  meetingType: MeetingType;
}

export type MeetingType =
  | "Zoom"
  | "GoogleMeet"
  | "MicrosoftTeams"
  | "Webex"
  | "Discord"
  | "Custom";

export interface SyncResult {
  success: boolean;
  eventsSynced: number;
  errors: string[];
}

export interface SearchResult {
  events: Event[];
  total: number;
}
