mod commands;
mod db;
mod models;
mod sync;
mod utils;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = db::init_database(&app_handle).await {
                    log::error!("Failed to initialize database: {}", e);
                }
            });

            // Watch for settings changes
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                if let Err(e) = commands::config::watch_settings_changes(app_handle) {
                    log::error!("Failed to watch settings: {}", e);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Config commands
            commands::config::get_settings,
            commands::config::update_settings,
            commands::config::reset_settings,
            commands::config::get_config_path,
            // Calendar commands
            commands::calendar::get_events,
            commands::calendar::get_event,
            commands::calendar::create_event,
            commands::calendar::update_event,
            commands::calendar::delete_event,
            commands::calendar::get_calendars,
            commands::calendar::create_calendar,
            commands::calendar::update_calendar,
            commands::calendar::delete_calendar,
            // Account commands
            commands::accounts::get_accounts,
            commands::accounts::add_account,
            commands::accounts::remove_account,
            commands::accounts::sync_account,
            commands::accounts::sync_all_accounts,
            // OAuth commands
            commands::oauth::start_google_oauth,
            commands::oauth::start_microsoft_oauth,
            commands::oauth::handle_oauth_callback,
            // Deep link commands
            commands::deep_links::join_video_call,
            commands::deep_links::detect_meeting_url,
            // Notification commands
            commands::notifications::schedule_notification,
            commands::notifications::cancel_notification,
            commands::notifications::get_upcoming_notifications,
            // Search commands
            commands::search::search_events,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
