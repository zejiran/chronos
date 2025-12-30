use crate::models::{
    Calendar, CreateCalendarRequest, CreateEventRequest, Event, EventStatus, EventVisibility,
    UpdateCalendarRequest, UpdateEventRequest,
};
use chrono::{DateTime, Utc};
use tauri::{AppHandle, State};
use tauri_plugin_sql::{Migration, MigrationKind};
use uuid::Uuid;

#[tauri::command]
pub async fn get_events(
    app: AppHandle,
    calendar_id: Option<String>,
    start: Option<String>,
    end: Option<String>,
) -> Result<Vec<Event>, String> {
    // For now, return empty array - will be implemented with actual SQL queries
    // when the database connection is properly set up
    Ok(Vec::new())
}

#[tauri::command]
pub async fn get_event(app: AppHandle, event_id: String) -> Result<Option<Event>, String> {
    Ok(None)
}

#[tauri::command]
pub async fn create_event(app: AppHandle, request: CreateEventRequest) -> Result<Event, String> {
    let now = Utc::now();
    let event = Event {
        id: Uuid::new_v4().to_string(),
        calendar_id: request.calendar_id,
        title: request.title,
        description: request.description,
        location: request.location,
        start_time: request.start_time,
        end_time: request.end_time,
        all_day: request.all_day,
        recurrence_rule: request.recurrence_rule,
        color: request.color,
        reminders: request.reminders.unwrap_or_else(|| vec![15, 5]),
        attendees: Vec::new(),
        video_link: request.video_link,
        status: EventStatus::Confirmed,
        visibility: EventVisibility::Default,
        created_at: now,
        updated_at: now,
        remote_id: None,
        etag: None,
    };

    // TODO: Insert into database

    Ok(event)
}

#[tauri::command]
pub async fn update_event(
    app: AppHandle,
    event_id: String,
    request: UpdateEventRequest,
) -> Result<Event, String> {
    // TODO: Implement with actual database update
    Err("Not implemented yet".to_string())
}

#[tauri::command]
pub async fn delete_event(app: AppHandle, event_id: String) -> Result<(), String> {
    // TODO: Implement with actual database delete
    Ok(())
}

#[tauri::command]
pub async fn get_calendars(
    app: AppHandle,
    account_id: Option<String>,
) -> Result<Vec<Calendar>, String> {
    // Return default local calendar for now
    Ok(vec![Calendar::local_calendar()])
}

#[tauri::command]
pub async fn create_calendar(
    app: AppHandle,
    request: CreateCalendarRequest,
) -> Result<Calendar, String> {
    let calendar = Calendar::new(request.account_id, request.name, request.color);

    // TODO: Insert into database

    Ok(calendar)
}

#[tauri::command]
pub async fn update_calendar(
    app: AppHandle,
    calendar_id: String,
    request: UpdateCalendarRequest,
) -> Result<Calendar, String> {
    // TODO: Implement with actual database update
    Err("Not implemented yet".to_string())
}

#[tauri::command]
pub async fn delete_calendar(app: AppHandle, calendar_id: String) -> Result<(), String> {
    // TODO: Implement with actual database delete
    Ok(())
}
