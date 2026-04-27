
-- Part 2: Content (Posts, Reactions, Comments, Jobs)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_featured INTEGER DEFAULT 0,
    is_school_update INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'public',
    tags TEXT, -- JSON
    attachments TEXT, -- JSON
    external_links TEXT, -- JSON
    shared_post_id TEXT,
    share_type TEXT,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_post_id) REFERENCES posts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS post_reactions (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT DEFAULT 'like',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);

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
    requirements TEXT,
    benefits TEXT,
    posted_by_id TEXT NOT NULL,
    posted_by_name TEXT NOT NULL,
    application_url TEXT,
    contact_email TEXT,
    is_alumni_referral INTEGER DEFAULT 1,
    application_deadline TEXT,
    is_active INTEGER DEFAULT 1,
    application_count INTEGER DEFAULT 0,
    tags TEXT, -- JSON
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (posted_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
