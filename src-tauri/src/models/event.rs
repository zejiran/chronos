use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub id: String,
    pub calendar_id: String,
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub all_day: bool,
    pub recurrence_rule: Option<String>,
    pub color: Option<String>,
    pub reminders: Vec<i32>,
    pub attendees: Vec<Attendee>,
    pub video_link: Option<String>,
    pub status: EventStatus,
    pub visibility: EventVisibility,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub remote_id: Option<String>,
    pub etag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Attendee {
    pub email: String,
    pub name: Option<String>,
    pub status: AttendeeStatus,
    pub is_organizer: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AttendeeStatus {
    Pending,
    Accepted,
    Declined,
    Tentative,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum EventStatus {
    Confirmed,
    Tentative,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum EventVisibility {
    Public,
    Private,
    Default,
}

impl Event {
    pub fn new(
        calendar_id: String,
        title: String,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            calendar_id,
            title,
            description: None,
            location: None,
            start_time,
            end_time,
            all_day: false,
            recurrence_rule: None,
            color: None,
            reminders: vec![15, 5],
            attendees: Vec::new(),
            video_link: None,
            status: EventStatus::Confirmed,
            visibility: EventVisibility::Default,
            created_at: now,
            updated_at: now,
            remote_id: None,
            etag: None,
        }
    }

    pub fn has_video_call(&self) -> bool {
        self.video_link.is_some()
            || self.description.as_ref().map_or(false, |d| {
                d.contains("zoom.us")
                    || d.contains("meet.google.com")
                    || d.contains("teams.microsoft.com")
                    || d.contains("webex.com")
            })
            || self.location.as_ref().map_or(false, |l| {
                l.contains("zoom.us")
                    || l.contains("meet.google.com")
                    || l.contains("teams.microsoft.com")
                    || l.contains("webex.com")
            })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEventRequest {
    pub calendar_id: String,
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub all_day: bool,
    pub recurrence_rule: Option<String>,
    pub color: Option<String>,
    pub reminders: Option<Vec<i32>>,
    pub video_link: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEventRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub all_day: Option<bool>,
    pub recurrence_rule: Option<String>,
    pub color: Option<String>,
    pub reminders: Option<Vec<i32>>,
    pub video_link: Option<String>,
    pub status: Option<EventStatus>,
}
