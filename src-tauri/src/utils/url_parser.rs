use regex::Regex;

#[derive(Debug, Clone, PartialEq)]
pub enum MeetingProvider {
    Zoom,
    GoogleMeet,
    MicrosoftTeams,
    Webex,
    Discord,
    Unknown,
}

#[derive(Debug, Clone)]
pub struct ParsedMeetingUrl {
    pub url: String,
    pub provider: MeetingProvider,
    pub meeting_id: Option<String>,
    pub password: Option<String>,
}

pub fn parse_meeting_url(text: &str) -> Option<ParsedMeetingUrl> {
    // Zoom patterns
    if let Some(parsed) = parse_zoom_url(text) {
        return Some(parsed);
    }

    // Google Meet patterns
    if let Some(parsed) = parse_google_meet_url(text) {
        return Some(parsed);
    }

    // Microsoft Teams patterns
    if let Some(parsed) = parse_teams_url(text) {
        return Some(parsed);
    }

    // Webex patterns
    if let Some(parsed) = parse_webex_url(text) {
        return Some(parsed);
    }

    // Discord patterns
    if let Some(parsed) = parse_discord_url(text) {
        return Some(parsed);
    }

    None
}

fn parse_zoom_url(text: &str) -> Option<ParsedMeetingUrl> {
    let url_regex = Regex::new(r"https://[^\s]*\.zoom\.us/j/(\d+)(\?pwd=([^\s&]+))?").ok()?;

    if let Some(caps) = url_regex.captures(text) {
        let url = caps.get(0)?.as_str().to_string();
        let meeting_id = caps.get(1).map(|m| m.as_str().to_string());
        let password = caps.get(3).map(|m| m.as_str().to_string());

        return Some(ParsedMeetingUrl {
            url,
            provider: MeetingProvider::Zoom,
            meeting_id,
            password,
        });
    }

    None
}

fn parse_google_meet_url(text: &str) -> Option<ParsedMeetingUrl> {
    let url_regex = Regex::new(r"https://meet\.google\.com/([\w-]+)").ok()?;

    if let Some(caps) = url_regex.captures(text) {
        let url = caps.get(0)?.as_str().to_string();
        let meeting_id = caps.get(1).map(|m| m.as_str().to_string());

        return Some(ParsedMeetingUrl {
            url,
            provider: MeetingProvider::GoogleMeet,
            meeting_id,
            password: None,
        });
    }

    None
}

fn parse_teams_url(text: &str) -> Option<ParsedMeetingUrl> {
    let url_regex = Regex::new(r"https://teams\.microsoft\.com/l/meetup-join/[^\s]+").ok()?;

    if let Some(matched) = url_regex.find(text) {
        return Some(ParsedMeetingUrl {
            url: matched.as_str().to_string(),
            provider: MeetingProvider::MicrosoftTeams,
            meeting_id: None,
            password: None,
        });
    }

    None
}

fn parse_webex_url(text: &str) -> Option<ParsedMeetingUrl> {
    let url_regex = Regex::new(r"https://[^\s]*\.webex\.com/[^\s]+").ok()?;

    if let Some(matched) = url_regex.find(text) {
        return Some(ParsedMeetingUrl {
            url: matched.as_str().to_string(),
            provider: MeetingProvider::Webex,
            meeting_id: None,
            password: None,
        });
    }

    None
}

fn parse_discord_url(text: &str) -> Option<ParsedMeetingUrl> {
    let url_regex = Regex::new(r"https://discord\.(gg|com)/[\w/]+").ok()?;

    if let Some(matched) = url_regex.find(text) {
        return Some(ParsedMeetingUrl {
            url: matched.as_str().to_string(),
            provider: MeetingProvider::Discord,
            meeting_id: None,
            password: None,
        });
    }

    None
}

pub fn create_zoom_deep_link(meeting_id: &str, password: Option<&str>) -> String {
    let mut deep_link = format!("zoommtg://zoom.us/join?confno={}", meeting_id);

    if let Some(pwd) = password {
        deep_link.push_str(&format!("&pwd={}", pwd));
    }

    deep_link
}

pub fn create_teams_deep_link(url: &str) -> String {
    // Teams URLs can be converted to deep links by replacing https:// with msteams://
    url.replace(
        "https://teams.microsoft.com",
        "msteams://teams.microsoft.com",
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_zoom_url_with_password() {
        let text = "Join the meeting at https://zoom.us/j/123456789?pwd=abc123xyz";
        let result = parse_meeting_url(text);

        assert!(result.is_some());
        let parsed = result.unwrap();
        assert_eq!(parsed.provider, MeetingProvider::Zoom);
        assert_eq!(parsed.meeting_id, Some("123456789".to_string()));
        assert_eq!(parsed.password, Some("abc123xyz".to_string()));
    }

    #[test]
    fn test_parse_zoom_url_without_password() {
        let text = "Meeting: https://zoom.us/j/987654321";
        let result = parse_meeting_url(text);

        assert!(result.is_some());
        let parsed = result.unwrap();
        assert_eq!(parsed.provider, MeetingProvider::Zoom);
        assert_eq!(parsed.meeting_id, Some("987654321".to_string()));
        assert_eq!(parsed.password, None);
    }

    #[test]
    fn test_parse_google_meet_url() {
        let text = "Let's meet at https://meet.google.com/abc-defg-hij";
        let result = parse_meeting_url(text);

        assert!(result.is_some());
        let parsed = result.unwrap();
        assert_eq!(parsed.provider, MeetingProvider::GoogleMeet);
        assert_eq!(parsed.meeting_id, Some("abc-defg-hij".to_string()));
    }

    #[test]
    fn test_parse_teams_url() {
        let text = "Join at https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc123";
        let result = parse_meeting_url(text);

        assert!(result.is_some());
        let parsed = result.unwrap();
        assert_eq!(parsed.provider, MeetingProvider::MicrosoftTeams);
    }

    #[test]
    fn test_no_meeting_url() {
        let text = "This is just regular text without any meeting URL";
        let result = parse_meeting_url(text);

        assert!(result.is_none());
    }

    #[test]
    fn test_create_zoom_deep_link() {
        let deep_link = create_zoom_deep_link("123456789", Some("abc123"));
        assert_eq!(
            deep_link,
            "zoommtg://zoom.us/join?confno=123456789&pwd=abc123"
        );
    }
}
