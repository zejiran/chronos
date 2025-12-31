#![allow(dead_code)]

use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const GOOGLE_CALENDAR_API_BASE: &str = "https://www.googleapis.com/calendar/v3";

pub struct GoogleCalendarClient {
    client: Client,
    access_token: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleCalendarList {
    pub kind: String,
    pub etag: String,
    pub next_page_token: Option<String>,
    pub next_sync_token: Option<String>,
    pub items: Vec<GoogleCalendar>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleCalendar {
    pub id: String,
    pub summary: String,
    pub description: Option<String>,
    pub time_zone: Option<String>,
    pub color_id: Option<String>,
    pub background_color: Option<String>,
    pub foreground_color: Option<String>,
    pub selected: Option<bool>,
    pub primary: Option<bool>,
    pub access_role: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleEventList {
    pub kind: String,
    pub etag: String,
    pub summary: String,
    pub updated: String,
    pub time_zone: String,
    pub access_role: String,
    pub next_page_token: Option<String>,
    pub next_sync_token: Option<String>,
    pub items: Vec<GoogleEvent>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleEvent {
    pub id: String,
    pub status: Option<String>,
    pub html_link: Option<String>,
    pub created: Option<String>,
    pub updated: Option<String>,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub location: Option<String>,
    pub color_id: Option<String>,
    pub creator: Option<GoogleEventPerson>,
    pub organizer: Option<GoogleEventPerson>,
    pub start: GoogleEventDateTime,
    pub end: GoogleEventDateTime,
    pub recurrence: Option<Vec<String>>,
    pub recurring_event_id: Option<String>,
    pub attendees: Option<Vec<GoogleEventAttendee>>,
    pub conference_data: Option<GoogleConferenceData>,
    pub reminders: Option<GoogleEventReminders>,
    pub etag: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleEventDateTime {
    pub date: Option<String>,
    pub date_time: Option<String>,
    pub time_zone: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleEventPerson {
    pub id: Option<String>,
    pub email: Option<String>,
    pub display_name: Option<String>,
    #[serde(rename = "self")]
    pub is_self: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleEventAttendee {
    pub id: Option<String>,
    pub email: String,
    pub display_name: Option<String>,
    pub organizer: Option<bool>,
    #[serde(rename = "self")]
    pub is_self: Option<bool>,
    pub resource: Option<bool>,
    pub optional: Option<bool>,
    pub response_status: Option<String>,
    pub comment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleConferenceData {
    pub entry_points: Option<Vec<GoogleEntryPoint>>,
    pub conference_solution: Option<GoogleConferenceSolution>,
    pub conference_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleEntryPoint {
    pub entry_point_type: String,
    pub uri: String,
    pub label: Option<String>,
    pub pin: Option<String>,
    pub access_code: Option<String>,
    pub meeting_code: Option<String>,
    pub passcode: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleConferenceSolution {
    pub key: GoogleConferenceSolutionKey,
    pub name: String,
    pub icon_uri: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleConferenceSolutionKey {
    #[serde(rename = "type")]
    pub solution_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleEventReminders {
    pub use_default: bool,
    pub overrides: Option<Vec<GoogleReminder>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleReminder {
    pub method: String,
    pub minutes: i32,
}

impl GoogleCalendarClient {
    pub fn new(access_token: String) -> Self {
        Self {
            client: Client::new(),
            access_token,
        }
    }

    pub async fn list_calendars(&self) -> Result<GoogleCalendarList> {
        let url = format!("{}/users/me/calendarList", GOOGLE_CALENDAR_API_BASE);

        let response = self
            .client
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to list calendars: {}",
                response.status()
            ));
        }

        let calendar_list: GoogleCalendarList = response.json().await?;
        Ok(calendar_list)
    }

    pub async fn list_events(
        &self,
        calendar_id: &str,
        time_min: Option<&str>,
        time_max: Option<&str>,
        sync_token: Option<&str>,
    ) -> Result<GoogleEventList> {
        let mut url = format!(
            "{}/calendars/{}/events",
            GOOGLE_CALENDAR_API_BASE,
            urlencoding::encode(calendar_id)
        );

        let mut params = Vec::new();

        if let Some(token) = sync_token {
            params.push(format!("syncToken={}", urlencoding::encode(token)));
        } else {
            if let Some(min) = time_min {
                params.push(format!("timeMin={}", urlencoding::encode(min)));
            }
            if let Some(max) = time_max {
                params.push(format!("timeMax={}", urlencoding::encode(max)));
            }
        }

        params.push("singleEvents=true".to_string());
        params.push("maxResults=2500".to_string());

        if !params.is_empty() {
            url = format!("{}?{}", url, params.join("&"));
        }

        let response = self
            .client
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to list events: {}",
                response.status()
            ));
        }

        let event_list: GoogleEventList = response.json().await?;
        Ok(event_list)
    }

    pub async fn get_event(&self, calendar_id: &str, event_id: &str) -> Result<GoogleEvent> {
        let url = format!(
            "{}/calendars/{}/events/{}",
            GOOGLE_CALENDAR_API_BASE,
            urlencoding::encode(calendar_id),
            urlencoding::encode(event_id)
        );

        let response = self
            .client
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to get event: {}",
                response.status()
            ));
        }

        let event: GoogleEvent = response.json().await?;
        Ok(event)
    }

    pub async fn create_event(
        &self,
        calendar_id: &str,
        event: &GoogleEvent,
    ) -> Result<GoogleEvent> {
        let url = format!(
            "{}/calendars/{}/events",
            GOOGLE_CALENDAR_API_BASE,
            urlencoding::encode(calendar_id)
        );

        let response = self
            .client
            .post(&url)
            .bearer_auth(&self.access_token)
            .json(event)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to create event: {}",
                response.status()
            ));
        }

        let created_event: GoogleEvent = response.json().await?;
        Ok(created_event)
    }

    pub async fn update_event(
        &self,
        calendar_id: &str,
        event_id: &str,
        event: &GoogleEvent,
    ) -> Result<GoogleEvent> {
        let url = format!(
            "{}/calendars/{}/events/{}",
            GOOGLE_CALENDAR_API_BASE,
            urlencoding::encode(calendar_id),
            urlencoding::encode(event_id)
        );

        let response = self
            .client
            .put(&url)
            .bearer_auth(&self.access_token)
            .json(event)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to update event: {}",
                response.status()
            ));
        }

        let updated_event: GoogleEvent = response.json().await?;
        Ok(updated_event)
    }

    pub async fn delete_event(&self, calendar_id: &str, event_id: &str) -> Result<()> {
        let url = format!(
            "{}/calendars/{}/events/{}",
            GOOGLE_CALENDAR_API_BASE,
            urlencoding::encode(calendar_id),
            urlencoding::encode(event_id)
        );

        let response = self
            .client
            .delete(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await?;

        if !response.status().is_success() && response.status().as_u16() != 404 {
            return Err(anyhow::anyhow!(
                "Failed to delete event: {}",
                response.status()
            ));
        }

        Ok(())
    }
}

pub fn extract_video_link(event: &GoogleEvent) -> Option<String> {
    // First check conference data
    if let Some(conf) = &event.conference_data {
        if let Some(entry_points) = &conf.entry_points {
            for ep in entry_points {
                if ep.entry_point_type == "video" {
                    return Some(ep.uri.clone());
                }
            }
        }
    }

    // Check description for meeting links
    if let Some(desc) = &event.description {
        let patterns = [
            r"https://[^\s]*\.zoom\.us/j/\d+[^\s]*",
            r"https://meet\.google\.com/[\w-]+",
            r"https://teams\.microsoft\.com/l/meetup-join/[^\s]+",
        ];

        for pattern in patterns {
            if let Ok(regex) = regex::Regex::new(pattern) {
                if let Some(m) = regex.find(desc) {
                    return Some(m.as_str().to_string());
                }
            }
        }
    }

    // Check location
    if let Some(loc) = &event.location {
        if loc.starts_with("https://")
            && (loc.contains("zoom.us")
                || loc.contains("meet.google.com")
                || loc.contains("teams.microsoft.com"))
        {
            return Some(loc.clone());
        }
    }

    None
}
