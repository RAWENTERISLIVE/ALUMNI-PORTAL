
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    admission_number TEXT,
    admission_year TEXT,
    account_type TEXT DEFAULT 'ALUMNI' CHECK(account_type IN ('ALUMNI', 'FACULTY')),
    role TEXT DEFAULT 'USER' CHECK(role IN ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')),
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED')),
    is_verified INTEGER DEFAULT 0,
    profile_image TEXT,
    bio TEXT,
    headline TEXT,
    city TEXT,
    country TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    linkedin_profile TEXT,
    company TEXT,
    job_title TEXT,
    graduation_year INTEGER,
    class_year INTEGER,
    is_available_as_mentor INTEGER DEFAULT 0,
    location TEXT,
    last_login TEXT,
    refresh_tokens TEXT,
    password_reset_token TEXT,
    password_reset_expires TEXT,
    email_verification_token TEXT,
    email_verification_expires TEXT,
    needs_manual_verification INTEGER DEFAULT 0,
    verification_details TEXT,
    faculty_id_card_url TEXT,
    has_premium_badge INTEGER DEFAULT 0,
    notification_settings TEXT,
    privacy_settings TEXT,
    experiences TEXT,
    educations TEXT,
    skills TEXT,
    interests TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    action_url TEXT,
    metadata TEXT,
    is_seen INTEGER DEFAULT 0,
    seen_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS connection_requests (
    id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    responded_at TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(sender_id, receiver_id)
);
CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY, follower_id TEXT NOT NULL, following_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(follower_id, following_id)
);
CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0, read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY, title TEXT, content TEXT NOT NULL, author_id TEXT NOT NULL,
    category TEXT DEFAULT 'general', is_featured INTEGER DEFAULT 0, is_school_update INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'public', tags TEXT, attachments TEXT, external_links TEXT,
    shared_post_id TEXT, share_type TEXT, share_count INTEGER DEFAULT 0, comment_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_post_id) REFERENCES posts(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS post_reactions (
    id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL, type TEXT DEFAULT 'like',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(post_id, user_id)
);
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY, content TEXT NOT NULL, author_id TEXT NOT NULL, post_id TEXT NOT NULL,
    parent_comment_id TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, company TEXT NOT NULL, location TEXT NOT NULL, type TEXT NOT NULL,
    salary_range_min REAL, salary_range_max REAL, salary_currency TEXT DEFAULT 'USD', description TEXT NOT NULL,
    requirements TEXT, benefits TEXT, posted_by_id TEXT NOT NULL, posted_by_name TEXT NOT NULL,
    application_url TEXT, contact_email TEXT, is_alumni_referral INTEGER DEFAULT 1,
    application_deadline TEXT, is_active INTEGER DEFAULT 1, application_count INTEGER DEFAULT 0, tags TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (posted_by_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS mentorship_profiles (
    id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL, is_mentor INTEGER DEFAULT 0, is_seeking_mentor INTEGER DEFAULT 0,
    expertise TEXT, experience TEXT, industry TEXT, company TEXT, position TEXT, years_of_experience INTEGER DEFAULT 0,
    bio TEXT, availability TEXT DEFAULT 'medium', preferred_mentee_level TEXT, max_mentees INTEGER DEFAULT 3,
    current_mentees INTEGER DEFAULT 0, career_goals TEXT, current_level TEXT, interested_fields TEXT,
    mentorship_goals TEXT, preferred_mentor_experience TEXT, communication_preferences TEXT, timezone TEXT DEFAULT 'UTC',
    linkedin_url TEXT, portfolio_url TEXT, is_active INTEGER DEFAULT 1, rating REAL DEFAULT 0,
    total_ratings INTEGER DEFAULT 0, successful_matches INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, date TEXT NOT NULL, end_date TEXT,
    time TEXT NOT NULL, location TEXT NOT NULL, organizer_id TEXT NOT NULL, max_attendees INTEGER,
    is_virtual INTEGER DEFAULT 0, meeting_link TEXT, category TEXT DEFAULT 'other', status TEXT DEFAULT 'upcoming',
    image_url TEXT, is_school_event INTEGER DEFAULT 0, tags TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, creator_id TEXT NOT NULL,
    privacy TEXT DEFAULT 'public', member_count INTEGER DEFAULT 0, category TEXT DEFAULT 'professional',
    last_activity TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS help_tickets (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, reported_user_id TEXT,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    created_by_id TEXT NOT NULL, assigned_to TEXT, resolution TEXT, resolved_at TEXT, tags TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY, filename TEXT UNIQUE NOT NULL, original_name TEXT NOT NULL, mimetype TEXT NOT NULL,
    size INTEGER NOT NULL, path TEXT NOT NULL, url TEXT NOT NULL, uploaded_by_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS event_attendees (
    event_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
