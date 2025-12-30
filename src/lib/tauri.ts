import { invoke } from "@tauri-apps/api/core";
import type {
  Event,
  CalendarEvent,
  Calendar,
  Account,
  Settings,
  CreateEventRequest,
  UpdateEventRequest,
  SyncResult,
  SearchResult,
  MeetingUrlResult,
  MeetingType,
} from "../types";

// Settings commands
export async function getSettings(): Promise<Settings> {
  return invoke<Settings>("get_settings");
}

export async function updateSettings(settings: Settings): Promise<void> {
  return invoke("update_settings", { settings });
}

export async function resetSettings(): Promise<Settings> {
  return invoke<Settings>("reset_settings");
}

export async function getConfigPath(): Promise<string> {
  return invoke<string>("get_config_path");
}

// Calendar commands
export async function getEvents(
  calendarId?: string,
  start?: string,
  end?: string,
): Promise<Event[]> {
  return invoke<Event[]>("get_events", { calendarId, start, end });
}

export async function getEvent(eventId: string): Promise<Event | null> {
  return invoke<Event | null>("get_event", { eventId });
}

export async function createEvent(request: CreateEventRequest): Promise<Event> {
  return invoke<Event>("create_event", { request });
}

export async function updateEvent(
  eventId: string,
  request: UpdateEventRequest,
): Promise<Event> {
  return invoke<Event>("update_event", { eventId, request });
}

export async function deleteEvent(eventId: string): Promise<void> {
  return invoke("delete_event", { eventId });
}

export async function getCalendars(accountId?: string): Promise<Calendar[]> {
  return invoke<Calendar[]>("get_calendars", { accountId });
}

export async function createCalendar(
  accountId: string,
  name: string,
  color: string,
): Promise<Calendar> {
  return invoke<Calendar>("create_calendar", {
    request: { accountId, name, color },
  });
}

export async function updateCalendar(
  calendarId: string,
  name?: string,
  color?: string,
  isVisible?: boolean,
): Promise<Calendar> {
  return invoke<Calendar>("update_calendar", {
    calendarId,
    request: { name, color, isVisible },
  });
}

export async function deleteCalendar(calendarId: string): Promise<void> {
  return invoke("delete_calendar", { calendarId });
}

// Account commands
export async function getAccounts(): Promise<Account[]> {
  return invoke<Account[]>("get_accounts");
}

export async function addAccount(
  provider: string,
  email: string,
  caldavUrl?: string,
  username?: string,
  password?: string,
): Promise<Account> {
  return invoke<Account>("add_account", {
    request: { provider, email, caldavUrl, username, password },
  });
}

export async function removeAccount(accountId: string): Promise<void> {
  return invoke("remove_account", { accountId });
}

export async function syncAccount(accountId: string): Promise<SyncResult> {
  return invoke<SyncResult>("sync_account", { accountId });
}

export async function syncAllAccounts(): Promise<SyncResult[]> {
  return invoke<SyncResult[]>("sync_all_accounts");
}

// OAuth commands
export async function startGoogleOAuth(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ authUrl: string; state: string }> {
  return invoke("start_google_oauth", { clientId, clientSecret, redirectUri });
}

export async function startMicrosoftOAuth(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ authUrl: string; state: string }> {
  return invoke("start_microsoft_oauth", {
    clientId,
    clientSecret,
    redirectUri,
  });
}

export async function handleOAuthCallback(
  provider: string,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  return invoke("handle_oauth_callback", {
    provider,
    code,
    clientId,
    clientSecret,
    redirectUri,
  });
}

// Deep link commands
export async function joinVideoCall(
  url: string,
  meetingType: MeetingType,
): Promise<void> {
  return invoke("join_video_call", { url, meetingType });
}

export async function detectMeetingUrl(
  text: string,
): Promise<MeetingUrlResult | null> {
  return invoke<MeetingUrlResult | null>("detect_meeting_url", { text });
}

// Notification commands
export async function scheduleNotification(
  eventId: string,
  title: string,
  body: string,
  triggerTime: number,
  hasVideoLink: boolean,
  videoUrl?: string,
): Promise<string> {
  return invoke<string>("schedule_notification", {
    request: { eventId, title, body, triggerTime, hasVideoLink, videoUrl },
  });
}

export async function cancelNotification(
  notificationId: string,
): Promise<void> {
  return invoke("cancel_notification", { notificationId });
}

export async function getUpcomingNotifications(hours: number): Promise<
  Array<{
    id: string;
    eventId: string;
    triggerTime: string;
    title: string;
    body: string;
    hasVideoLink: boolean;
    videoUrl?: string;
  }>
> {
  return invoke("get_upcoming_notifications", { hours });
}

// Search commands
export async function searchEvents(
  query: string,
  limit?: number,
): Promise<SearchResult> {
  return invoke<SearchResult>("search_events", { query, limit });
}
