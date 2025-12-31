#[allow(dead_code)]
pub const CREATE_TABLES_SQL: &str = r#"
-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    provider TEXT NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    last_sync TEXT,
    sync_status TEXT NOT NULL DEFAULT 'idle',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Calendars table
CREATE TABLE IF NOT EXISTS calendars (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    is_visible INTEGER NOT NULL DEFAULT 1,
    is_primary INTEGER NOT NULL DEFAULT 0,
    is_readonly INTEGER NOT NULL DEFAULT 0,
    remote_id TEXT,
    sync_token TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY NOT NULL,
    calendar_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    all_day INTEGER NOT NULL DEFAULT 0,
    recurrence_rule TEXT,
    color TEXT,
    reminders TEXT NOT NULL DEFAULT '[]',
    attendees TEXT NOT NULL DEFAULT '[]',
    video_link TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    visibility TEXT NOT NULL DEFAULT 'default',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    remote_id TEXT,
    etag TEXT,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL,
    trigger_time TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    has_video_link INTEGER NOT NULL DEFAULT 0,
    video_url TEXT,
    triggered INTEGER NOT NULL DEFAULT 0,
    dismissed INTEGER NOT NULL DEFAULT 0,
    snoozed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Offline queue table
CREATE TABLE IF NOT EXISTS offline_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    change_type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Sync tokens table
CREATE TABLE IF NOT EXISTS sync_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    calendar_id TEXT,
    token TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_calendar_id ON events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_calendar_start ON events(calendar_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendars_account_id ON calendars(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_trigger_time ON notifications(trigger_time);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_tokens_account_id ON sync_tokens(account_id);

-- Full-text search for events
CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
    title,
    description,
    location,
    content='events',
    content_rowid='rowid'
);

-- Triggers to keep FTS index up to date
CREATE TRIGGER IF NOT EXISTS events_ai AFTER INSERT ON events BEGIN
    INSERT INTO events_fts(rowid, title, description, location)
    VALUES (NEW.rowid, NEW.title, NEW.description, NEW.location);
END;

CREATE TRIGGER IF NOT EXISTS events_ad AFTER DELETE ON events BEGIN
    INSERT INTO events_fts(events_fts, rowid, title, description, location)
    VALUES('delete', OLD.rowid, OLD.title, OLD.description, OLD.location);
END;

CREATE TRIGGER IF NOT EXISTS events_au AFTER UPDATE ON events BEGIN
    INSERT INTO events_fts(events_fts, rowid, title, description, location)
    VALUES('delete', OLD.rowid, OLD.title, OLD.description, OLD.location);
    INSERT INTO events_fts(rowid, title, description, location)
    VALUES (NEW.rowid, NEW.title, NEW.description, NEW.location);
END;
"#;
