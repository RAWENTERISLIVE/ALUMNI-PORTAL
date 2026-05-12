
-- Migration: 0017_fix_user_status_constraint.sql
-- Description: Update users table status CHECK constraint to include 'REJECTED'

PRAGMA foreign_keys = OFF;

-- 1. Create new table with updated constraint
CREATE TABLE users_new (
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
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED', 'REJECTED')),
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
    industry TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 2. Copy data
INSERT INTO users_new SELECT * FROM users;

-- 3. Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- 4. Re-create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

PRAGMA foreign_keys = ON;
