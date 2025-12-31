#[allow(dead_code)]
mod queries;
#[allow(dead_code)]
mod schema;

#[allow(unused_imports)]
pub use queries::*;
#[allow(unused_imports)]
pub use schema::*;

use anyhow::Result;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub async fn init_database(app: &AppHandle) -> Result<()> {
    let db_path = get_database_path(app)?;

    // Ensure the directory exists
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // Create database file if it doesn't exist
    if !db_path.exists() {
        std::fs::File::create(&db_path)?;
    }

    log::info!("Database initialized at: {:?}", db_path);

    Ok(())
}

pub fn get_database_path(app: &AppHandle) -> Result<PathBuf> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| anyhow::anyhow!("Failed to get app data dir: {}", e))?;

    Ok(app_data_dir.join("chronos.db"))
}

#[allow(dead_code)]
pub fn get_database_url(app: &AppHandle) -> Result<String> {
    let db_path = get_database_path(app)?;
    Ok(format!("sqlite:{}", db_path.to_string_lossy()))
}
