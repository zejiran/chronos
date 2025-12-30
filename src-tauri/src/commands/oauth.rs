use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, RedirectUrl, Scope, TokenResponse, TokenUrl,
};
use tauri::AppHandle;

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const MICROSOFT_AUTH_URL: &str = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL: &str = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthStartResult {
    pub auth_url: String,
    pub state: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthTokenResult {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<u64>,
}

#[tauri::command]
pub async fn start_google_oauth(
    app: AppHandle,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
) -> Result<OAuthStartResult, String> {
    let client = BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        AuthUrl::new(GOOGLE_AUTH_URL.to_string()).map_err(|e| e.to_string())?,
        Some(TokenUrl::new(GOOGLE_TOKEN_URL.to_string()).map_err(|e| e.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_uri).map_err(|e| e.to_string())?);

    let (auth_url, csrf_token) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new(
            "https://www.googleapis.com/auth/calendar".to_string(),
        ))
        .add_scope(Scope::new(
            "https://www.googleapis.com/auth/calendar.events".to_string(),
        ))
        .add_scope(Scope::new("email".to_string()))
        .add_scope(Scope::new("profile".to_string()))
        .url();

    Ok(OAuthStartResult {
        auth_url: auth_url.to_string(),
        state: csrf_token.secret().to_string(),
    })
}

#[tauri::command]
pub async fn start_microsoft_oauth(
    app: AppHandle,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
) -> Result<OAuthStartResult, String> {
    let client = BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        AuthUrl::new(MICROSOFT_AUTH_URL.to_string()).map_err(|e| e.to_string())?,
        Some(TokenUrl::new(MICROSOFT_TOKEN_URL.to_string()).map_err(|e| e.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_uri).map_err(|e| e.to_string())?);

    let (auth_url, csrf_token) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("Calendars.ReadWrite".to_string()))
        .add_scope(Scope::new("User.Read".to_string()))
        .add_scope(Scope::new("offline_access".to_string()))
        .url();

    Ok(OAuthStartResult {
        auth_url: auth_url.to_string(),
        state: csrf_token.secret().to_string(),
    })
}

#[tauri::command]
pub async fn handle_oauth_callback(
    app: AppHandle,
    provider: String,
    code: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
) -> Result<OAuthTokenResult, String> {
    let (auth_url, token_url) = match provider.as_str() {
        "google" => (GOOGLE_AUTH_URL, GOOGLE_TOKEN_URL),
        "microsoft" => (MICROSOFT_AUTH_URL, MICROSOFT_TOKEN_URL),
        _ => return Err("Unsupported provider".to_string()),
    };

    let client = BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        AuthUrl::new(auth_url.to_string()).map_err(|e| e.to_string())?,
        Some(TokenUrl::new(token_url.to_string()).map_err(|e| e.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_uri).map_err(|e| e.to_string())?);

    let token_result = client
        .exchange_code(AuthorizationCode::new(code))
        .request_async(async_http_client)
        .await
        .map_err(|e| format!("Failed to exchange code: {}", e))?;

    Ok(OAuthTokenResult {
        access_token: token_result.access_token().secret().to_string(),
        refresh_token: token_result.refresh_token().map(|t| t.secret().to_string()),
        expires_in: token_result.expires_in().map(|d| d.as_secs()),
    })
}
