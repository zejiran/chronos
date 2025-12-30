use crate::models::{Account, Calendar, Event};
use chrono::{DateTime, Utc};
use serde_json;

pub fn insert_event_sql() -> &'static str {
    r#"
    INSERT INTO events (
        id, calendar_id, title, description, location,
        start_time, end_time, all_day, recurrence_rule, color,
        reminders, attendees, video_link, status, visibility,
        created_at, updated_at, remote_id, etag
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
    )
    "#
}

pub fn update_event_sql() -> &'static str {
    r#"
    UPDATE events SET
        title = ?,
        description = ?,
        location = ?,
        start_time = ?,
        end_time = ?,
        all_day = ?,
        recurrence_rule = ?,
        color = ?,
        reminders = ?,
        attendees = ?,
        video_link = ?,
        status = ?,
        visibility = ?,
        updated_at = ?,
        remote_id = ?,
        etag = ?
    WHERE id = ?
    "#
}

pub fn delete_event_sql() -> &'static str {
    "DELETE FROM events WHERE id = ?"
}

pub fn get_event_sql() -> &'static str {
    "SELECT * FROM events WHERE id = ?"
}

pub fn get_events_by_calendar_sql() -> &'static str {
    "SELECT * FROM events WHERE calendar_id = ? ORDER BY start_time ASC"
}

pub fn get_events_in_range_sql() -> &'static str {
    r#"
    SELECT * FROM events
    WHERE start_time >= ? AND start_time <= ?
    ORDER BY start_time ASC
    "#
}

pub fn get_events_by_calendar_in_range_sql() -> &'static str {
    r#"
    SELECT * FROM events
    WHERE calendar_id = ? AND start_time >= ? AND start_time <= ?
    ORDER BY start_time ASC
    "#
}

pub fn search_events_sql() -> &'static str {
    r#"
    SELECT events.* FROM events
    JOIN events_fts ON events.rowid = events_fts.rowid
    WHERE events_fts MATCH ?
    ORDER BY rank
    LIMIT ?
    "#
}

pub fn insert_calendar_sql() -> &'static str {
    r#"
    INSERT INTO calendars (
        id, account_id, name, color, is_visible,
        is_primary, is_readonly, remote_id, sync_token,
        created_at, updated_at
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
    )
    "#
}

pub fn update_calendar_sql() -> &'static str {
    r#"
    UPDATE calendars SET
        name = ?,
        color = ?,
        is_visible = ?,
        is_primary = ?,
        is_readonly = ?,
        remote_id = ?,
        sync_token = ?,
        updated_at = ?
    WHERE id = ?
    "#
}

pub fn delete_calendar_sql() -> &'static str {
    "DELETE FROM calendars WHERE id = ?"
}

pub fn get_calendar_sql() -> &'static str {
    "SELECT * FROM calendars WHERE id = ?"
}

pub fn get_calendars_by_account_sql() -> &'static str {
    "SELECT * FROM calendars WHERE account_id = ? ORDER BY name ASC"
}

pub fn get_all_calendars_sql() -> &'static str {
    "SELECT * FROM calendars ORDER BY name ASC"
}

pub fn insert_account_sql() -> &'static str {
    r#"
    INSERT INTO accounts (
        id, provider, email, display_name, is_enabled,
        last_sync, sync_status, created_at, updated_at
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
    )
    "#
}

pub fn update_account_sql() -> &'static str {
    r#"
    UPDATE accounts SET
        email = ?,
        display_name = ?,
        is_enabled = ?,
        last_sync = ?,
        sync_status = ?,
        updated_at = ?
    WHERE id = ?
    "#
}

pub fn delete_account_sql() -> &'static str {
    "DELETE FROM accounts WHERE id = ?"
}

pub fn get_account_sql() -> &'static str {
    "SELECT * FROM accounts WHERE id = ?"
}

pub fn get_all_accounts_sql() -> &'static str {
    "SELECT * FROM accounts ORDER BY created_at ASC"
}

pub fn insert_notification_sql() -> &'static str {
    r#"
    INSERT INTO notifications (
        id, event_id, trigger_time, title, body,
        has_video_link, video_url, created_at
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?
    )
    "#
}

pub fn get_upcoming_notifications_sql() -> &'static str {
    r#"
    SELECT * FROM notifications
    WHERE trigger_time >= ? AND trigger_time <= ?
    AND dismissed = 0 AND triggered = 0
    ORDER BY trigger_time ASC
    "#
}

pub fn mark_notification_triggered_sql() -> &'static str {
    "UPDATE notifications SET triggered = 1 WHERE id = ?"
}

pub fn dismiss_notification_sql() -> &'static str {
    "UPDATE notifications SET dismissed = 1 WHERE id = ?"
}

pub fn snooze_notification_sql() -> &'static str {
    "UPDATE notifications SET trigger_time = ?, snoozed = 1 WHERE id = ?"
}

pub fn delete_notification_sql() -> &'static str {
    "DELETE FROM notifications WHERE id = ?"
}

pub fn delete_notifications_by_event_sql() -> &'static str {
    "DELETE FROM notifications WHERE event_id = ?"
}

pub fn insert_offline_change_sql() -> &'static str {
    r#"
    INSERT INTO offline_queue (event_id, change_type, data, created_at)
    VALUES (?, ?, ?, ?)
    "#
}

pub fn get_offline_queue_sql() -> &'static str {
    "SELECT * FROM offline_queue ORDER BY created_at ASC"
}

pub fn delete_offline_change_sql() -> &'static str {
    "DELETE FROM offline_queue WHERE id = ?"
}

pub fn clear_offline_queue_sql() -> &'static str {
    "DELETE FROM offline_queue"
}

pub fn upsert_sync_token_sql() -> &'static str {
    r#"
    INSERT INTO sync_tokens (account_id, calendar_id, token, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(account_id, calendar_id) DO UPDATE SET
        token = excluded.token,
        updated_at = excluded.updated_at
    "#
}

pub fn get_sync_token_sql() -> &'static str {
    "SELECT token FROM sync_tokens WHERE account_id = ? AND (calendar_id = ? OR calendar_id IS NULL)"
}
