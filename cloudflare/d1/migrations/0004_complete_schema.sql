
-- Full Migration for MPSAJMER CONNECT
PRAGMA foreign_keys = ON;

-- Users (Updated with more fields)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'USER', -- USER, ADMIN, SUPERADMIN, MODERATOR
  status TEXT DEFAULT 'pending', -- pending, approved, suspended
  bio TEXT,
  headline TEXT,
  profile_image TEXT,
  city TEXT,
  country TEXT,
  company TEXT,
  job_title TEXT,
  graduation_year INTEGER,
  class_year INTEGER,
  is_available_as_mentor BOOLEAN DEFAULT 0,
  linkedin_profile TEXT,
  skills TEXT, -- JSON array
  interests TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_featured BOOLEAN DEFAULT 0,
  is_school_update BOOLEAN DEFAULT 0,
  visibility TEXT DEFAULT 'public',
  tags TEXT,
  attachments TEXT,
  external_links TEXT,
  shared_post_id TEXT,
  share_type TEXT,
  share_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  action_url TEXT,
  metadata TEXT,
  is_seen BOOLEAN DEFAULT 0,
  seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  end_date TEXT,
  time TEXT,
  location TEXT,
  organizer_id TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  status TEXT DEFAULT 'upcoming',
  image_url TEXT,
  is_school_event BOOLEAN DEFAULT 0,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL,
  privacy TEXT DEFAULT 'public',
  category TEXT DEFAULT 'professional',
  member_count INTEGER DEFAULT 0,
  last_activity TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  job_type TEXT, -- Full-time, Part-time, Internship, Freelance
  category TEXT,
  poster_id TEXT NOT NULL,
  apply_url TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (poster_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Files (R2)
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  original_name TEXT,
  mimetype TEXT,
  size INTEGER,
  url TEXT NOT NULL,
  uploaded_by_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);
