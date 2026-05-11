-- Add missing columns to mentorship_profiles
ALTER TABLE mentorship_profiles ADD COLUMN session_mode TEXT DEFAULT 'chat';
ALTER TABLE mentorship_profiles ADD COLUMN slots TEXT;
