#![allow(dead_code)]

use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const GRAPH_API_BASE: &str = "https://graph.microsoft.com/v1.0";

pub struct MicrosoftGraphClient {
    client: Client,
    access_token: String,
}

#[derive(Debug, Deserialize)]
pub struct GraphCalendarList {
    pub value: Vec<GraphCalendar>,
    #[serde(rename = "@odata.nextLink")]
    pub next_link: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphCalendar {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub hex_color: Option<String>,
    pub is_default_calendar: Option<bool>,
    pub can_share: Option<bool>,
    pub can_edit: Option<bool>,
    pub can_view_private_items: Option<bool>,
    pub owner: Option<GraphEmailAddress>,
}

#[derive(Debug, Deserialize)]
pub struct GraphEventList {
    pub value: Vec<GraphEvent>,
    #[serde(rename = "@odata.nextLink")]
    pub next_link: Option<String>,
    #[serde(rename = "@odata.deltaLink")]
    pub delta_link: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphEvent {
    pub id: String,
    pub subject: Option<String>,
    pub body: Option<GraphItemBody>,
    pub body_preview: Option<String>,
    pub start: GraphDateTimeTimeZone,
    pub end: GraphDateTimeTimeZone,
    pub location: Option<GraphLocation>,
    pub locations: Option<Vec<GraphLocation>>,
    pub is_all_day: Option<bool>,
    pub is_cancelled: Option<bool>,
    pub is_organizer: Option<bool>,
    pub recurrence: Option<GraphRecurrence>,
    pub series_master_id: Option<String>,
    pub show_as: Option<String>,
    pub importance: Option<String>,
    pub sensitivity: Option<String>,
    pub is_reminder_on: Option<bool>,
    pub reminder_minutes_before_start: Option<i32>,
    pub is_online_meeting: Option<bool>,
    pub online_meeting_provider: Option<String>,
    pub online_meeting_url: Option<String>,
    pub online_meeting: Option<GraphOnlineMeeting>,
    pub attendees: Option<Vec<GraphAttendee>>,
    pub organizer: Option<GraphRecipient>,
    pub created_date_time: Option<String>,
    pub last_modified_date_time: Option<String>,
    pub web_link: Option<String>,
    #[serde(rename = "@odata.etag")]
    pub etag: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphDateTimeTimeZone {
    pub date_time: String,
    pub time_zone: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphItemBody {
    pub content_type: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphLocation {
    pub display_name: Option<String>,
    pub location_type: Option<String>,
    pub unique_id: Option<String>,
    pub unique_id_type: Option<String>,
    pub address: Option<GraphAddress>,
    pub coordinates: Option<GraphCoordinates>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphAddress {
    pub street: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country_or_region: Option<String>,
    pub postal_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GraphCoordinates {
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GraphRecurrence {
    pub pattern: Option<GraphRecurrencePattern>,
    pub range: Option<GraphRecurrenceRange>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphRecurrencePattern {
    #[serde(rename = "type")]
    pub pattern_type: String,
    pub interval: i32,
    pub month: Option<i32>,
    pub day_of_month: Option<i32>,
    pub days_of_week: Option<Vec<String>>,
    pub first_day_of_week: Option<String>,
    pub index: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphRecurrenceRange {
    #[serde(rename = "type")]
    pub range_type: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub recurrence_time_zone: Option<String>,
    pub number_of_occurrences: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphOnlineMeeting {
    pub join_url: Option<String>,
    pub conference_id: Option<String>,
    pub toll_number: Option<String>,
    pub toll_free_number: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphAttendee {
    #[serde(rename = "type")]
    pub attendee_type: Option<String>,
    pub status: Option<GraphResponseStatus>,
    pub email_address: GraphEmailAddress,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphResponseStatus {
    pub response: String,
    pub time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphRecipient {
    pub email_address: GraphEmailAddress,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphEmailAddress {
    pub name: Option<String>,
    pub address: String,
}

impl MicrosoftGraphClient {
    pub fn new(access_token: String) -> Self {
        Self {
            client: Client::new(),
            access_token,
        }
    }

    pub async fn list_calendars(&self) -> Result<GraphCalendarList> {
        let url = format!("{}/me/calendars", GRAPH_API_BASE);

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

        let calendar_list: GraphCalendarList = response.json().await?;
        Ok(calendar_list)
    }

    pub async fn list_events(
        &self,
        calendar_id: &str,
        start_date_time: Option<&str>,
        end_date_time: Option<&str>,
    ) -> Result<GraphEventList> {
        let mut url = format!(
            "{}/me/calendars/{}/events",
            GRAPH_API_BASE,
            urlencoding::encode(calendar_id)
        );

        let mut params = Vec::new();

        if let (Some(start), Some(end)) = (start_date_time, end_date_time) {
            params.push(format!(
                "$filter=start/dateTime ge '{}' and end/dateTime le '{}'",
                start, end
            ));
        }

        params.push("$top=100".to_string());
        params.push("$orderby=start/dateTime".to_string());

        if !params.is_empty() {
            url = format!("{}?{}", url, params.join("&"));
        }

        let response = self
            .client
            .get(&url)
            .bearer_auth(&self.access_token)
            .header("Prefer", "outlook.timezone=\"UTC\"")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to list events: {}",
                response.status()
            ));
        }

        let event_list: GraphEventList = response.json().await?;
        Ok(event_list)
    }

    pub async fn delta_events(
        &self,
        calendar_id: &str,
        delta_link: Option<&str>,
    ) -> Result<GraphEventList> {
        let url = match delta_link {
            Some(link) => link.to_string(),
            None => format!(
                "{}/me/calendars/{}/events/delta",
                GRAPH_API_BASE,
                urlencoding::encode(calendar_id)
            ),
        };

        let response = self
            .client
            .get(&url)
            .bearer_auth(&self.access_token)
            .header("Prefer", "outlook.timezone=\"UTC\"")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to get delta: {}",
                response.status()
            ));
        }

        let event_list: GraphEventList = response.json().await?;
        Ok(event_list)
    }

    pub async fn get_event(&self, calendar_id: &str, event_id: &str) -> Result<GraphEvent> {
        let url = format!(
            "{}/me/calendars/{}/events/{}",
            GRAPH_API_BASE,
            urlencoding::encode(calendar_id),
            urlencoding::encode(event_id)
        );

        let response = self
            .client
            .get(&url)
            .bearer_auth(&self.access_token)
            .header("Prefer", "outlook.timezone=\"UTC\"")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to get event: {}",
                response.status()
            ));
        }

        let event: GraphEvent = response.json().await?;
        Ok(event)
    }

    pub async fn create_event(&self, calendar_id: &str, event: &GraphEvent) -> Result<GraphEvent> {
        let url = format!(
            "{}/me/calendars/{}/events",
            GRAPH_API_BASE,
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

        let created_event: GraphEvent = response.json().await?;
        Ok(created_event)
    }

    pub async fn update_event(
        &self,
        calendar_id: &str,
        event_id: &str,
        event: &GraphEvent,
    ) -> Result<GraphEvent> {
        let url = format!(
            "{}/me/calendars/{}/events/{}",
            GRAPH_API_BASE,
            urlencoding::encode(calendar_id),
            urlencoding::encode(event_id)
        );

        let response = self
            .client
            .patch(&url)
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

        let updated_event: GraphEvent = response.json().await?;
        Ok(updated_event)
    }

    pub async fn delete_event(&self, calendar_id: &str, event_id: &str) -> Result<()> {
        let url = format!(
            "{}/me/calendars/{}/events/{}",
            GRAPH_API_BASE,
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

pub fn extract_video_link(event: &GraphEvent) -> Option<String> {
    // Check online meeting URL
    if let Some(url) = &event.online_meeting_url {
        return Some(url.clone());
    }

    // Check online meeting object
    if let Some(meeting) = &event.online_meeting {
        if let Some(url) = &meeting.join_url {
            return Some(url.clone());
        }
    }

    // Check body for meeting links
    if let Some(body) = &event.body {
        let patterns = [
            r"https://[^\s]*\.zoom\.us/j/\d+[^\s]*",
            r"https://meet\.google\.com/[\w-]+",
            r"https://teams\.microsoft\.com/l/meetup-join/[^\s]+",
        ];

        for pattern in patterns {
            if let Ok(regex) = regex::Regex::new(pattern) {
                if let Some(m) = regex.find(&body.content) {
                    return Some(m.as_str().to_string());
                }
            }
        }
    }

    // Check location
    if let Some(loc) = &event.location {
        if let Some(name) = &loc.display_name {
            if name.starts_with("https://")
                && (name.contains("zoom.us")
                    || name.contains("meet.google.com")
                    || name.contains("teams.microsoft.com"))
            {
                return Some(name.clone());
            }
        }
    }

    None
}
