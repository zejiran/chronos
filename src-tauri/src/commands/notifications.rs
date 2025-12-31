use chrono::{DateTime, Duration, Utc};
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;
use uuid::Uuid;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledNotification {
    pub id: String,
    pub event_id: String,
    pub trigger_time: DateTime<Utc>,
    pub title: String,
    pub body: String,
    pub has_video_link: bool,
    pub video_url: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleNotificationRequest {
    pub event_id: String,
    pub title: String,
    pub body: String,
    pub trigger_time: i64,
    pub has_video_link: bool,
    pub video_url: Option<String>,
}

#[tauri::command]
pub async fn schedule_notification(
    app: AppHandle,
    request: ScheduleNotificationRequest,
) -> Result<String, String> {
    let notification_id = Uuid::new_v4().to_string();

    // For immediate notifications (within 1 minute), show now
    let now = Utc::now();
    let trigger_time =
        DateTime::from_timestamp(request.trigger_time, 0).ok_or("Invalid trigger time")?;

    let time_until = trigger_time.signed_duration_since(now);

    if time_until <= Duration::minutes(1) {
        // Show notification immediately
        show_notification(&app, &request.title, &request.body)?;
    } else {
        // TODO: Store in database and use background task to check
        // For now, we'll rely on the frontend to trigger at the right time
    }

    Ok(notification_id)
}

#[tauri::command]
pub async fn cancel_notification(_app: AppHandle, _notification_id: String) -> Result<(), String> {
    // TODO: Remove from database
    Ok(())
}

#[tauri::command]
pub async fn get_upcoming_notifications(
    _app: AppHandle,
    _hours: i64,
) -> Result<Vec<ScheduledNotification>, String> {
    // TODO: Query from database
    Ok(Vec::new())
}

fn show_notification(app: &AppHandle, title: &str, body: &str) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| format!("Failed to show notification: {}", e))
}

#[allow(dead_code)]
pub async fn start_notification_checker(_app: AppHandle) {
    use tokio::time::{interval, Duration};

    let mut check_interval = interval(Duration::from_secs(30));

    loop {
        check_interval.tick().await;

        // TODO: Check database for notifications that should be triggered
        // and show them
    }
}
