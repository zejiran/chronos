use crate::models::Settings;
use anyhow::Result;
use notify::{recommended_watcher, Event as NotifyEvent, RecursiveMode, Watcher};
use std::fs;
use std::path::PathBuf;
use std::sync::mpsc::channel;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

fn get_config_dir() -> Result<PathBuf> {
    let base =
        dirs::config_dir().ok_or_else(|| anyhow::anyhow!("Could not find config directory"))?;
    Ok(base.join("chronos"))
}

fn get_config_path_internal() -> Result<PathBuf> {
    Ok(get_config_dir()?.join("settings.json"))
}

fn ensure_config_dir() -> Result<()> {
    let config_dir = get_config_dir()?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)?;
    }
    Ok(())
}

fn load_settings() -> Result<Settings> {
    let config_path = get_config_path_internal()?;

    if !config_path.exists() {
        let default = Settings::default();
        save_settings(&default)?;
        return Ok(default);
    }

    let content = fs::read_to_string(config_path)?;
    let settings: Settings = serde_json::from_str(&content)?;
    Ok(settings)
}

fn save_settings(settings: &Settings) -> Result<()> {
    ensure_config_dir()?;
    let config_path = get_config_path_internal()?;
    let content = serde_json::to_string_pretty(settings)?;
    fs::write(config_path, content)?;
    Ok(())
}

#[tauri::command]
pub async fn get_settings() -> Result<Settings, String> {
    load_settings().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_settings(settings: Settings) -> Result<(), String> {
    save_settings(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reset_settings() -> Result<Settings, String> {
    let default = Settings::default();
    save_settings(&default).map_err(|e| e.to_string())?;
    Ok(default)
}

#[tauri::command]
pub async fn get_config_path() -> Result<String, String> {
    get_config_path_internal()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

pub fn watch_settings_changes(app: AppHandle) -> Result<()> {
    let config_path = get_config_path_internal()?;

    if !config_path.exists() {
        // Create default settings file if it doesn't exist
        let default = Settings::default();
        save_settings(&default)?;
    }

    let (tx, rx) = channel();

    let mut watcher = recommended_watcher(move |res: Result<NotifyEvent, notify::Error>| {
        if let Ok(event) = res {
            if event.kind.is_modify() {
                let _ = tx.send(());
            }
        }
    })?;

    watcher.watch(&config_path, RecursiveMode::NonRecursive)?;

    loop {
        match rx.recv_timeout(Duration::from_secs(1)) {
            Ok(_) => {
                if let Ok(settings) = load_settings() {
                    let _ = app.emit("settings-changed", &settings);
                }
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => continue,
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }

    Ok(())
}
