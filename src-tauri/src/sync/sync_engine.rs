use crate::models::{Account, Event, Provider, SyncStatus};
use anyhow::Result;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use tokio::time::{interval, Duration};

#[derive(Debug, Clone)]
pub struct SyncEngine {
    sync_interval: Duration,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub success: bool,
    pub events_synced: usize,
    pub calendars_synced: usize,
    pub errors: Vec<String>,
    pub sync_token: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IncrementalSyncResult {
    pub new_sync_token: Option<String>,
    pub added: usize,
    pub modified: usize,
    pub deleted: usize,
}

#[derive(Debug, Clone)]
pub struct SyncChanges {
    pub added: Vec<Event>,
    pub modified: Vec<Event>,
    pub deleted: Vec<String>,
    pub next_sync_token: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OfflineChange {
    pub id: i64,
    pub event_id: String,
    pub change_type: ChangeType,
    pub data: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChangeType {
    Create,
    Update,
    Delete,
}

impl Default for SyncResult {
    fn default() -> Self {
        Self {
            success: true,
            events_synced: 0,
            calendars_synced: 0,
            errors: Vec::new(),
            sync_token: None,
        }
    }
}

impl Default for IncrementalSyncResult {
    fn default() -> Self {
        Self {
            new_sync_token: None,
            added: 0,
            modified: 0,
            deleted: 0,
        }
    }
}

impl SyncEngine {
    pub fn new() -> Self {
        Self {
            sync_interval: Duration::from_secs(300), // 5 minutes
        }
    }

    pub fn with_interval(interval_secs: u64) -> Self {
        Self {
            sync_interval: Duration::from_secs(interval_secs),
        }
    }

    pub async fn sync_account(&self, account: &Account) -> Result<SyncResult> {
        match account.provider {
            Provider::Google => self.sync_google(account).await,
            Provider::Microsoft => self.sync_microsoft(account).await,
            Provider::Apple | Provider::CalDAV => self.sync_caldav(account).await,
            Provider::Local => Ok(SyncResult::default()),
        }
    }

    pub async fn incremental_sync(
        &self,
        account: &Account,
        sync_token: Option<String>,
    ) -> Result<IncrementalSyncResult> {
        let changes = match account.provider {
            Provider::Google => self.fetch_google_changes(account, sync_token).await?,
            Provider::Microsoft => self.fetch_microsoft_changes(account, sync_token).await?,
            Provider::Apple | Provider::CalDAV => {
                self.fetch_caldav_changes(account, sync_token).await?
            }
            Provider::Local => return Ok(IncrementalSyncResult::default()),
        };

        Ok(IncrementalSyncResult {
            new_sync_token: changes.next_sync_token,
            added: changes.added.len(),
            modified: changes.modified.len(),
            deleted: changes.deleted.len(),
        })
    }

    async fn sync_google(&self, account: &Account) -> Result<SyncResult> {
        // TODO: Implement Google Calendar API sync
        log::info!("Syncing Google account: {}", account.email);
        Ok(SyncResult::default())
    }

    async fn sync_microsoft(&self, account: &Account) -> Result<SyncResult> {
        // TODO: Implement Microsoft Graph API sync
        log::info!("Syncing Microsoft account: {}", account.email);
        Ok(SyncResult::default())
    }

    async fn sync_caldav(&self, account: &Account) -> Result<SyncResult> {
        // TODO: Implement CalDAV sync
        log::info!("Syncing CalDAV account: {}", account.email);
        Ok(SyncResult::default())
    }

    async fn fetch_google_changes(
        &self,
        account: &Account,
        sync_token: Option<String>,
    ) -> Result<SyncChanges> {
        // TODO: Implement Google Calendar incremental sync
        Ok(SyncChanges {
            added: Vec::new(),
            modified: Vec::new(),
            deleted: Vec::new(),
            next_sync_token: sync_token,
        })
    }

    async fn fetch_microsoft_changes(
        &self,
        account: &Account,
        sync_token: Option<String>,
    ) -> Result<SyncChanges> {
        // TODO: Implement Microsoft Graph incremental sync
        Ok(SyncChanges {
            added: Vec::new(),
            modified: Vec::new(),
            deleted: Vec::new(),
            next_sync_token: sync_token,
        })
    }

    async fn fetch_caldav_changes(
        &self,
        account: &Account,
        sync_token: Option<String>,
    ) -> Result<SyncChanges> {
        // TODO: Implement CalDAV sync-collection
        Ok(SyncChanges {
            added: Vec::new(),
            modified: Vec::new(),
            deleted: Vec::new(),
            next_sync_token: sync_token,
        })
    }

    pub async fn start_background_sync<F>(&self, get_accounts: F)
    where
        F: Fn() -> Vec<Account> + Send + 'static,
    {
        let mut interval = interval(self.sync_interval);

        loop {
            interval.tick().await;

            let accounts = get_accounts();
            for account in accounts {
                if account.is_enabled && account.provider != Provider::Local {
                    if let Err(e) = self.sync_account(&account).await {
                        log::error!("Background sync failed for account {}: {:?}", account.id, e);
                    }
                }
            }
        }
    }
}

impl Default for SyncEngine {
    fn default() -> Self {
        Self::new()
    }
}
