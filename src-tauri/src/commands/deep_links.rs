use regex::Regex;
use std::process::Command;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MeetingType {
    Zoom,
    GoogleMeet,
    MicrosoftTeams,
    Webex,
    Discord,
    Custom,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeetingUrlResult {
    pub url: String,
    pub meeting_type: MeetingType,
}

#[tauri::command]
pub async fn join_video_call(url: String, meeting_type: MeetingType) -> Result<(), String> {
    let final_url = match meeting_type {
        MeetingType::Zoom => convert_to_zoom_deep_link(&url)?,
        MeetingType::MicrosoftTeams => {
            // Teams URLs can be opened directly
            url.clone()
        }
        MeetingType::GoogleMeet | MeetingType::Webex | MeetingType::Custom => {
            // Open in default browser
            url.clone()
        }
        MeetingType::Discord => {
            // Discord URLs can be opened directly
            url.clone()
        }
    };

    open_url(&final_url).map_err(|e| e.to_string())
}

fn convert_to_zoom_deep_link(url: &str) -> Result<String, String> {
    let meeting_id_regex = Regex::new(r"/j/(\d+)").map_err(|e| e.to_string())?;
    let pwd_regex = Regex::new(r"[?&]pwd=([^&]+)").map_err(|e| e.to_string())?;

    let meeting_id = meeting_id_regex
        .captures(url)
        .and_then(|cap| cap.get(1))
        .ok_or("Could not extract meeting ID")?
        .as_str();

    let mut deep_link = format!("zoommtg://zoom.us/join?confno={}", meeting_id);

    if let Some(pwd_cap) = pwd_regex.captures(url) {
        if let Some(pwd) = pwd_cap.get(1) {
            deep_link.push_str(&format!("&pwd={}", pwd.as_str()));
        }
    }

    Ok(deep_link)
}

fn open_url(url: &str) -> Result<(), Box<dyn std::error::Error>> {
    open::that(url)?;
    Ok(())
}

#[tauri::command]
pub fn detect_meeting_url(text: String) -> Option<MeetingUrlResult> {
    let patterns: Vec<(&str, MeetingType)> = vec![
        (r"https://[^\s]*\.zoom\.us/j/\d+[^\s]*", MeetingType::Zoom),
        (r"https://meet\.google\.com/[\w-]+", MeetingType::GoogleMeet),
        (
            r"https://teams\.microsoft\.com/l/meetup-join/[^\s]+",
            MeetingType::MicrosoftTeams,
        ),
        (r"https://[^\s]*\.webex\.com/[^\s]+", MeetingType::Webex),
        (r"https://discord\.(gg|com)/[\w/]+", MeetingType::Discord),
    ];

    for (pattern, meeting_type) in patterns {
        if let Ok(regex) = Regex::new(pattern) {
            if let Some(matched) = regex.find(&text) {
                return Some(MeetingUrlResult {
                    url: matched.as_str().to_string(),
                    meeting_type,
                });
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_zoom_url() {
        let text = "Join us at https://zoom.us/j/123456789?pwd=abc123";
        let result = detect_meeting_url(text.to_string());
        assert!(result.is_some());
        let result = result.unwrap();
        assert_eq!(result.meeting_type, MeetingType::Zoom);
        assert!(result.url.contains("zoom.us"));
    }

    #[test]
    fn test_detect_google_meet_url() {
        let text = "Meeting link: https://meet.google.com/abc-defg-hij";
        let result = detect_meeting_url(text.to_string());
        assert!(result.is_some());
        let result = result.unwrap();
        assert_eq!(result.meeting_type, MeetingType::GoogleMeet);
    }

    #[test]
    fn test_convert_zoom_deep_link() {
        let url = "https://zoom.us/j/123456789?pwd=abc123";
        let result = convert_to_zoom_deep_link(url);
        assert!(result.is_ok());
        let deep_link = result.unwrap();
        assert!(deep_link.starts_with("zoommtg://"));
        assert!(deep_link.contains("confno=123456789"));
        assert!(deep_link.contains("pwd=abc123"));
    }
}
