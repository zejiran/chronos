use crate::models::{Account, AddAccountRequest};
use tauri::AppHandle;

#[tauri::command]
pub async fn get_accounts(_app: AppHandle) -> Result<Vec<Account>, String> {
    // Return local account by default
    Ok(vec![Account::local_account()])
}

#[tauri::command]
pub async fn add_account(_app: AppHandle, request: AddAccountRequest) -> Result<Account, String> {
    let account = Account::new(request.provider, request.email);

    // TODO: Store credentials securely using keyring
    // TODO: Insert into database

    Ok(account)
}

#[tauri::command]
pub async fn remove_account(_app: AppHandle, _account_id: String) -> Result<(), String> {
    // TODO: Remove from database
    // TODO: Remove credentials from keyring
    Ok(())
}

#[tauri::command]
pub async fn sync_account(_app: AppHandle, _account_id: String) -> Result<SyncResult, String> {
    // TODO: Implement actual sync logic
    Ok(SyncResult {
        success: true,
        events_synced: 0,
        errors: Vec::new(),
    })
}

#[tauri::command]
pub async fn sync_all_accounts(_app: AppHandle) -> Result<Vec<SyncResult>, String> {
    // TODO: Sync all accounts
    Ok(Vec::new())
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub success: bool,
    pub events_synced: usize,
    pub errors: Vec<String>,
}
