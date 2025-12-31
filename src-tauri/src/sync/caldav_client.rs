#![allow(dead_code)]
#![allow(unused_variables)]

use anyhow::Result;
use reqwest::{Client, Method, StatusCode};

pub struct CalDAVClient {
    client: Client,
    base_url: String,
    username: String,
    password: String,
}

#[derive(Debug, Clone)]
pub struct CalDAVCalendar {
    pub href: String,
    pub display_name: String,
    pub color: Option<String>,
    pub ctag: Option<String>,
}

#[derive(Debug, Clone)]
pub struct CalDAVEvent {
    pub href: String,
    pub etag: String,
    pub ical_data: String,
}

impl CalDAVClient {
    pub fn new(base_url: String, username: String, password: String) -> Self {
        Self {
            client: Client::new(),
            base_url,
            username,
            password,
        }
    }

    pub async fn discover_calendars(&self) -> Result<Vec<CalDAVCalendar>> {
        let propfind_body = r#"<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:ic="http://apple.com/ns/ical/">
    <d:prop>
        <d:displayname/>
        <cs:getctag/>
        <ic:calendar-color/>
        <d:resourcetype/>
    </d:prop>
</d:propfind>"#;

        let response = self
            .client
            .request(Method::from_bytes(b"PROPFIND").unwrap(), &self.base_url)
            .basic_auth(&self.username, Some(&self.password))
            .header("Depth", "1")
            .header("Content-Type", "application/xml")
            .body(propfind_body)
            .send()
            .await?;

        if response.status() != StatusCode::MULTI_STATUS {
            return Err(anyhow::anyhow!("PROPFIND failed: {}", response.status()));
        }

        let body = response.text().await?;

        // TODO: Parse XML response properly
        // For now, return empty list
        Ok(Vec::new())
    }

    pub async fn get_events(&self, calendar_href: &str) -> Result<Vec<CalDAVEvent>> {
        let report_body = r#"<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
    <d:prop>
        <d:getetag/>
        <c:calendar-data/>
    </d:prop>
    <c:filter>
        <c:comp-filter name="VCALENDAR">
            <c:comp-filter name="VEVENT"/>
        </c:comp-filter>
    </c:filter>
</c:calendar-query>"#;

        let url = format!("{}{}", self.base_url, calendar_href);

        let response = self
            .client
            .request(Method::from_bytes(b"REPORT").unwrap(), &url)
            .basic_auth(&self.username, Some(&self.password))
            .header("Depth", "1")
            .header("Content-Type", "application/xml")
            .body(report_body)
            .send()
            .await?;

        if response.status() != StatusCode::MULTI_STATUS {
            return Err(anyhow::anyhow!("REPORT failed: {}", response.status()));
        }

        let body = response.text().await?;

        // TODO: Parse XML response properly
        Ok(Vec::new())
    }

    pub async fn get_events_in_range(
        &self,
        calendar_href: &str,
        start: &str,
        end: &str,
    ) -> Result<Vec<CalDAVEvent>> {
        let report_body = format!(
            r#"<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
    <d:prop>
        <d:getetag/>
        <c:calendar-data/>
    </d:prop>
    <c:filter>
        <c:comp-filter name="VCALENDAR">
            <c:comp-filter name="VEVENT">
                <c:time-range start="{}" end="{}"/>
            </c:comp-filter>
        </c:comp-filter>
    </c:filter>
</c:calendar-query>"#,
            start, end
        );

        let url = format!("{}{}", self.base_url, calendar_href);

        let response = self
            .client
            .request(Method::from_bytes(b"REPORT").unwrap(), &url)
            .basic_auth(&self.username, Some(&self.password))
            .header("Depth", "1")
            .header("Content-Type", "application/xml")
            .body(report_body)
            .send()
            .await?;

        if response.status() != StatusCode::MULTI_STATUS {
            return Err(anyhow::anyhow!("REPORT failed: {}", response.status()));
        }

        let body = response.text().await?;

        // TODO: Parse XML response properly
        Ok(Vec::new())
    }

    pub async fn create_event(
        &self,
        calendar_href: &str,
        uid: &str,
        ical_data: &str,
    ) -> Result<String> {
        let url = format!("{}{}/{}.ics", self.base_url, calendar_href, uid);

        let response = self
            .client
            .put(&url)
            .basic_auth(&self.username, Some(&self.password))
            .header("Content-Type", "text/calendar; charset=utf-8")
            .body(ical_data.to_string())
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("PUT failed: {}", response.status()));
        }

        // Return the ETag from the response
        let etag = response
            .headers()
            .get("ETag")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string();

        Ok(etag)
    }

    pub async fn update_event(
        &self,
        event_href: &str,
        ical_data: &str,
        etag: &str,
    ) -> Result<String> {
        let url = format!("{}{}", self.base_url, event_href);

        let response = self
            .client
            .put(&url)
            .basic_auth(&self.username, Some(&self.password))
            .header("Content-Type", "text/calendar; charset=utf-8")
            .header("If-Match", etag)
            .body(ical_data.to_string())
            .send()
            .await?;

        if response.status() == StatusCode::PRECONDITION_FAILED {
            return Err(anyhow::anyhow!("Conflict: event was modified on server"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("PUT failed: {}", response.status()));
        }

        let new_etag = response
            .headers()
            .get("ETag")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string();

        Ok(new_etag)
    }

    pub async fn delete_event(&self, event_href: &str, etag: Option<&str>) -> Result<()> {
        let url = format!("{}{}", self.base_url, event_href);

        let mut request = self
            .client
            .delete(&url)
            .basic_auth(&self.username, Some(&self.password));

        if let Some(etag) = etag {
            request = request.header("If-Match", etag);
        }

        let response = request.send().await?;

        if response.status() == StatusCode::PRECONDITION_FAILED {
            return Err(anyhow::anyhow!("Conflict: event was modified on server"));
        }

        if !response.status().is_success() && response.status() != StatusCode::NOT_FOUND {
            return Err(anyhow::anyhow!("DELETE failed: {}", response.status()));
        }

        Ok(())
    }

    pub async fn sync_collection(
        &self,
        calendar_href: &str,
        sync_token: Option<&str>,
    ) -> Result<SyncCollectionResult> {
        let sync_token_element = sync_token
            .map(|t| format!("<d:sync-token>{}</d:sync-token>", t))
            .unwrap_or_else(|| "<d:sync-token/>".to_string());

        let report_body = format!(
            r#"<?xml version="1.0" encoding="utf-8"?>
<d:sync-collection xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
    {}
    <d:sync-level>1</d:sync-level>
    <d:prop>
        <d:getetag/>
        <c:calendar-data/>
    </d:prop>
</d:sync-collection>"#,
            sync_token_element
        );

        let url = format!("{}{}", self.base_url, calendar_href);

        let response = self
            .client
            .request(Method::from_bytes(b"REPORT").unwrap(), &url)
            .basic_auth(&self.username, Some(&self.password))
            .header("Content-Type", "application/xml")
            .body(report_body)
            .send()
            .await?;

        if response.status() != StatusCode::MULTI_STATUS {
            return Err(anyhow::anyhow!("REPORT failed: {}", response.status()));
        }

        let body = response.text().await?;

        // TODO: Parse XML response properly
        Ok(SyncCollectionResult {
            changed: Vec::new(),
            deleted: Vec::new(),
            sync_token: None,
        })
    }
}

#[derive(Debug, Clone)]
pub struct SyncCollectionResult {
    pub changed: Vec<CalDAVEvent>,
    pub deleted: Vec<String>,
    pub sync_token: Option<String>,
}
