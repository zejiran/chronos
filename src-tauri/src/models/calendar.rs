use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Calendar {
    pub id: String,
    pub account_id: String,
    pub name: String,
    pub color: String,
    pub is_visible: bool,
    pub is_primary: bool,
    pub is_readonly: bool,
    pub remote_id: Option<String>,
    pub sync_token: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Calendar {
    pub fn new(account_id: String, name: String, color: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            account_id,
            name,
            color,
            is_visible: true,
            is_primary: false,
            is_readonly: false,
            remote_id: None,
            sync_token: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn local_calendar() -> Self {
        let now = Utc::now();
        Self {
            id: "local".to_string(),
            account_id: "local".to_string(),
            name: "Local Calendar".to_string(),
            color: "#6366f1".to_string(),
            is_visible: true,
            is_primary: true,
            is_readonly: false,
            remote_id: None,
            sync_token: None,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCalendarRequest {
    pub account_id: String,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCalendarRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub is_visible: Option<bool>,
}
