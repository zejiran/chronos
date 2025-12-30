use crate::models::Event;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ConflictStrategy {
    RemoteWins,
    LocalWins,
    MostRecent,
    Ask,
}

impl ConflictStrategy {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "local_wins" | "localwins" => ConflictStrategy::LocalWins,
            "most_recent" | "mostrecent" => ConflictStrategy::MostRecent,
            "ask" => ConflictStrategy::Ask,
            _ => ConflictStrategy::RemoteWins,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ConflictInfo {
    pub event_id: String,
    pub local_event: Event,
    pub remote_event: Event,
    pub detected_at: DateTime<Utc>,
}

pub struct ConflictResolver {
    strategy: ConflictStrategy,
}

impl ConflictResolver {
    pub fn new(strategy: ConflictStrategy) -> Self {
        Self { strategy }
    }

    pub fn resolve(&self, local: Event, remote: Event) -> ResolvedConflict {
        match self.strategy {
            ConflictStrategy::RemoteWins => ResolvedConflict {
                winner: ConflictWinner::Remote,
                event: remote,
                needs_user_input: false,
            },
            ConflictStrategy::LocalWins => ResolvedConflict {
                winner: ConflictWinner::Local,
                event: local,
                needs_user_input: false,
            },
            ConflictStrategy::MostRecent => {
                if remote.updated_at > local.updated_at {
                    ResolvedConflict {
                        winner: ConflictWinner::Remote,
                        event: remote,
                        needs_user_input: false,
                    }
                } else {
                    ResolvedConflict {
                        winner: ConflictWinner::Local,
                        event: local,
                        needs_user_input: false,
                    }
                }
            }
            ConflictStrategy::Ask => ResolvedConflict {
                winner: ConflictWinner::Unknown,
                event: remote.clone(),
                needs_user_input: true,
            },
        }
    }

    pub fn has_conflict(&self, local: &Event, remote: &Event) -> bool {
        // Check if the events have diverged
        if local.etag.is_some() && remote.etag.is_some() {
            // Different etags with local changes means conflict
            local.etag != remote.etag && local.updated_at != remote.updated_at
        } else {
            // No etags, compare updated timestamps
            // Conflict if both have been modified since last sync
            local.updated_at != remote.updated_at
        }
    }

    pub fn detect_changes(&self, local: &Event, remote: &Event) -> ChangeType {
        if local.title != remote.title
            || local.description != remote.description
            || local.location != remote.location
            || local.start_time != remote.start_time
            || local.end_time != remote.end_time
            || local.all_day != remote.all_day
            || local.recurrence_rule != remote.recurrence_rule
        {
            if local.updated_at > remote.updated_at {
                ChangeType::LocalModified
            } else {
                ChangeType::RemoteModified
            }
        } else {
            ChangeType::NoChange
        }
    }
}

#[derive(Debug, Clone)]
pub struct ResolvedConflict {
    pub winner: ConflictWinner,
    pub event: Event,
    pub needs_user_input: bool,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ConflictWinner {
    Local,
    Remote,
    Merged,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ChangeType {
    NoChange,
    LocalModified,
    RemoteModified,
    BothModified,
}

pub fn merge_events(local: &Event, remote: &Event) -> Event {
    // Create a merged event taking the most recent changes for each field
    let mut merged = remote.clone();

    // Keep local changes if they're more recent for specific fields
    if local.updated_at > remote.updated_at {
        merged.title = local.title.clone();
        merged.description = local.description.clone();
        merged.location = local.location.clone();
        merged.start_time = local.start_time;
        merged.end_time = local.end_time;
        merged.all_day = local.all_day;
        merged.recurrence_rule = local.recurrence_rule.clone();
        merged.color = local.color.clone();
        merged.reminders = local.reminders.clone();
        merged.video_link = local.video_link.clone();
    }

    // Always update the merged timestamp
    merged.updated_at = Utc::now();

    merged
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    fn create_test_event(title: &str, updated_offset_hours: i64) -> Event {
        let base_time = Utc::now();
        Event {
            id: uuid::Uuid::new_v4().to_string(),
            calendar_id: "test".to_string(),
            title: title.to_string(),
            description: None,
            location: None,
            start_time: base_time,
            end_time: base_time + Duration::hours(1),
            all_day: false,
            recurrence_rule: None,
            color: None,
            reminders: vec![15],
            attendees: Vec::new(),
            video_link: None,
            status: crate::models::EventStatus::Confirmed,
            visibility: crate::models::EventVisibility::Default,
            created_at: base_time - Duration::days(1),
            updated_at: base_time + Duration::hours(updated_offset_hours),
            remote_id: None,
            etag: Some("etag123".to_string()),
        }
    }

    #[test]
    fn test_remote_wins_strategy() {
        let resolver = ConflictResolver::new(ConflictStrategy::RemoteWins);
        let local = create_test_event("Local Event", 0);
        let remote = create_test_event("Remote Event", -1);

        let result = resolver.resolve(local, remote);
        assert_eq!(result.winner, ConflictWinner::Remote);
        assert_eq!(result.event.title, "Remote Event");
    }

    #[test]
    fn test_local_wins_strategy() {
        let resolver = ConflictResolver::new(ConflictStrategy::LocalWins);
        let local = create_test_event("Local Event", 0);
        let remote = create_test_event("Remote Event", 1);

        let result = resolver.resolve(local, remote);
        assert_eq!(result.winner, ConflictWinner::Local);
        assert_eq!(result.event.title, "Local Event");
    }

    #[test]
    fn test_most_recent_strategy() {
        let resolver = ConflictResolver::new(ConflictStrategy::MostRecent);

        // Remote is more recent
        let local = create_test_event("Local Event", 0);
        let remote = create_test_event("Remote Event", 1);

        let result = resolver.resolve(local.clone(), remote);
        assert_eq!(result.winner, ConflictWinner::Remote);

        // Local is more recent
        let local = create_test_event("Local Event", 2);
        let remote = create_test_event("Remote Event", 1);

        let result = resolver.resolve(local, remote);
        assert_eq!(result.winner, ConflictWinner::Local);
    }
}
