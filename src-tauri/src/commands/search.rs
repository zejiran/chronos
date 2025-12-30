use crate::models::Event;
use tauri::AppHandle;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub events: Vec<Event>,
    pub total: usize,
}

#[tauri::command]
pub async fn search_events(
    app: AppHandle,
    query: String,
    limit: Option<usize>,
) -> Result<SearchResult, String> {
    let limit = limit.unwrap_or(50);

    // TODO: Implement full-text search using SQLite FTS5
    // For now, return empty results

    Ok(SearchResult {
        events: Vec::new(),
        total: 0,
    })
}
