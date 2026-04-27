
-- Part 3: Professional & Community
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS mentorship_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    is_mentor INTEGER DEFAULT 0,
    is_seeking_mentor INTEGER DEFAULT 0,
    expertise TEXT, -- JSON
    experience TEXT, -- JSON
    industry TEXT,
    company TEXT,
    position TEXT,
    years_of_experience INTEGER DEFAULT 0,
    bio TEXT,
    availability TEXT DEFAULT 'medium',
    preferred_mentee_level TEXT,
    max_mentees INTEGER DEFAULT 3,
    current_mentees INTEGER DEFAULT 0,
    career_goals TEXT,
    current_level TEXT,
    interested_fields TEXT, -- JSON
    mentorship_goals TEXT,
    preferred_mentor_experience TEXT,
    communication_preferences TEXT,
    timezone TEXT DEFAULT 'UTC',
    linkedin_url TEXT,
    portfolio_url TEXT,
    is_active INTEGER DEFAULT 1,
    rating REAL DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    successful_matches INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    end_date TEXT,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    organizer_id TEXT NOT NULL,
    max_attendees INTEGER,
    is_virtual INTEGER DEFAULT 0,
    meeting_link TEXT,
    category TEXT DEFAULT 'other',
    status TEXT DEFAULT 'upcoming',
    image_url TEXT,
    is_school_event INTEGER DEFAULT 0,
    tags TEXT, -- JSON
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    privacy TEXT DEFAULT 'public',
    member_count INTEGER DEFAULT 0,
    category TEXT DEFAULT 'professional',
    last_activity TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS help_tickets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    reported_user_id TEXT,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    created_by_id TEXT NOT NULL,
    assigned_to TEXT,
    resolution TEXT,
    resolved_at TEXT,
    tags TEXT, -- JSON
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    original_name TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_by_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_attendees (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_mentorship_industry ON mentorship_profiles(industry);
