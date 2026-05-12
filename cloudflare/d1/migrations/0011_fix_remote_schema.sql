
-- Migration: Add missing columns to remote database
PRAGMA foreign_keys = ON;

-- Add missing columns to posts table
-- We use plural names to match the backend code implementation and local schema
-- ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
-- Rename/Add others if needed, but for now let's just add what's missing
-- Since share_count and comment_count already exist in remote, but backend uses plural
-- ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
-- ALTER TABLE posts ADD COLUMN shares_count INTEGER DEFAULT 0;

-- Add missing column to events table
-- ALTER TABLE events ADD COLUMN attendees_count INTEGER DEFAULT 0;
