use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub provider: Provider,
    pub email: String,
    pub display_name: Option<String>,
    pub is_enabled: bool,
    pub last_sync: Option<DateTime<Utc>>,
    pub sync_status: SyncStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Provider {
    Google,
    Microsoft,
    Apple,
    CalDAV,
    Local,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SyncStatus {
    Idle,
    Syncing,
    Success,
    Error,
}

impl Account {
    pub fn new(provider: Provider, email: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            provider,
            email,
            display_name: None,
            is_enabled: true,
            last_sync: None,
            sync_status: SyncStatus::Idle,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn local_account() -> Self {
        let now = Utc::now();
        Self {
            id: "local".to_string(),
            provider: Provider::Local,
            email: "local@chronos.app".to_string(),
            display_name: Some("Local".to_string()),
            is_enabled: true,
            last_sync: None,
            sync_status: SyncStatus::Idle,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddAccountRequest {
    pub provider: Provider,
    pub email: String,
    pub caldav_url: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountCredentials {
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub caldav_url: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}
