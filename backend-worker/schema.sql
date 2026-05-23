PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT 'anonymous',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    admission_number TEXT,
    admission_year TEXT,
    account_type TEXT DEFAULT 'ALUMNI' CHECK(account_type IN ('ALUMNI', 'FACULTY', 'STUDENT', 'STAFF')),
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
CREATE TABLE notifications (
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
CREATE TABLE connection_requests (
    id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    responded_at TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(sender_id, receiver_id)
);
CREATE TABLE follows (
    id TEXT PRIMARY KEY, follower_id TEXT NOT NULL, following_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(follower_id, following_id)
);
CREATE TABLE direct_messages (
    id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0, read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE posts (
    id TEXT PRIMARY KEY, title TEXT, content TEXT NOT NULL, author_id TEXT NOT NULL,
    category TEXT DEFAULT 'general', is_featured INTEGER DEFAULT 0, is_school_update INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'public', tags TEXT, attachments TEXT, external_links TEXT,
    shared_post_id TEXT, share_type TEXT, share_count INTEGER DEFAULT 0, comment_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, shares_count INTEGER DEFAULT 0,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_post_id) REFERENCES posts(id) ON DELETE SET NULL
);
CREATE TABLE post_reactions (
    id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL, type TEXT DEFAULT 'like',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(post_id, user_id)
);
CREATE TABLE comments (
    id TEXT PRIMARY KEY, content TEXT NOT NULL, author_id TEXT NOT NULL, post_id TEXT NOT NULL,
    parent_comment_id TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);
CREATE TABLE jobs (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, company TEXT NOT NULL, location TEXT NOT NULL, type TEXT NOT NULL,
    salary_range_min REAL, salary_range_max REAL, salary_currency TEXT DEFAULT 'USD', description TEXT NOT NULL,
    requirements TEXT, benefits TEXT, posted_by_id TEXT NOT NULL, posted_by_name TEXT NOT NULL,
    application_url TEXT, contact_email TEXT, is_alumni_referral INTEGER DEFAULT 1,
    application_deadline TEXT, is_active INTEGER DEFAULT 1, application_count INTEGER DEFAULT 0, tags TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (posted_by_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE mentorship_profiles (
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
CREATE TABLE events (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, date TEXT NOT NULL, end_date TEXT,
    time TEXT NOT NULL, location TEXT NOT NULL, organizer_id TEXT NOT NULL, max_attendees INTEGER,
    is_virtual INTEGER DEFAULT 0, meeting_link TEXT, category TEXT DEFAULT 'other', status TEXT DEFAULT 'upcoming',
    image_url TEXT, is_school_event INTEGER DEFAULT 0, tags TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), attendees_count INTEGER DEFAULT 0,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE groups (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, creator_id TEXT NOT NULL,
    privacy TEXT DEFAULT 'public', member_count INTEGER DEFAULT 0, category TEXT DEFAULT 'professional',
    last_activity TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE help_tickets (
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
CREATE TABLE files (
    id TEXT PRIMARY KEY, filename TEXT UNIQUE NOT NULL, original_name TEXT NOT NULL, mimetype TEXT NOT NULL,
    size INTEGER NOT NULL, path TEXT NOT NULL, url TEXT NOT NULL, uploaded_by_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE event_attendees (
    event_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE group_members (
    group_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE group_messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    attachments TEXT,
    reply_to_id TEXT,
    reactions TEXT,
    is_edited INTEGER DEFAULT 0,
    edited_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES group_messages(id) ON DELETE SET NULL
);
CREATE TABLE group_join_requests (
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
CREATE TABLE mentorship_requests (
    id TEXT PRIMARY KEY,
    mentee_id TEXT NOT NULL,
    mentor_profile_id TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), topic TEXT, session_mode TEXT, preferred_slot TEXT,
    FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_profile_id) REFERENCES mentorship_profiles(id) ON DELETE CASCADE
);
CREATE TABLE help_ticket_replies (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (ticket_id) REFERENCES help_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE reports (
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
CREATE TABLE saved_jobs (
    job_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (job_id, user_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE bookmarked_posts (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE job_applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    applicant_id TEXT NOT NULL,
    cover_letter TEXT,
    resume_url TEXT,
    resume_filename TEXT,
    portfolio_url TEXT,
    status TEXT DEFAULT 'pending', 
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(job_id, applicant_id)
);
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
DELETE FROM sqlite_sequence;
CREATE INDEX idx_uploads_created_at ON uploads(created_at DESC);
CREATE INDEX idx_uploads_uploaded_by ON uploads(uploaded_by);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_jobs_active ON jobs(is_active);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_mentorship_industry ON mentorship_profiles(industry);
CREATE INDEX idx_job_applications_job ON job_applications(job_id);
CREATE INDEX idx_job_applications_applicant ON job_applications(applicant_id);
