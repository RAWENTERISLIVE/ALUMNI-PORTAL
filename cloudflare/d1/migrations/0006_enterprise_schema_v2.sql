
-- Enterprise Grade Schema Migration for MPSAJMER CONNECT (D1 SQLite)
PRAGMA foreign_keys = ON;

-- ENUM equivalent tables or CHECK constraints are used below

-- 1. Users Table
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
    is_available_as_mentor INTEGER DEFAULT 0,
    location TEXT,
    last_login TEXT,
    refresh_tokens TEXT, -- JSON array
    password_reset_token TEXT,
    password_reset_expires TEXT,
    email_verification_token TEXT,
    email_verification_expires TEXT,
    needs_manual_verification INTEGER DEFAULT 0,
    verification_details TEXT,
    faculty_id_card_url TEXT,
    has_premium_badge INTEGER DEFAULT 0,
    notification_settings TEXT, -- JSON
    privacy_settings TEXT, -- JSON
    experiences TEXT, -- JSON
    educations TEXT, -- JSON
    skills TEXT, -- JSON array
    interests TEXT, -- JSON array
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    action_url TEXT,
    metadata TEXT, -- JSON
    is_seen INTEGER DEFAULT 0,
    seen_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. ConnectionRequests Table
CREATE TABLE IF NOT EXISTS connection_requests (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    responded_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(sender_id, receiver_id)
);

-- 4. Follows Table
CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id)
);

-- 5. DirectMessages Table
CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_featured INTEGER DEFAULT 0,
    is_school_update INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'public',
    tags TEXT, -- JSON array
    attachments TEXT, -- JSON array
    external_links TEXT, -- JSON array
    shared_post_id TEXT,
    share_type TEXT,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_post_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- 7. PostReactions Table
CREATE TABLE IF NOT EXISTS post_reactions (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT DEFAULT 'like',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);

-- 8. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    parent_comment_id TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 9. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    salary_range_min REAL,
    salary_range_max REAL,
    salary_currency TEXT DEFAULT 'USD',
    description TEXT NOT NULL,
    requirements TEXT, -- JSON array
    benefits TEXT, -- JSON array
    posted_by_id TEXT NOT NULL,
    posted_by_name TEXT NOT NULL,
    application_url TEXT,
    contact_email TEXT,
    is_alumni_referral INTEGER DEFAULT 1,
    application_deadline TEXT,
    is_active INTEGER DEFAULT 1,
    application_count INTEGER DEFAULT 0,
    tags TEXT, -- JSON array
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (posted_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. MentorshipProfiles Table
CREATE TABLE IF NOT EXISTS mentorship_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    is_mentor INTEGER DEFAULT 0,
    is_seeking_mentor INTEGER DEFAULT 0,
    expertise TEXT, -- JSON array
    experience TEXT,
    industry TEXT,
    company TEXT,
    position TEXT,
    years_of_experience INTEGER DEFAULT 0,
    bio TEXT,
    availability TEXT DEFAULT 'medium',
    preferred_mentee_level TEXT, -- JSON array
    max_mentees INTEGER DEFAULT 3,
    current_mentees INTEGER DEFAULT 0,
    career_goals TEXT, -- JSON array
    current_level TEXT,
    interested_fields TEXT, -- JSON array
    mentorship_goals TEXT,
    preferred_mentor_experience TEXT,
    communication_preferences TEXT, -- JSON array
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

-- 11. MentorshipRequests Table
CREATE TABLE IF NOT EXISTS mentorship_requests (
    id TEXT PRIMARY KEY,
    mentee_id TEXT NOT NULL,
    mentor_profile_id TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_profile_id) REFERENCES mentorship_profiles(id) ON DELETE CASCADE
);

-- 12. Events Table
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
    tags TEXT, -- JSON array
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Groups Table
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

-- 14. GroupMessages Table
CREATE TABLE IF NOT EXISTS group_messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    attachments TEXT, -- JSON array
    reply_to_id TEXT,
    reactions TEXT, -- JSON
    is_edited INTEGER DEFAULT 0,
    edited_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES group_messages(id) ON DELETE SET NULL
);

-- 15. GroupJoinRequests Table
CREATE TABLE IF NOT EXISTS group_join_requests (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    requester_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    reviewed_by_id TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, requester_id)
);

-- 16. HelpTickets Table
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
    tags TEXT, -- JSON array
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 17. HelpTicketReplies Table
CREATE TABLE IF NOT EXISTS help_ticket_replies (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (ticket_id) REFERENCES help_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 18. Files Table (R2 Metadata)
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

-- 19. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    reason TEXT NOT NULL,
    reported_by_id TEXT NOT NULL,
    reported_user_id TEXT,
    reported_post_id TEXT,
    reported_comment_id TEXT,
    reported_group_id TEXT,
    reported_job_id TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    reviewed_by_id TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (reported_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 20. Join Tables (ManyToMany)
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

CREATE TABLE IF NOT EXISTS saved_jobs (
    job_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (job_id, user_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmarked_posts (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unseen ON notifications(user_id, is_seen);
CREATE INDEX IF NOT EXISTS idx_jobs_active_created ON jobs(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_direct_messages_chat ON direct_messages(sender_id, receiver_id, created_at);
